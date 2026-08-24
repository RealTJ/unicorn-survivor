import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { zipSync, strToU8 } from "fflate";

const limit = 13_312;
const htmlPath = resolve("build/index.html");
const zipPath = resolve("build/unicorn-survivor.zip");

const html = await readFile(htmlPath, "utf8");
const zip = zipSync(
  {
    "index.html": strToU8(html),
    "brometal.js": await readFile(resolve("build/brometal.js")),
    "shaders.js": await readFile(resolve("build/shaders.js")),
  },
  {
    level: 9,
  },
);

await mkdir(resolve("dist"), { recursive: true });
await writeFile(zipPath, zip);

const htmlBytes = Buffer.byteLength(html, "utf8");
const zipBytes = zip.byteLength;

console.log(`index.html : ${htmlBytes.toLocaleString()} bytes`);
console.log(`ZIP        : ${zipBytes.toLocaleString()} bytes`);
console.log(
  `Remaining  : ${(limit - zipBytes).toLocaleString()} bytes remaining`,
);
console.log(
  `Percent    : ${((zipBytes / limit - 1) * 100 * -1).toLocaleString()} %`,
);
console.log(`Limit      : ${limit.toLocaleString()} bytes`);

if (zipBytes > limit) {
  console.error(
    `\nBuild failed: ZIP is ${zipBytes - limit} bytes over the limit.`,
  );
  process.exit(1);
}

console.log("\nBuild passed: ZIP is within the size limit.");
