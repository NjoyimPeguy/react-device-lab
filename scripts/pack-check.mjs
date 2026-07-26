let input = "";
for await (const chunk of process.stdin) {
  input += chunk;
}

if (input.trim() === "") {
  throw new Error("npm pack produced no manifest");
}

const [manifest] = JSON.parse(input);
const paths = new Set(manifest.files.map((entry) => entry.path));
const required = [
  "LICENSE",
  "README.md",
  "dist/index.d.ts",
  "dist/index.js",
  "dist/styles/index.css",
  "package.json",
];
const forbiddenPrefixes = [
  ".agents/",
  ".claude/",
  ".codex/",
  ".github/",
  ".augments/",
  "demo/",
  "node_modules/",
  "src/",
  "tests/",
];

for (const path of required) {
  if (!paths.has(path)) throw new Error(`Packed artifact is missing ${path}`);
}

for (const path of paths) {
  if (forbiddenPrefixes.some((prefix) => path.startsWith(prefix))) {
    throw new Error(`Packed artifact contains non-publishable path ${path}`);
  }
}
