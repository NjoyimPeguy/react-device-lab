import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import {
  cp,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  realpath,
  rename,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "@playwright/test";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const fixtureRoot = join(repositoryRoot, "tests", "consumer");
const artifactRoot = join(repositoryRoot, ".artifacts");
const npmCli = process.env["npm_execpath"];
if (!npmCli) {
  throw new Error(
    "Run the packed consumer proof through npm so npm_execpath is available.",
  );
}
const forbiddenPackagePaths = [
  ".agents",
  ".augments",
  ".claude",
  ".codex",
  ".github",
  "demo",
  "node_modules",
  "scripts",
  "src",
  "tests",
];

async function run(command, args, options = {}) {
  const { cwd = repositoryRoot, env = process.env } = options;
  return await new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      cwd,
      env,
      stdio: "inherit",
    });

    child.once("error", reject);
    child.once("close", (code, signal) => {
      if (code === 0) {
        resolvePromise();
        return;
      }
      reject(
        new Error(
          `${command} ${args.join(" ")} failed with ${
            signal ? `signal ${signal}` : `exit code ${String(code)}`
          }`,
        ),
      );
    });
  });
}

async function runNpm(args, options = {}) {
  await run(process.execPath, [npmCli, ...args], options);
}

async function availablePort() {
  return await new Promise((resolvePromise, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      assert(address && typeof address === "object");
      const { port } = address;
      server.close((error) => {
        if (error) reject(error);
        else resolvePromise(port);
      });
    });
  });
}

async function waitForServer(url, server) {
  let spawnError;
  const captureSpawnError = (error) => {
    spawnError = error;
  };
  server.once("error", captureSpawnError);
  try {
    for (let attempt = 0; attempt < 100; attempt += 1) {
      if (spawnError) throw spawnError;
      if (server.exitCode !== null) {
        throw new Error(
          `Consumer preview server exited with ${server.exitCode}.`,
        );
      }
      try {
        const response = await fetch(url);
        if (response.ok) return;
      } catch {
        // The server is still starting.
      }
      await new Promise((resolvePromise) => setTimeout(resolvePromise, 100));
    }
    throw new Error(`Timed out waiting for ${url}.`);
  } finally {
    server.off("error", captureSpawnError);
  }
}

async function stopServer(server) {
  if (
    !server ||
    server.exitCode !== null ||
    server.signalCode !== null
  ) {
    return;
  }
  await new Promise((resolvePromise) => {
    let forceTimer;
    const closed = () => {
      clearTimeout(forceTimer);
      resolvePromise();
    };
    server.once("close", closed);
    forceTimer = setTimeout(() => {
      if (server.exitCode === null && server.signalCode === null) {
        server.kill("SIGKILL");
      }
    }, 3000);
    server.kill("SIGTERM");
  });
}

async function listRelativeFiles(root, directory = root) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) return await listRelativeFiles(root, path);
      return [relative(root, path).split(sep).join("/")];
    }),
  );
  return nested.flat();
}

async function expectTargetLayout(frame, layout) {
  await frame.waitForFunction(
    (expected) =>
      document.querySelector("main")?.getAttribute("data-layout") === expected,
    layout,
  );
  assert.equal(
    await frame.locator("main").getAttribute("data-layout"),
    layout,
  );
  const presentation = await frame.locator("main").evaluate((main) => {
    const styles = getComputedStyle(main);
    const section = main.querySelector("section");
    if (!section) throw new Error("Responsive target section is missing.");
    const mainBox = main.getBoundingClientRect();
    const sectionBox = section.getBoundingClientRect();
    return {
      columnGap: styles.columnGap,
      columns: styles.gridTemplateColumns.trim().split(/\s+/u).length,
      paddingLeft: styles.paddingLeft,
      sectionLeft: sectionBox.left - mainBox.left,
      sectionTop: sectionBox.top - mainBox.top,
    };
  });

  if (layout === "compact") {
    assert.equal(presentation.paddingLeft, "24px");
    assert.equal(presentation.columns, 1);
    assert.equal(presentation.sectionLeft, 24);
    assert(presentation.sectionTop > 24);
  } else if (layout === "medium") {
    assert.equal(presentation.paddingLeft, "32px");
    assert.equal(presentation.columnGap, "16px");
    assert.equal(presentation.columns, 2);
    assert(presentation.sectionLeft > 32);
    assert.equal(presentation.sectionTop, 32);
  } else {
    assert.equal(presentation.paddingLeft, "48px");
    assert.equal(presentation.columnGap, "48px");
    assert.equal(presentation.columns, 2);
    assert(presentation.sectionLeft > 48);
    assert.equal(presentation.sectionTop, 48);
  }
}

async function iframeDimensions(iframe) {
  return await iframe.evaluate((element) => {
    const styles = getComputedStyle(element);
    return {
      height: Number.parseFloat(styles.height),
      width: Number.parseFloat(styles.width),
    };
  });
}

async function expectCurrentRoute(page, route) {
  await page.waitForFunction(
    (expected) =>
      document.querySelector(
        '[aria-label="Current embedded route"]',
      )?.textContent === expected,
    route,
  );
  assert.equal(
    await page
      .getByRole("status", { name: "Current embedded route" })
      .textContent(),
    route,
  );
}

async function exerciseInstalledPackage(url) {
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    const page = await context.newPage();
    const pageErrors = [];
    page.on("pageerror", (error) => pageErrors.push(error));
    await page.goto(url);

    const lab = page.getByRole("main", { name: "Device preview lab" });
    await lab.waitFor();
    assert.equal(await lab.getAttribute("data-rdl-theme"), "light");
    assert.equal(
      await lab.evaluate((element) => getComputedStyle(element).display),
      "flex",
    );
    assert.equal(
      await page
        .locator(".rdl-lab__workspace")
        .evaluate((element) => getComputedStyle(element).display),
      "grid",
    );

    const viewport = page.locator("[data-rdl-viewport-width]");
    const iframe = page.locator("iframe.rdl-preview__iframe");
    await iframe.waitFor();
    assert.equal(await viewport.getAttribute("data-rdl-viewport-width"), "440");
    assert.equal(await viewport.getAttribute("data-rdl-viewport-height"), "956");
    assert.deepEqual(await iframeDimensions(iframe), {
      height: 956,
      width: 440,
    });

    let target = page.frames().find((frame) => frame.url().includes("/target.html"));
    assert(target, "Expected the same-origin target iframe.");
    await expectTargetLayout(target, "compact");

    const scaleBefore = await page
      .locator("[data-rdl-preview-scale]")
      .getAttribute("data-rdl-preview-scale");
    await page.getByRole("button", { name: "50%" }).focus();
    await page.keyboard.press("Enter");
    assert.equal(
      await page
        .locator("[data-rdl-preview-scale]")
        .getAttribute("data-rdl-preview-scale"),
      "0.5",
    );
    assert.notEqual(scaleBefore, "0.5");
    assert.equal(await viewport.getAttribute("data-rdl-viewport-width"), "440");
    assert.equal(await viewport.getAttribute("data-rdl-viewport-height"), "956");
    assert.deepEqual(await iframeDimensions(iframe), {
      height: 956,
      width: 440,
    });

    await page.getByRole("button", { name: "Rotate viewport" }).focus();
    await page.keyboard.press("Enter");
    assert.equal(await viewport.getAttribute("data-rdl-viewport-width"), "956");
    assert.equal(await viewport.getAttribute("data-rdl-viewport-height"), "440");
    assert.deepEqual(await iframeDimensions(iframe), {
      height: 440,
      width: 956,
    });
    assert.equal(
      await page.locator("[data-rdl-device-frame]").getAttribute("data-rdl-device-id"),
      "iphone-16-pro-max",
    );
    assert.equal(
      await page.locator("[data-rdl-device-frame]").getAttribute("data-rdl-orientation"),
      "landscape",
    );

    await page.getByLabel("Custom viewport").check();
    await page.getByLabel("Custom viewport height").fill("1000");
    await page.getByLabel("Custom viewport width").fill("700");
    target = page.frames().find((frame) => frame.url().includes("/target.html"));
    assert(target, "Expected the target iframe after selecting a custom viewport.");
    await expectTargetLayout(target, "expanded");
    assert.deepEqual(await iframeDimensions(iframe), {
      height: 700,
      width: 1000,
    });

    await page.getByRole("button", { name: "Rotate viewport" }).click();
    await expectTargetLayout(target, "medium");
    assert.deepEqual(await iframeDimensions(iframe), {
      height: 1000,
      width: 700,
    });
    await page.getByLabel("Custom viewport height").fill("1200");
    await page.getByLabel("Custom viewport width").fill("1000");
    await expectTargetLayout(target, "expanded");
    assert.deepEqual(await iframeDimensions(iframe), {
      height: 1200,
      width: 1000,
    });

    await target.getByRole("button", { name: "Open reports" }).click();
    const route = "/target.html?view=reports#summary";
    await expectCurrentRoute(page, route);

    const generation = Number(
      await target
        .locator('[aria-label="Target load generation"]')
        .textContent(),
    );
    assert(Number.isInteger(generation) && generation > 0);
    await page.getByRole("button", { name: "Reload preview" }).click();
    await page.waitForFunction(
      (previous) =>
        Number(
          document
            .querySelector("iframe.rdl-preview__iframe")
            ?.contentDocument?.querySelector(
              '[aria-label="Target load generation"]',
            )?.textContent,
        ) === previous + 1,
      generation,
    );
    target = page.frames().find((frame) => frame.url().includes("/target.html"));
    assert(target, "Expected a replacement target frame after reload.");
    assert.equal(
      Number(
        await target
          .locator('[aria-label="Target load generation"]')
          .textContent(),
      ),
      generation + 1,
    );
    await expectCurrentRoute(page, route);

    const popupPromise = context.waitForEvent("page");
    await page.getByRole("button", { name: "Open preview in new tab" }).click();
    const popup = await popupPromise;
    await popup.waitForLoadState();
    const popupUrl = new URL(popup.url());
    assert.equal(`${popupUrl.pathname}${popupUrl.search}${popupUrl.hash}`, route);
    await popup.close();

    assert.deepEqual(pageErrors, []);
    await context.close();
  } finally {
    await browser.close();
  }
}

async function main() {
  await mkdir(artifactRoot, { recursive: true });
  const packageJson = JSON.parse(
    await readFile(join(repositoryRoot, "package.json"), "utf8"),
  );
  const finalTarball = join(
    artifactRoot,
    `${packageJson.name}-${packageJson.version}.tgz`,
  );
  const candidateRoot = await mkdtemp(
    join(artifactRoot, ".candidate-"),
  );
  let consumerRoot;
  let previewServer;
  try {
    await runNpm(
      [
        "pack",
        "--pack-destination",
        candidateRoot,
        "--cache",
        join(repositoryRoot, ".cache", "npm"),
      ],
    );
    assert.equal(packageJson.name, "react-device-lab");
    const candidateTarball = resolve(
      candidateRoot,
      `${packageJson.name}-${packageJson.version}.tgz`,
    );
    assert.equal((await stat(candidateTarball)).isFile(), true);

    consumerRoot = await mkdtemp(
      join(tmpdir(), "react-device-lab-packed-consumer-"),
    );
    await cp(fixtureRoot, consumerRoot, { recursive: true });
    const consumerPackagePath = join(consumerRoot, "package.json");
    const consumerPackage = JSON.parse(
      await readFile(consumerPackagePath, "utf8"),
    );
    consumerPackage.dependencies["react-device-lab"] =
      `file:${candidateTarball}`;
    await writeFile(
      consumerPackagePath,
      `${JSON.stringify(consumerPackage, null, 2)}\n`,
    );

    await runNpm(
      [
        "install",
        "--no-audit",
        "--no-fund",
        "--cache",
        join(repositoryRoot, ".cache", "npm"),
      ],
      { cwd: consumerRoot },
    );

    const installedRoot = await realpath(
      join(consumerRoot, "node_modules", "react-device-lab"),
    );
    const canonicalConsumerRoot = await realpath(consumerRoot);
    assert(
      installedRoot.startsWith(`${canonicalConsumerRoot}${sep}`),
      `Installed package escaped the clean consumer: ${installedRoot}`,
    );
    const installedFiles = await listRelativeFiles(installedRoot);
    for (const forbidden of forbiddenPackagePaths) {
      assert(
        !installedFiles.some(
          (path) => path === forbidden || path.startsWith(`${forbidden}/`),
        ),
        `Packed package exposed forbidden path ${forbidden}.`,
      );
    }
    for (const required of [
      "dist/index.d.ts",
      "dist/index.js",
      "dist/styles/index.css",
      "package.json",
    ]) {
      assert(installedFiles.includes(required), `Missing packed file ${required}.`);
    }

    await run(
      process.execPath,
      [
        "--input-type=module",
        "--eval",
        [
          'const packageUrl = import.meta.resolve("react-device-lab");',
          'const styleUrl = import.meta.resolve("react-device-lab/styles.css");',
          'if (!packageUrl.includes("/node_modules/react-device-lab/dist/index.js")) throw new Error(packageUrl);',
          'if (!styleUrl.includes("/node_modules/react-device-lab/dist/styles/index.css")) throw new Error(styleUrl);',
          'await import("react-device-lab");',
        ].join("\n"),
      ],
      { cwd: consumerRoot },
    );
    await runNpm(["run", "build"], { cwd: consumerRoot });
    assert.equal(
      (await stat(join(consumerRoot, "dist", "target.html"))).isFile(),
      true,
      "The clean consumer build omitted its responsive target document.",
    );

    const port = await availablePort();
    const viteCli = join(
      consumerRoot,
      "node_modules",
      "vite",
      "bin",
      "vite.js",
    );
    previewServer = spawn(
      process.execPath,
      [
        viteCli,
        "preview",
        "--host",
        "127.0.0.1",
        "--port",
        String(port),
        "--strictPort",
      ],
      { cwd: consumerRoot, stdio: "inherit" },
    );
    const url = `http://127.0.0.1:${port}`;
    await waitForServer(url, previewServer);
    await exerciseInstalledPackage(url);

    if (process.platform === "win32") {
      await rm(finalTarball, { force: true });
    }
    await rename(candidateTarball, finalTarball);
    console.log(`Packed consumer passed using ${finalTarball}`);
    console.log("Validated React 18 consumer compatibility; repository tests use React 19.");
  } finally {
    await stopServer(previewServer);
    await rm(candidateRoot, { force: true, recursive: true });
    if (
      consumerRoot &&
      process.env["RDL_KEEP_PACKED_CONSUMER"] === "1"
    ) {
      console.log(`Retained temporary consumer at ${consumerRoot}`);
    } else if (consumerRoot) {
      await rm(consumerRoot, { force: true, recursive: true });
    }
  }
}

await main();
