import { cp, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const source = fileURLToPath(new URL("../src/styles/", import.meta.url));
const destination = fileURLToPath(new URL("../dist/styles/", import.meta.url));

await mkdir(destination, { recursive: true });
await cp(source, destination, { force: true, recursive: true });
