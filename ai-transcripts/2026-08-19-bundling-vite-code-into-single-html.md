## Me
How would I bundle all my code from src/main.ts into a index.html file? I would like to use vite. Furthermore it should be zipped afterwards and measured that it smaller or equal than 13,312 bytes?

## AI Assistant
Use Vite with `vite-plugin-singlefile` to inline the bundled JavaScript and CSS into `dist/index.html`, then create a ZIP and fail the build if the ZIP exceeds **13,312 bytes**. The plugin is intended for producing a self-contained HTML file [[1]](https://github.com/richardtallent/vite-plugin-singlefile).

### 1. Install dependencies

```shell script
pnpm add -D vite vite-plugin-singlefile
pnpm add fflate
```


### 2. Add the Vite configuration

```typescript
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig({
  plugins: [viteSingleFile()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    cssCodeSplit: false,
    assetsInlineLimit: Infinity,
    rollupOptions: {
      input: "index.html",
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});
```


`assetsInlineLimit: Infinity` ensures imported assets are eligible for inlining. Vite's default asset inline limit is only 4 KiB [[2]](https://vite.dev/config/build-options).

### 3. Create the HTML entry point

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Unicorn Survivor</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```


Vite will replace the module script with bundled, inlined JavaScript during the production build.

### 4. Add the ZIP and size-check script

```javascript
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { zipSync, strToU8 } from "fflate";

const limit = 13_312;
const htmlPath = resolve("dist/index.html");
const zipPath = resolve("dist/unicorn-survivor.zip");

const html = await readFile(htmlPath, "utf8");
const zip = zipSync(
  {
    "index.html": strToU8(html),
  },
  {
    level: 9,
  },
);

await mkdir(resolve("dist"), { recursive: true });
await writeFile(zipPath, zip);

const htmlBytes = Buffer.byteLength(html, "utf8");
const zipBytes = zip.byteLength;

console.log(`index.html: ${htmlBytes.toLocaleString()} bytes`);
console.log(`ZIP:        ${zipBytes.toLocaleString()} bytes`);
console.log(`Limit:      ${limit.toLocaleString()} bytes`);

if (zipBytes > limit) {
  console.error(
    `\nBuild failed: ZIP is ${zipBytes - limit} bytes over the limit.`,
  );
  process.exit(1);
}

console.log("\nBuild passed: ZIP is within the size limit.");
```


### 5. Update the package scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build && node scripts/package-build.mjs",
    "test": "vitest"
  }
}
```


Run the build with:

```shell script
pnpm build
```


The result will be:

```plain text
dist/index.html
dist/unicorn-survivor.zip
```


The build exits with an error if `dist/unicorn-survivor.zip` is larger than **13,312 bytes**.

### Important size considerations

- Only `index.html` is placed in the ZIP.
- Images, fonts, and other assets should be imported from TypeScript or CSS so Vite can inline them.
- Files in `public/` are copied as separate files and are not automatically embedded by the single-file plugin [[1]](https://github.com/richardtallent/vite-plugin-singlefile).
- Avoid dynamic imports, since they can produce additional chunks.
- Remove source maps for the production build if they are generated.
- ZIP size is not the same as raw HTML size; the script reports both.
