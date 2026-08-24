## Me
I need to minify my generated code from brometal. Currently it outputs `shaders.js` and `brometal.js` and the documentation states I can just concatinate them (as they are global). This would allow me afterwards to run terser over them. But I have two build steps, first brometal, then vite. I can activate terser in vite, but it does not minify anything in my `dist/` as I have made this a public repo.

How should I minify it? In the brometal build step (or afterwards), before importing them in vite? Or get vite to also minify it?

## AI Assistant
Minify the Brometal output **between the Brometal and Vite build steps**.

Vite’s `build.minify` only applies to JavaScript that Vite processes through its module graph. Files in `public/` are copied to `dist/` as-is, so enabling Vite minification will not affect them. [[1]](https://vite.dev/guide/assets)

Since Brometal generates global scripts that are intended to be concatenated, the ideal pipeline is:

1. Generate `shaders.js` and `brometal.js` with Brometal.
2. Concatenate them in the documented order.
3. Minify the concatenated file with Terser.
4. Put the resulting file in the location consumed by Vite.
5. Run Vite.
6. Optionally let Vite minify the application code separately.

This is preferable to minifying the two files independently because Terser can optimize across the concatenation boundary. Terser supports minifying multiple inputs, but concatenating first makes the intended global execution order explicit. [[2]](https://terser.org/docs/api-reference)

Install Terser as a development dependency:

```textmate
pnpm add --save-dev terser
```


For example, add a small build script:

```javascript
// scripts/minify-brometal.mjs
import { readFile, writeFile } from "node:fs/promises";
import { minify } from "terser";

const shaders = await readFile("path/to/shaders.js", "utf8");
const brometal = await readFile("path/to/brometal.js", "utf8");

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

await writeFile("path/to/brometal.min.js", `${result.code}\n`);
```


Then run it before Vite:

```json
{
  "scripts": {
    "build:shaders": "pnpm exec brometal prod --js13k",
    "build:shaders:minify": "node scripts/minify-brometal.mjs",
    "build:package": "vite build",
    "build": "pnpm run build:shaders && pnpm run build:shaders:minify && pnpm run build:package"
  }
}
```


Adjust the paths and output filename to match where Brometal writes its files and where your application expects them.

## Important global-script considerations

Because these files are global scripts:

- Preserve their order when concatenating them.
- Do not enable `toplevel: true` or `mangle.toplevel: true` unless you know that no application code depends on their global names.
- Keep any globals that your application accesses by name in `mangle.reserved`.
- If the generated code is loaded with `<script>` tags, keep it as a classic script; do not add `export` or `import`.
- Test the minified build in a browser, not only with unit tests.

A conservative starting configuration is:

```javascript
{
  compress: true,
  mangle: true,
  toplevel: false,
}
```


If Brometal exposes global identifiers that your code uses, reserve them explicitly:

```javascript
{
  mangle: {
    reserved: ["SomeBrometalGlobal", "SomeShaderGlobal"],
  },
}
```


## What to do with Vite

Keep Vite minification enabled for the application bundle:

```typescript
// vite.config.ts
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    minify: "terser",
  },
});
```


However, this only minifies Vite-processed output, not the generated files copied from `public/`. Vite’s current build configuration supports selecting a minifier such as Oxc or Terser. [[3]](https://vite.dev/config/build-options)

You have two reasonable choices:

### Recommended

Use Terser in the Brometal step and leave Vite’s default minifier enabled:

```plain text
Brometal → concatenate/minify → Vite
```


This gives you minified Brometal code and minified application code without making Vite slower than necessary.

### Alternative

Import the generated Brometal file from your source code instead of placing it in `public/`. Then Vite can process it as part of its module graph and include it in the application bundle. This is less suitable if Brometal requires global classic-script behavior, and may require changing how the generated code is loaded.

One further distinction: if your goal is reducing download size, compare the final compressed size using gzip or Brotli. JavaScript minification reduces source size, but the compressed size is what usually matters over the network.

## Me
How can I import it from my source code, instead of the public folder? I just need the the min.js here

## AI Assistant
Place `brometal.min.js` somewhere under your source tree, for example:

```plain text
src/
  generated/
    brometal.min.js
```


Then import it as a side-effect module before the code that uses Brometal:

```typescript
import "./generated/brometal.min.js";

// ... existing application code ...
```


Remove the standalone `<script>` tag from the HTML:

```html
<body>
    <div id="app"></div>
    <canvas></canvas>
    <script type="module" src="/src/main.ts"></script>
    </body>
</html>
```


Vite will now include `brometal.min.js` in its module graph and bundle it into the production output. It will also be processed by Vite’s production minifier if any additional optimization is possible.

## Build output location

Your minification script should write the file into `src/generated/`:

```javascript
// scripts/minify-brometal.mjs
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { minify } from "terser";

const shaders = await readFile("path/to/shaders.js", "utf8");
const brometal = await readFile("path/to/brometal.js", "utf8");

const result = await minify(`${shaders}\n${brometal}`, {
  compress: true,
  mangle: true,
});

if (!result.code) {
  throw new Error("Terser produced no output");
}

await mkdir("src/generated", { recursive: true });
await writeFile("src/generated/brometal.min.js", `${result.code}\n`);
```


The important part is that the Brometal generation and minification happen before `vite build`:

```json
{
  "scripts": {
    "build:shaders": "pnpm exec brometal prod --js13k",
    "build:shaders:minify": "node scripts/minify-brometal.mjs",
    "build:package": "vite build",
    "build": "pnpm run build:shaders && pnpm run build:shaders:minify && pnpm run build:package"
  }
}
```


## If Brometal exposes globals

This works directly if the generated file assigns its API to `window`, for example:

```javascript
window.Brometal = ...;
```


If it only declares top-level variables such as:

```javascript
var Brometal = ...;
```


then importing it as a module may prevent those variables from becoming `window` globals. In that case, either:

1. Change the generated output, if Brometal provides an option for global exports; or
2. Keep the file as a classic script and load it before the module, as you currently do.

You can check this by importing the file and then inspecting the browser console:

```javascript
console.log(window.Brometal);
```


Also be careful with Terser’s mangling. If your application accesses a Brometal global by name, reserve that name:

```javascript
const result = await minify(`${shaders}\n${brometal}`, {
  compress: true,
  mangle: {
    reserved: ["Brometal"],
  },
});
```


If the generated file is intended to be a self-contained global script and does not explicitly attach its public API to `window`, the existing `<script src="/brometal.min.js">` approach is safer.
