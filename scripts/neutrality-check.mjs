import { readdir, readFile } from "node:fs/promises";
import { relative, resolve } from "node:path";

function option(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const root = resolve(option("--root") ?? process.cwd());
const firstTerm = ["la", "yu"].join("");
const secondTerm = ["la", "yu", "ai"].join("");
const pattern = new RegExp(`${firstTerm}|${secondTerm}`, "i");
const ignoredDirectories = new Set([
  ".augments",
  ".cache",
  ".git",
  "coverage",
  "dist",
  "node_modules",
  "playwright-report",
  "test-results",
]);
const matches = [];

async function scan(directory) {
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) {
      continue;
    }

    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      await scan(path);
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    const contents = await readFile(path);
    if (contents.includes(0)) {
      continue;
    }

    const lines = contents.toString("utf8").split(/\r?\n/u);
    lines.forEach((line, index) => {
      if (pattern.test(line)) {
        matches.push(`${relative(root, path)}:${index + 1}:${line}`);
      }
    });
  }
}

try {
  await scan(root);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Unable to run the neutrality check: ${message}`);
  process.exit(2);
}

if (matches.length > 0) {
  console.error("Public repository contains consumer-specific text:");
  console.error(matches.join("\n"));
  process.exit(1);
}
