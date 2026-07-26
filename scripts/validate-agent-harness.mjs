import { lstat, readFile, readlink, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { parse as parseToml } from "smol-toml";
import { parse as parseYaml } from "yaml";

function option(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const defaultRoot = fileURLToPath(new URL("../", import.meta.url));
const root = resolve(option("--root") ?? defaultRoot);
const failures = [];

function object(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function contents(path) {
  return readFile(resolve(root, path), "utf8");
}

async function expectFile(path, requiredText = []) {
  try {
    const value = await contents(path);
    if (!value.trim()) failures.push(`${path} is empty`);
    if (value.includes("TODO")) failures.push(`${path} contains TODO`);
    for (const text of requiredText) {
      if (!value.includes(text)) failures.push(`${path} is missing ${text}`);
    }
  } catch (error) {
    failures.push(`${path} cannot be read: ${error.message}`);
  }
}

async function expectLink(path, target) {
  try {
    const absolute = resolve(root, path);
    if (!(await lstat(absolute)).isSymbolicLink()) {
      failures.push(`${path} is not a symlink`);
      return;
    }
    if ((await readlink(absolute)) !== target) {
      failures.push(`${path} does not target ${target}`);
    }
    await stat(absolute);
  } catch (error) {
    failures.push(`${path} is invalid: ${error.message}`);
  }
}

function parseFrontMatter(value, path) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/u.exec(value);
  if (!match) {
    throw new Error(`${path} has no YAML front matter`);
  }
  const metadata = parseYaml(match[1]);
  if (!object(metadata)) {
    throw new Error(`${path} front matter must be an object`);
  }
  return metadata;
}

async function validateYaml() {
  try {
    const skill = parseFrontMatter(
      await contents(".agents/skills/maintain-device-catalog/SKILL.md"),
      "catalog skill",
    );
    if (
      skill["name"] !== "maintain-device-catalog" ||
      typeof skill["description"] !== "string"
    ) {
      failures.push("Catalog skill front matter has invalid name or description");
    }

    const reviewer = parseFrontMatter(
      await contents(".agents/agents/package-reviewer.md"),
      "package reviewer",
    );
    if (
      reviewer["name"] !== "package-reviewer" ||
      typeof reviewer["description"] !== "string" ||
      reviewer["permissionMode"] !== "plan"
    ) {
      failures.push("Package reviewer front matter is invalid");
    }

    const openAi = parseYaml(
      await contents(
        ".agents/skills/maintain-device-catalog/agents/openai.yaml",
      ),
    );
    if (
      !object(openAi) ||
      !object(openAi["interface"]) ||
      typeof openAi["interface"]["display_name"] !== "string" ||
      typeof openAi["interface"]["default_prompt"] !== "string"
    ) {
      failures.push("Catalog skill interface YAML is invalid");
    }
  } catch (error) {
    failures.push(`Harness YAML is invalid: ${error.message}`);
  }
}

async function validateToml() {
  try {
    const config = parseToml(await contents(".codex/config.toml"));
    const agents = config["agents"];
    const reviewer = object(agents) ? agents["package_reviewer"] : undefined;
    if (
      !object(agents) ||
      agents["max_concurrent_threads_per_session"] !== 3 ||
      !object(reviewer) ||
      reviewer["config_file"] !== "agents/package-reviewer.toml" ||
      typeof reviewer["description"] !== "string"
    ) {
      failures.push("Codex agent registration is invalid");
    }

    const reviewerConfig = parseToml(
      await contents(".codex/agents/package-reviewer.toml"),
    );
    if (
      reviewerConfig["sandbox_mode"] !== "read-only" ||
      typeof reviewerConfig["description"] !== "string" ||
      typeof reviewerConfig["developer_instructions"] !== "string"
    ) {
      failures.push("Codex package reviewer configuration is invalid");
    }
  } catch (error) {
    failures.push(`Harness TOML is invalid: ${error.message}`);
  }
}

async function validateJson() {
  try {
    for (const path of [".claude/settings.json", ".codex/hooks.json"]) {
      const value = JSON.parse(await contents(path));
      const stopHooks = object(value["hooks"])
        ? value["hooks"]["Stop"]
        : undefined;
      if (!Array.isArray(stopHooks) || stopHooks.length === 0) {
        failures.push(`${path} has no Stop hook`);
      }
    }
  } catch (error) {
    failures.push(`Harness JSON is invalid: ${error.message}`);
  }
}

await Promise.all([
  expectLink("CLAUDE.md", "AGENTS.md"),
  expectLink(".claude/skills", "../.agents/skills"),
  expectLink(".claude/agents", "../.agents/agents"),
  expectLink(".claude/hooks", "../.agents/hooks"),
  expectFile("AGENTS.md", ["npm run verify", "react-device-lab/styles.css"]),
  expectFile(".agents/skills/maintain-device-catalog/SKILL.md", [
    "official specification",
  ]),
  expectFile(".agents/skills/maintain-device-catalog/agents/openai.yaml", [
    "Maintain Device Catalog",
    "$maintain-device-catalog",
  ]),
  expectFile(".agents/agents/package-reviewer.md", ["ready-to-merge"]),
  expectFile(".agents/hooks/check-public-neutrality.mjs", [
    "neutrality-check.mjs",
  ]),
  expectFile(".codex/config.toml", ["[agents.package_reviewer]"]),
  expectFile(".codex/hooks.json", ["check-public-neutrality.mjs"]),
  expectFile(".codex/agents/package-reviewer.toml", [
    'sandbox_mode = "read-only"',
  ]),
  validateYaml(),
  validateToml(),
  validateJson(),
]);

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}
