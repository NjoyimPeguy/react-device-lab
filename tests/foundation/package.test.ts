// @vitest-environment node

import { lstat, readFile, readlink } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

async function readJson(path: string): Promise<Record<string, unknown>> {
  return JSON.parse(await readFile(resolve(root, path), "utf8")) as Record<
    string,
    unknown
  >;
}

describe("package foundation", () => {
  it("declares the stable package boundary", async () => {
    const packageJson = await readJson("package.json");

    expect(packageJson["name"]).toBe("react-device-lab");
    expect(packageJson["version"]).toBe("1.1.0");
    expect(packageJson["type"]).toBe("module");
    expect(packageJson["files"]).toEqual(
      expect.arrayContaining(["dist", "LICENSE", "README.md"]),
    );
    expect(packageJson["sideEffects"]).toEqual(["**/*.css"]);
    expect(packageJson["peerDependencies"]).toEqual({
      react: "^18.2.0 || ^19.0.0",
      "react-dom": "^18.2.0 || ^19.0.0",
    });
    expect(packageJson["exports"]).toMatchObject({
      ".": {
        types: "./dist/index.d.ts",
        import: "./dist/index.js",
      },
      "./styles.css": "./dist/styles/index.css",
    });
    const scripts = packageJson["scripts"] as Record<string, unknown>;
    expect(scripts["verify"]).toEqual(
      expect.stringContaining("npm run test:a11y"),
    );
  });

  it("imports the public source under Node without browser globals", async () => {
    await expect(import("../../src/index.js")).resolves.toBeDefined();
  });

  it("provides real shared harness assets and relative Claude symlinks", async () => {
    const expectedSymlinks = new Map([
      ["CLAUDE.md", "AGENTS.md"],
      [".claude/skills", "../.agents/skills"],
      [".claude/agents", "../.agents/agents"],
      [".claude/hooks", "../.agents/hooks"],
    ]);

    for (const [path, target] of expectedSymlinks) {
      expect((await lstat(resolve(root, path))).isSymbolicLink()).toBe(true);
      expect(await readlink(resolve(root, path))).toBe(target);
    }

    for (const path of [
      "AGENTS.md",
      ".agents/skills/maintain-device-catalog/SKILL.md",
      ".agents/skills/maintain-device-catalog/agents/openai.yaml",
      ".agents/agents/package-reviewer.md",
      ".agents/hooks/check-public-neutrality.mjs",
      ".claude/settings.json",
      ".codex/config.toml",
      ".codex/hooks.json",
      ".codex/agents/package-reviewer.toml",
    ]) {
      expect((await lstat(resolve(root, path))).size, path).toBeGreaterThan(0);
    }
  });

  it("validates the checked-in harness with its repository command", () => {
    const result = spawnSync(
      process.execPath,
      [resolve(root, "scripts/validate-agent-harness.mjs")],
      { cwd: root, encoding: "utf8" },
    );

    expect(result.stderr).toBe("");
    expect(result.status).toBe(0);
  });

  it("installs the declared npm toolchain before CI installs dependencies", async () => {
    const workflow = await readFile(
      resolve(root, ".github/workflows/ci.yml"),
      "utf8",
    );
    for (const jobName of ["verify", "react-peer-range"]) {
      const job = new RegExp(
        `\\n  ${jobName}:\\n([\\s\\S]*?)(?=\\n  [a-z][a-z-]+:|$)`,
        "u",
      ).exec(workflow)?.[1];
      expect(job, `${jobName} job`).toBeDefined();

      const installToolchain =
        job?.indexOf("npm install --global npm@11.16.0") ?? -1;
      const installDependencies = job?.indexOf("npm ci") ?? -1;

      expect(installToolchain, `${jobName} npm bootstrap`).toBeGreaterThan(-1);
      expect(
        installDependencies,
        `${jobName} dependency installation`,
      ).toBeGreaterThan(installToolchain);
    }
  });

  it("runs a named Axe accessibility browser test", async () => {
    const browserTest = await readFile(
      resolve(root, "tests/browser/foundation.spec.ts"),
      "utf8",
    );

    expect(browserTest).toContain("@a11y");
    expect(browserTest).toContain("AxeBuilder");
  });
});
