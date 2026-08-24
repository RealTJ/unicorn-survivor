// scripts/minify-brometal.mjs
import { readFile, writeFile } from "node:fs/promises";
import { minify } from "terser";

const shaders = await readFile("dist/shaders.js", "utf8");
const brometal = await readFile("dist/brometal.js", "utf8");

const result = await minify(
  {
    "shaders.js": shaders,
    "brometal.js": brometal,
  },
  {
    compress: true,
    mangle: true,
    sourceMap: false,
  },
);

if (!result.code) {
  throw new Error("Terser produced no output");
}

await writeFile("src/generated/brometal.min.js", `${result.code}\n`);
