import { readFile } from "node:fs/promises";

const releaseTag = process.argv[2];
if (!releaseTag) {
  throw new TypeError("Pass the release tag, for example: npm run release:check -- v1.2.3");
}

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const expectedTag = `v${packageJson.version}`;
if (releaseTag !== expectedTag) {
  throw new Error(`Release tag ${releaseTag} does not match ${expectedTag}.`);
}

const changelog = await readFile("CHANGELOG.md", "utf8");
if (!changelog.includes(`## [${packageJson.version}]`)) {
  throw new Error(`CHANGELOG.md has no ${packageJson.version} release section.`);
}

console.log(`${releaseTag} matches package.json and CHANGELOG.md.`);
