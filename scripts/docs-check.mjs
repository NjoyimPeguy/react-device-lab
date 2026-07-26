import { access, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const requiredFiles = [
  "README.md",
  "CHANGELOG.md",
  "CONTRIBUTING.md",
  "RELEASING.md",
  "SECURITY.md",
  "typedoc.json",
  "tsdoc.json",
  "docs/accessibility.md",
  "docs/api.md",
  "docs/browser-support.md",
  "docs/device-data.md",
  "docs/device-frames.md",
  "docs/environment-scenarios.md",
  "docs/frameworks.md",
  "docs/iframe-and-bridge.md",
  "docs/index.md",
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
  "docs/index.md",
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
const parsedReleaseWorkflow = YAML.parse(releaseWorkflow);
const publishJob = parsedReleaseWorkflow?.jobs?.publish;
const publishSteps = Array.isArray(publishJob?.steps) ? publishJob.steps : [];
const packStep = publishSteps.find((step) => step?.id === "pack");
const publishStep = publishSteps.find(
  (step) => step?.name === "Publish the verified release artifact",
);
const bootstrapCredentialPattern =
  /NODE_AUTH_TOKEN:\s*\$\{\{\s*secrets\.NPM_BOOTSTRAP_TOKEN\s*\}\}/gu;
const bootstrapCredentialMatches =
  releaseWorkflow.match(bootstrapCredentialPattern) ?? [];
const releaseWorkflowWithoutBootstrapCredential = releaseWorkflow.replace(
  bootstrapCredentialPattern,
  "",
);
if (
  !parsedReleaseWorkflow?.on?.release?.types?.includes("published") ||
  publishJob?.if !== "github.repository == 'NjoyimPeguy/react-device-lab'" ||
  publishJob?.environment !== "npm" ||
  publishJob?.permissions?.contents !== "read" ||
  publishJob?.permissions?.["id-token"] !== "write" ||
  !packStep?.run?.includes("npm pack --ignore-scripts --silent") ||
  publishStep?.run !==
    'npm publish "./${{ steps.pack.outputs.tarball }}" --ignore-scripts --access public' ||
  publishStep?.env?.NODE_AUTH_TOKEN !==
    "${{ secrets.NPM_BOOTSTRAP_TOKEN }}" ||
  bootstrapCredentialMatches.length !== 1 ||
  /NODE_AUTH_TOKEN|NPM_TOKEN|NPM_BOOTSTRAP_TOKEN/u.test(
    releaseWorkflowWithoutBootstrapCredential,
  )
) {
  throw new Error("Release workflow does not satisfy the trusted-publishing gate.");
}

console.log("Public documentation and release preparation are complete.");
