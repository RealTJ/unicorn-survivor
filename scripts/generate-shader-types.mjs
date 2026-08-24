import { readFile, writeFile } from "node:fs/promises";

const inputPath = "dist/shaders.js";
const outputPath = "src/generated/shaders.d.ts";

const source = await readFile(inputPath, "utf8");

// Matches generated entries such as:
// const Fire = [...];
// const Water = [...];
const shaderNames = [
  ...source.matchAll(/^\s*const\s+([A-Za-z_$][\w$]*)\s*=\s*\[/gm),
].map((match) => match[1]);

if (shaderNames.length === 0) {
  throw new Error(`No shader descriptors found in ${inputPath}`);
}

const declarations = shaderNames
  .map((name) => `declare const ${name}: BmShaderSource;`)
  .join("\n");

const output = `// Generated file. Do not edit manually.

${declarations}
`;

await writeFile(outputPath, output);

console.log(
  `Generated ${shaderNames.length} shader declaration(s): ${shaderNames.join(", ")}`,
);
