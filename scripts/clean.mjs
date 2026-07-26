import { rm } from "node:fs/promises";
import { basename, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = fileURLToPath(new URL("../dist/", import.meta.url));

if (basename(output) !== "dist" || dirname(output) !== root.replace(/\/$/, "")) {
  throw new Error("Refusing to clean an unexpected build directory.");
}

await rm(output, { force: true, recursive: true });
