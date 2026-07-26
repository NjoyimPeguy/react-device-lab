// @vitest-environment node

import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

import { afterEach, describe, expect, it } from "vitest";

const temporaryDirectories: string[] = [];
const script = resolve("scripts/neutrality-check.mjs");

async function makeFixture(contents: string): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), "react-device-lab-neutrality-"));
  temporaryDirectories.push(directory);
  await writeFile(join(directory, "fixture.txt"), contents, "utf8");
  return directory;
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map(async (directory) => {
      await rm(directory, { force: true, recursive: true });
    }),
  );
});

describe("neutrality check", () => {
  it("accepts neutral files", async () => {
    const fixture = await makeFixture("A generic responsive preview.");
    const result = spawnSync(process.execPath, [script, "--root", fixture], {
      encoding: "utf8",
    });

    expect(result.stderr).toBe("");
    expect(result.status).toBe(0);
  });

  it("rejects consumer-specific text without storing it in this repository", async () => {
    const fixture = await makeFixture(["la", "yu"].join(""));
    const result = spawnSync(process.execPath, [script, "--root", fixture], {
      encoding: "utf8",
    });

    expect(result.status).toBe(1);
  });
});
