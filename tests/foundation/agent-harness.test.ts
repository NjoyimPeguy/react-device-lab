// @vitest-environment node

import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

import { afterEach, describe, expect, it } from "vitest";

const root = resolve(".");
const validator = resolve("scripts/validate-agent-harness.mjs");
const temporaryDirectories: string[] = [];

async function copyHarness(): Promise<string> {
  const fixture = await mkdtemp(join(tmpdir(), "react-device-lab-harness-"));
  temporaryDirectories.push(fixture);

  for (const path of [
    "AGENTS.md",
    "CLAUDE.md",
    ".agents",
    ".claude",
    ".codex",
  ]) {
    await cp(resolve(root, path), join(fixture, basename(path)), {
      recursive: true,
      verbatimSymlinks: true,
    });
  }

  return fixture;
}

function validate(fixture: string) {
  return spawnSync(process.execPath, [validator, "--root", fixture], {
    encoding: "utf8",
  });
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map(async (directory) => {
      await rm(directory, { force: true, recursive: true });
    }),
  );
});

describe("agent harness schema validation", () => {
  it("rejects malformed TOML", async () => {
    const fixture = await copyHarness();
    await writeFile(
      join(fixture, ".codex/config.toml"),
      "[agents\nmax_concurrent_threads_per_session = 3",
      "utf8",
    );

    expect(validate(fixture).status).toBe(1);
  });

  it("rejects malformed skill front matter", async () => {
    const fixture = await copyHarness();
    const skillPath = join(
      fixture,
      ".agents/skills/maintain-device-catalog/SKILL.md",
    );
    const skill = await readFile(skillPath, "utf8");
    await writeFile(
      skillPath,
      skill.replace("name: maintain-device-catalog", "name: ["),
      "utf8",
    );

    expect(validate(fixture).status).toBe(1);
  });
});
