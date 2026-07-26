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
const releaseJobs = parsedReleaseWorkflow?.jobs ?? {};
const verifyJob = parsedReleaseWorkflow?.jobs?.verify;
const verifySteps = Array.isArray(verifyJob?.steps) ? verifyJob.steps : [];
const publishJob = parsedReleaseWorkflow?.jobs?.publish;
const publishSteps = Array.isArray(publishJob?.steps) ? publishJob.steps : [];
const publishSetupStep = publishSteps[0];
const packStep = verifySteps.find((step) => step?.id === "pack");
const packageUploadStep = verifySteps.find(
  (step) => step?.name === "Upload the verified release artifact",
);
const packageDownloadStep = publishSteps.find(
  (step) => step?.name === "Download the verified release artifact",
);
const publishStep = publishSteps.find(
  (step) => step?.name === "Publish the verified release artifact",
);
const expectedPackCommand = [
  'tarball="$(npm pack --ignore-scripts --silent)"',
  'test -f "$tarball"',
  'test ! -e "release-package.tgz"',
  'mv -- "$tarball" "release-package.tgz"',
  'test -f "release-package.tgz"',
  "",
].join("\n");
const expectedPublishCommand = [
  'test -f "./package-artifact/release-package.tgz"',
  'npm publish "./package-artifact/release-package.tgz" --ignore-scripts --access public',
  "",
].join("\n");
const containsSecretReference = (value) => {
  if (typeof value === "string") {
    return /\$\{\{\s*secrets\s*(?:\.|\[)/u.test(value);
  }
  if (Array.isArray(value)) {
    return value.some(containsSecretReference);
  }
  if (value && typeof value === "object") {
    return Object.entries(value).some(
      ([key, nestedValue]) =>
        containsSecretReference(key) || containsSecretReference(nestedValue),
    );
  }
  return false;
};
if (
  !parsedReleaseWorkflow?.on?.release?.types?.includes("published") ||
  Object.keys(releaseJobs).sort().join(",") !== "publish,verify" ||
  verifyJob?.if !== "github.repository == 'NjoyimPeguy/react-device-lab'" ||
  verifyJob?.environment !== undefined ||
  verifyJob?.permissions?.contents !== "read" ||
  verifyJob?.permissions?.["id-token"] !== undefined ||
  publishJob?.if !== "github.repository == 'NjoyimPeguy/react-device-lab'" ||
  publishJob?.needs !== "verify" ||
  publishJob?.environment !== "npm" ||
  publishJob?.permissions?.contents !== "read" ||
  publishJob?.permissions?.["id-token"] !== "write" ||
  publishSteps.length !== 3 ||
  publishSetupStep?.uses !== "actions/setup-node@v6" ||
  publishSetupStep?.with?.["node-version"] !== "24.18.0" ||
  publishSetupStep?.with?.["registry-url"] !==
    "https://registry.npmjs.org" ||
  publishSetupStep?.with?.["package-manager-cache"] !== false ||
  packStep?.run !== expectedPackCommand ||
  packageUploadStep?.uses !== "actions/upload-artifact@v4" ||
  packageUploadStep?.with?.name !==
    "release-package-${{ github.run_id }}-${{ github.run_attempt }}" ||
  packageUploadStep?.with?.path !== "release-package.tgz" ||
  packageUploadStep?.with?.["if-no-files-found"] !== "error" ||
  packageDownloadStep?.uses !== "actions/download-artifact@v5" ||
  packageDownloadStep?.with?.name !==
    "release-package-${{ github.run_id }}-${{ github.run_attempt }}" ||
  packageDownloadStep?.with?.path !== "package-artifact" ||
  publishStep?.run !== expectedPublishCommand ||
  publishStep?.env !== undefined ||
  verifySteps.some(
    (step) =>
      typeof step?.run === "string" && /\bnpm (?:publish|stage publish)\b/u.test(step.run),
  ) ||
  publishSteps.some((step) => /^actions\/checkout@/u.test(step?.uses ?? "")) ||
  publishSteps.some(
    (step) =>
      typeof step?.run === "string" &&
      /\bnpm (?:ci|install|run|exec|rebuild)\b/u.test(step.run),
  ) ||
  /NODE_AUTH_TOKEN|NPM_TOKEN|NPM_BOOTSTRAP_TOKEN/u.test(releaseWorkflow) ||
  containsSecretReference(parsedReleaseWorkflow)
) {
  throw new Error("Release workflow does not satisfy the trusted-publishing gate.");
}

console.log("Public documentation and release preparation are complete.");
