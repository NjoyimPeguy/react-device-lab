import { access, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const requiredFiles = [
  "README.md",
  "CHANGELOG.md",
  "CONTRIBUTING.md",
  "RELEASING.md",
  "SECURITY.md",
  "docs/accessibility.md",
  "docs/api.md",
  "docs/browser-support.md",
  "docs/device-data.md",
  "docs/device-frames.md",
  "docs/environment-scenarios.md",
  "docs/frameworks.md",
  "docs/iframe-and-bridge.md",
  "docs/images/device-lab-dark.png",
  "docs/images/device-lab-light.png",
  "docs/images/device-lab-narrow.png",
  "docs/theming.md",
];

const requiredReadmeLinks = [
  "docs/accessibility.md",
  "docs/api.md",
  "docs/browser-support.md",
  "docs/device-data.md",
  "docs/device-frames.md",
  "docs/environment-scenarios.md",
  "docs/frameworks.md",
  "docs/iframe-and-bridge.md",
  "RELEASING.md",
  "docs/theming.md",
  "CONTRIBUTING.md",
  "LICENSE",
  "SECURITY.md",
];

for (const path of requiredFiles) {
  await access(resolve(root, path));
}

try {
  await access(resolve(root, "docs/security.md"));
  throw new Error("Security guidance must live only in root SECURITY.md.");
} catch (error) {
  if (
    error instanceof Error &&
    "code" in error &&
    error.code === "ENOENT"
  ) {
    // Expected: root SECURITY.md is the single canonical security document.
  } else {
    throw error;
  }
}

const readme = await readFile(resolve(root, "README.md"), "utf8");
for (const link of requiredReadmeLinks) {
  if (!readme.includes(`](${link})`)) {
    throw new Error(`README is missing its ${link} documentation link.`);
  }
}

const markdownFiles = requiredFiles.filter((path) => path.endsWith(".md"));
for (const path of markdownFiles) {
  const body = await readFile(resolve(root, path), "utf8");
  for (const match of body.matchAll(/\[[^\]]+\]\(([^)]+)\)/gu)) {
    const destination = match[1];
    if (
      !destination ||
      destination.startsWith("#") ||
      /^[a-z]+:/u.test(destination)
    ) {
      continue;
    }
    const localPath = destination.split("#", 1)[0];
    if (!localPath) continue;
    await access(resolve(dirname(resolve(root, path)), localPath));
  }
}

for (const path of ["demo/main.tsx", "demo/preview/main.tsx"]) {
  const source = await readFile(resolve(root, path), "utf8");
  if (/from\s+["'](?:\.\.\/)+src\//u.test(source)) {
    throw new Error(`${path} imports an unpublished source path.`);
  }
}

const demoConfiguration = await readFile(
  resolve(root, "demo/vite.config.ts"),
  "utf8",
);
if (demoConfiguration.includes("../src")) {
  throw new Error("The demo build bypasses the package export map.");
}
const packageJson = JSON.parse(
  await readFile(resolve(root, "package.json"), "utf8"),
);
if (!packageJson.scripts?.["demo:build"]?.startsWith("npm run build &&")) {
  throw new Error("demo:build does not prepare the distributable package first.");
}

const screenshotPairs = [
  [
    "docs/images/device-lab-light.png",
    "tests/browser/demo-screenshots.spec.ts-snapshots/demo-light-desktop-chromium-linux.png",
  ],
  [
    "docs/images/device-lab-dark.png",
    "tests/browser/demo-screenshots.spec.ts-snapshots/demo-dark-desktop-chromium-linux.png",
  ],
  [
    "docs/images/device-lab-narrow.png",
    "tests/browser/demo-screenshots.spec.ts-snapshots/demo-light-narrow-chromium-linux.png",
  ],
];
for (const [documentationImage, baseline] of screenshotPairs) {
  const [image, expected] = await Promise.all([
    readFile(resolve(root, documentationImage)),
    readFile(resolve(root, baseline)),
  ]);
  if (!image.equals(expected)) {
    throw new Error(`${documentationImage} has drifted from ${baseline}.`);
  }
}

const releaseWorkflow = await readFile(
  resolve(root, ".github/workflows/release.yml"),
  "utf8",
);
if (
  !/release:\s*\n\s+types:\s*\[published\]/u.test(releaseWorkflow) ||
  !/id-token:\s*write/u.test(releaseWorkflow) ||
  !/npm publish --access public/u.test(releaseWorkflow) ||
  /NODE_AUTH_TOKEN|NPM_TOKEN/u.test(releaseWorkflow)
) {
  throw new Error("Release workflow does not satisfy the trusted-publishing gate.");
}

console.log("Public documentation and release preparation are complete.");
