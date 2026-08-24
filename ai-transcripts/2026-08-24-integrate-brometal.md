## Me
I want to set up BroMetal in my current project for JS13k:

https://brometal.dev/js13k

My current project already uses vite for building and has a build process. I need to integrate the process into my current project. Can you look this up for me and explain how I would integrate this? I'm seeing terser package, but I think this is optional (albeit heplful nevertheless).

For starters it would be alright to just set up the brometal step and have an example renderer (not used for the current game, just an example) and output it. I think the build order is important and I'm unsure if I need to build brometal first and then vite or the other way around.

Or if vite could include this (and even the terser plugin)?

## AI Assistant
## Recommended build order

Use BroMetal **before Vite**:

```plain text
BroMetal shader sources
        ↓
generated .shader.gen.ts modules
        ↓
Vite bundles the generated modules and application code
        ↓
optional Terser/minification
        ↓
ZIP/package-size check
```


BroMetal is an ahead-of-time shader compiler. Its compiler does not run in the browser; each `name.shader.ts` becomes a generated `name.shader.gen.ts` module containing WGSL and metadata. Your application imports the generated module, not the source shader. [[1]](https://brometal.dev)

Therefore, Vite should consume BroMetal's generated files. Vite should not run first.

BroMetal is also WebGPU-only. `createRenderer()` will fail when WebGPU is unavailable, so this example will require a browser with WebGPU support. [[2]](https://github.com/ericdrowell/brometal)

## Install BroMetal

Use `pnpm`:

```json
{
  "name": "unicorn-survivor",
  "version": "1.0.0",
  "description": "",
  "main": "dist/main.js",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build:shaders": "pnpm exec brometal --help",
    "build": "pnpm run build:shaders && vite build && node scripts/package-build.mjs",
    "test": "vitest"
  },
  "devDependencies": {
    "brometal": "latest",
    "fflate": "0.8.3",
    "prettier": "3.9.6",
    "typescript": "7.0.2",
    "vite": "8.2.1",
    "vite-plugin-singlefile": "2.3.3",
    "vitest": "4.1.10"
  },
  "private": true
}
```


Run:

```textmate
pnpm install
pnpm exec brometal --help
```


The exact compiler command should be taken from the installed BroMetal version's CLI help. I would not hard-code an assumed command until checking that output, because the compiler CLI is separate from the runtime API and its command-line interface may change between versions.

The important part is that `build:shaders` must produce generated files before `vite build` starts.

Once you confirm the CLI syntax, replace this:

```json
"build:shaders": "pnpm exec brometal --help"
```


with the actual BroMetal compilation command.

For example, conceptually it should be equivalent to:

```plain text
compile src/**/*.shader.ts → src/**/*.shader.gen.ts
```


The generated files should generally be kept outside `dist`, such as next to the source shader or in `src/generated`.

## Example renderer

BroMetal's runtime API follows this general pattern:

```typescript
import { createProgram, createRenderer, createPlane } from "brometal";
import { fireShader } from "brometal/shaders";

const canvas = document.querySelector("canvas");

if (!(canvas instanceof HTMLCanvasElement)) {
  throw new Error("Canvas not found");
}

const renderer = await createRenderer(canvas);
const program = createProgram(renderer, fireShader);
const plane = createPlane({ width: 2, height: 2 });

program.attributes.aPosition.set(plane.positions);
program.attributes.aUv.set(plane.uvs);
program.setIndices(plane.indices);

renderer.loop((time) => {
  program.uniforms.uTime.set(time);
  program.uniforms.uAspect.set(canvas.width / canvas.height);
  program.draw();
});
```


The package also includes precompiled shaders, which makes `brometal/shaders` useful for initially testing the runtime integration without writing a custom BroMetal shader. [[3]](https://github.com/ericdrowell/brometal)

For an isolated example, add a separate HTML entry point:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>BroMetal example</title>
    <style>
      html,
      body {
        width: 100%;
        height: 100%;
        margin: 0;
      }

      canvas {
        display: block;
        width: 100%;
        height: 100%;
      }
    </style>
  </head>
  <body>
    <canvas></canvas>
    <script type="module" src="./main.ts"></script>
  </body>
</html>
```


```typescript
import { createProgram, createRenderer, createPlane } from "brometal";
import { fireShader } from "brometal/shaders";

const canvas = document.querySelector("canvas");

if (!(canvas instanceof HTMLCanvasElement)) {
  throw new Error("Canvas not found");
}

const resize = () => {
  const pixelRatio = Math.min(window.devicePixelRatio, 2);

  canvas.width = Math.floor(canvas.clientWidth * pixelRatio);
  canvas.height = Math.floor(canvas.clientHeight * pixelRatio);
};

resize();
window.addEventListener("resize", resize);

const renderer = await createRenderer(canvas);
const program = createProgram(renderer, fireShader);
const plane = createPlane({ width: 2, height: 2 });

program.attributes.aPosition.set(plane.positions);
program.attributes.aUv.set(plane.uvs);
program.setIndices(plane.indices);

renderer.loop((time) => {
  program.uniforms.uTime.set(time);
  program.uniforms.uAspect.set(canvas.width / canvas.height);
  program.draw();
});
```


However, your current Vite configuration explicitly uses `index.html` as its only entry point. For a first test, it is simpler to use a separate Vite configuration or temporarily change the input to the example.

A cleaner long-term option is to configure multiple HTML inputs:

```typescript
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig({
  plugins: [viteSingleFile()],
  define: {
    __DEV__: process.env.NODE_ENV !== "production",
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    cssCodeSplit: false,
    assetsInlineLimit: Infinity,
    rollupOptions: {
      input: {
        game: "index.html",
        brometal: "examples/brometal/index.html",
      },
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});
```


Be aware that `inlineDynamicImports: true` is intended for a single entry point. If Vite/Rollup rejects this configuration with multiple inputs, build the example separately or omit the example from the production build.

For example, a separate example config could be:

```typescript
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig({
  plugins: [viteSingleFile()],
  build: {
    outDir: "dist-brometal",
    emptyOutDir: true,
    cssCodeSplit: false,
    assetsInlineLimit: Infinity,
    rollupOptions: {
      input: "examples/brometal/index.html",
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});
```


Then add:

```json
{
  "scripts": {
    "dev": "vite",
    "build:shaders": "pnpm exec brometal --help",
    "build": "pnpm run build:shaders && vite build && node scripts/package-build.mjs",
    "build:brometal-example": "pnpm run build:shaders && vite build --config vite.brometal.config.ts",
    "test": "vitest"
  }
}
```


## Should BroMetal be a Vite plugin?

It could be, but I would not start there.

A custom Vite plugin would need to:

1. Find `.shader.ts` files.
2. Invoke BroMetal's compiler.
3. Write or virtualize the generated `.shader.gen.ts` modules.
4. Handle watch mode and invalidate changed modules.
5. Ensure compilation occurs before Rollup resolves imports.

That can be useful later, but a normal prebuild script is easier to debug and is already the natural model for BroMetal's ahead-of-time workflow.

The simplest integration is therefore:

```plain text
pnpm run build:shaders
vite build
node scripts/package-build.mjs
```


Your existing ZIP step remains last, because it should measure the final Vite output.

## Is Terser optional?

Yes. BroMetal does not require Terser.

Vite already minifies production output by default. Terser is useful when you want more aggressive JS13k-specific optimization, especially:

- additional compression passes;
- property mangling;
- more control over comments and output formatting;
- tuning code specifically for byte size.

BroMetal's compiler and runtime are separate concerns: BroMetal reduces shader/runtime overhead, while Terser reduces the JavaScript bundle. The BroMetal compiler itself is build-time only and is not included in the browser bundle. [[4]](https://brometal.dev)

Install Terser only when you are ready to optimize the final bundle:

```textmate
pnpm add -D terser
```


Then configure Vite:

```typescript
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig({
  plugins: [viteSingleFile()],
  define: {
    __DEV__: false,
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    cssCodeSplit: false,
    assetsInlineLimit: Infinity,
    minify: "terser",
    terserOptions: {
      compress: {
        passes: 2,
      },
      mangle: true,
      format: {
        comments: false,
      },
    },
    rollupOptions: {
      input: "index.html",
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});
```


I would initially leave Terser disabled and get this working first:

```plain text
BroMetal generation → Vite single-file build → ZIP validation
```


Then compare the ZIP size with and without Terser. Terser is most valuable near the 13 kB limit, but it increases build time and can make debugging less convenient.

One additional correction: your `__DEV__` definition currently depends on `process.env.NODE_ENV`. For a size-focused production build, explicitly defining it as `false` is more reliable because Vite can then remove development-only branches during bundling.

## Me
Okay I've got a simple setup - since brometal uses a different way to compile everything for js13k I have moved my vite compilation folder from dist/ to build/ (since brometal hardcoded the dist folder and vite deletes it in a later build step).

What I need now is reference the emitted brometal.js and shaders.js in my index.html - however I cannot put them in the normal index.html as they don't exist yet. How would I configure it? Currently my setup looks like this:

- /build/index.html
- /dist/brometal.js
- /dist/shaders.js





## AI Assistant
The files must exist **before Vite starts**, but they do not need to exist while you are authoring `index.html`.

Since your layout is:

```plain text
dist/
  brometal.js
  shaders.js

build/
  index.html
```


you could reference them directly with:

```html
<script src="../dist/brometal.js"></script>
<script src="../dist/shaders.js"></script>
```


However, that is usually not the best final layout for JS13k. Your ZIP would need to preserve the `dist` directory, and the generated HTML would depend on files outside its own directory.

A better approach is to tell Vite to treat the BroMetal output directory as its public directory. Vite will copy those files into `build` during the Vite build.

```typescript
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig({
  plugins: [viteSingleFile()],
  publicDir: "dist",
  define: {
    __DEV__: process.env.NODE_ENV !== "production",
  },
  build: {
    outDir: "build",
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


Then your source `index.html` can use root-relative public paths:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Unicorn Survivor</title>
  </head>
  <body>
    <script src="/brometal.js"></script>
    <script src="/shaders.js"></script>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```


The resulting structure will be approximately:

```plain text
build/
  index.html
  brometal.js
  shaders.js
  ...
```


## Important: use `./` if the final HTML may be opened directly

For JS13k, the ZIP is often extracted and `index.html` is opened from a local or hosted directory. To avoid issues with `/` paths, configure Vite with a relative base:

```typescript
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig({
  base: "./",
  plugins: [viteSingleFile()],
  publicDir: "dist",
  define: {
    __DEV__: process.env.NODE_ENV === "production" ? false : true,
  },
  build: {
    outDir: "build",
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


Then use relative references:

```html
<script src="./brometal.js"></script>
<script src="./shaders.js"></script>
<script type="module" src="./src/main.ts"></script>
```


Vite will rewrite module references as necessary during the build.

## Build order

Your build should be:

```plain text
BroMetal emits dist/brometal.js and dist/shaders.js
        ↓
Vite reads dist as publicDir
        ↓
Vite writes build/
        ↓
package-build.mjs packages build/
```


For example:

```json
{
  "scripts": {
    "dev": "vite",
    "build:brometal": "your-brometal-command",
    "build:vite": "vite build",
    "build": "pnpm run build:brometal && pnpm run build:vite && node scripts/package-build.mjs",
    "test": "vitest"
  }
}
```


You should also update your packaging script so that it reads from `build/index.html` rather than `dist/index.html`.

```javascript
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
  },
  {
    level: 9,
  },
);

await mkdir(resolve("build"), { recursive: true });
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
```


The exact ZIP contents will depend on what `brometal.js` and `shaders.js` contain. If they remain external files, you must add them to the ZIP as well:

```javascript
const zip = zipSync({
  "index.html": strToU8(html),
  "brometal.js": await readFile(resolve("build/brometal.js")),
  "shaders.js": await readFile(resolve("build/shaders.js")),
});
```


If `vite-plugin-singlefile` successfully inlines them, they will already be inside `index.html` and should not be added separately. Verify this by inspecting `build/index.html` after the build. For JS13k, the desired final result is generally one self-contained HTML file, so external BroMetal scripts should either be copied into the ZIP or inlined before packaging.

## Me
I think the shaders are being included two times: once from the main.ts and brometal-example.ts and fire.shader.ts and then through my external setup.

The final html looks like this:

```

```


## AI Assistant
Yes—the duplication is caused by using **both BroMetal’s external JS output and Vite’s module graph**.

You currently have two separate paths:

```plain text
index.html
  ├─ /brometal.js       ← external BroMetal output
  ├─ /shaders.js        ← external shader output
  └─ /src/main.ts
       └─ brometal-example.ts
            ├─ brometal
            └─ fire.shader.ts
```


Vite follows the imports from `main.ts`, so it bundles the BroMetal runtime and shader implementation into its own JavaScript output. The two `<script>` tags then add the externally generated versions as well.

You should choose one of these approaches.

## Recommended: let Vite bundle BroMetal

Since you already use Vite, remove the external script tags:

```html
<div id="app"></div>
    <canvas></canvas>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```


Also change the application code to import the **generated shader module**, not the source shader:

```typescript
import { createProgram, createRenderer, createPlane } from "brometal";
import fireShader from "./fire.shader.gen.ts";

export async function createRender() {
  const canvas = document.querySelector("canvas");

  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error("Canvas not found");
  }

  const renderer = await createRenderer(canvas);
  const program = createProgram(renderer, fireShader);
  const plane = createPlane({ width: 2, height: 2 });

  program.attributes.aPosition.set(plane.positions);
  program.attributes.aUv.set(plane.uvs);
  program.setIndices(plane.indices);

  renderer.loop((time) => {
    program.uniforms.uTime.set(time);
    program.uniforms.uAspect.set(canvas.width / canvas.height);
    program.draw();
  });
}
```


The exact generated import may not use a default export. If BroMetal emits this:

```typescript
export const Fire = ...
```


then use:

```typescript
import { Fire as fireShader } from "./fire.shader.gen.ts";
```


The important distinction is:

```typescript
// Do not use this in the application:
import { Fire as fireShader } from "./fire.shader.ts";

// Use the generated module:
import { Fire as fireShader } from "./fire.shader.gen.ts";
```


Your build then becomes:

```plain text
pnpm run build:shaders
        ↓
fire.shader.gen.ts is emitted
        ↓
vite build
        ↓
Vite bundles the BroMetal runtime and generated shader
        ↓
vite-plugin-singlefile inlines the result
```


With this approach, `brometal.js` and `shaders.js` should not be referenced in `index.html` and should not be copied through `publicDir`.

You can remove this from the Vite configuration:

```typescript
export default defineConfig({
  plugins: [viteSingleFile()],
  publicDir: false,
  define: {
    __DEV__: process.env.NODE_ENV !== "production",
  },
  build: {
    outDir: "build",
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


`publicDir: false` is optional, but it prevents Vite from copying the BroMetal-generated external files into `build`.

## Alternative: use BroMetal's external JS output

If `pnpm exec brometal prod --js13k` is intended to produce the final runtime files:

```plain text
dist/brometal.js
dist/shaders.js
```


then do not import BroMetal through your Vite application bundle. In that setup:

- keep the external `<script>` tags;
- do not import `brometal` from application modules;
- do not import `fire.shader.ts` into application modules;
- use the API exposed by the generated external files;
- ensure `brometal.js` and `shaders.js` are included in the final ZIP.

That approach is more dependent on BroMetal's JS13k-specific output format. It also means Vite must not bundle those same modules independently.

## Do not import `fire.shader.ts` in production application code

This is especially important:

```typescript
import { Fire as fireShader } from "./fire.shader.ts";
```


That imports the TypeScript shader DSL into Vite. Even if BroMetal separately emits `shaders.js`, Vite sees the source import and includes the shader definition and its dependencies in the module graph.

The source shader should only be consumed by the BroMetal compilation step:

```plain text
fire.shader.ts
        ↓ BroMetal
fire.shader.gen.ts
        ↓ imported by application
Vite bundle
```


## Suggested package scripts

Your script ordering is already conceptually correct:

```json
{
  "scripts": {
    "dev": "vite",
    "build:shaders": "pnpm exec brometal prod --js13k",
    "build:package": "vite build",
    "build:zip": "node scripts/package-build.mjs",
    "build": "pnpm run build:shaders && pnpm run build:package && pnpm run build:zip",
    "test": "vitest"
  }
}
```


The main change is to decide whether `build:shaders` produces:

1. generated TypeScript modules consumed by Vite; or
2. standalone JavaScript files consumed through `<script>` tags.

For your current setup, I would use option 1 and remove the external script tags. Having both is what causes the duplicate runtime and shader code.

Also, the HTML block in your message appears empty, so I cannot inspect the actual generated bundle. To verify the fix, search the final `build/index.html` for:

```plain text
brometal
```


After removing the external scripts, there should be one application bundle containing the runtime and generated shader, rather than separate external BroMetal and shader scripts plus the Vite bundle.

## Me
How would I get TypeScript support in the second case? Or is it not possible? Since this is now an "external" file should I just define it as a brometal.d.ts and say the "shaders" and brometal exist (without actually importing them, keeping them as a global - since they are imported as a global?) and then just reference them in my brometal example?

## AI Assistant
Yes, TypeScript support is possible in the external-file approach, but a `.d.ts` file only describes a runtime value. It does not create that value.

The runtime must actually expose something globally, for example:

```javascript
globalThis.BroMetal = ...
globalThis.Shaders = ...
```


or:

```javascript
globalThis.brometal = ...
globalThis.shaders = ...
```


The `<script>` tags must also execute before your module:

```html
<script src="./brometal.js"></script>
<script src="./shaders.js"></script>
<script type="module" src="./src/main.ts"></script>
```


The first thing to check is the end of the generated files. Look for an assignment involving `globalThis`, `window`, or a global variable:

```javascript
globalThis.BroMetal = ...
```


If the files do not expose globals and instead contain ES module exports such as:

```javascript
export { createRenderer, createProgram };
```


then classic script tags are not the correct loading method. You would need to load them as modules:

```html
<script type="module" src="./brometal.js"></script>
```


But that still does not automatically make their exports available to `main.ts`. In that case, the clean solution is to import them from application code, which returns you to the Vite-bundled approach.

## Recommended declaration approach

If the generated runtime exposes:

```javascript
globalThis.BroMetal
```


create an ambient declaration such as:

```typescript
import type * as BroMetalTypes from "brometal";

declare global {
  const BroMetal: typeof BroMetalTypes;
}

export {};
```


This gives TypeScript the type information from the installed `brometal` package while emitting no JavaScript import.

Then use the global in your application:

```typescript
import type * as BroMetalTypes from "brometal";

export async function createRender() {
  const canvas = document.querySelector("canvas");

  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error("Canvas not found");
  }

  const renderer = await BroMetal.createRenderer(canvas);
  const program = BroMetal.createProgram(renderer, fireShader);
  const plane = BroMetal.createPlane({ width: 2, height: 2 });

  program.attributes.aPosition.set(plane.positions);
  program.attributes.aUv.set(plane.uvs);
  program.setIndices(plane.indices);

  renderer.loop((time) => {
    program.uniforms.uTime.set(time);
    program.uniforms.uAspect.set(canvas.width / canvas.height);
    program.draw();
  });
}
```


However, the `import type` above is unnecessary if `brometal.d.ts` already declares the global using `typeof import("brometal")`. The application can simply use:

```typescript
const renderer = await BroMetal.createRenderer(canvas);
```


The important distinction is:

```typescript
import { createRenderer } from "brometal";
```


This is a runtime import and causes Vite to bundle BroMetal.

```typescript
import type { Renderer } from "brometal";
```


This is type-only and is removed from the emitted JavaScript.

## Declaring an external shader global

If the generated `shaders.js` exposes something like:

```javascript
globalThis.Shaders = {
  Fire: ...
};
```


declare it similarly:

```typescript
import type * as BroMetalTypes from "brometal";

declare global {
  const BroMetal: typeof BroMetalTypes;
  const Shaders: {
    Fire: ReturnType<typeof BroMetalTypes.shader>;
  };
}

export {};
```


Then:

```typescript
export async function createRender() {
  const canvas = document.querySelector("canvas");

  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error("Canvas not found");
  }

  const renderer = await BroMetal.createRenderer(canvas);
  const program = BroMetal.createProgram(renderer, Shaders.Fire);
  const plane = BroMetal.createPlane({ width: 2, height: 2 });

  program.attributes.aPosition.set(plane.positions);
  program.attributes.aUv.set(plane.uvs);
  program.setIndices(plane.indices);

  renderer.loop((time) => {
    program.uniforms.uTime.set(time);
    program.uniforms.uAspect.set(canvas.width / canvas.height);
    program.draw();
  });
}
```


The exact declaration depends on the actual generated global names.

## A better option: generated declaration files

If BroMetal's JS13k build emits declaration files, use those instead of manually recreating the types. For example, if it emits:

```plain text
dist/brometal.d.ts
dist/shaders.d.ts
```


copy them into a TypeScript-visible source directory:

```plain text
src/types/brometal.d.ts
src/types/shaders.d.ts
```


Then reference them from `tsconfig.json` if necessary:

```json
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "types": ["./src/types/brometal", "./src/types/shaders"]
  },
  "include": ["src"]
}
```


If the generated declarations describe module exports rather than globals, they cannot be used directly for global access without an ambient wrapper.

## The limitation

This only works if the generated files really are global scripts.

A declaration like this:

```typescript
declare const BroMetal: typeof import("brometal");
```


does not make `BroMetal` exist at runtime. It merely tells TypeScript:

> Assume that a value named `BroMetal` will exist when this code runs.

If `brometal.js` does not create that global, the browser will throw:

```plain text
ReferenceError: BroMetal is not defined
```


Likewise, if the generated shader file does not create `Shaders.Fire`, TypeScript may be satisfied while the browser still fails.

## Avoid the source shader import

In the external approach, this import must disappear:

```typescript
import { Fire as fireShader } from "./fire.shader.ts";
```


That import causes Vite to include the shader DSL in its bundle and defeats the purpose of using external `shaders.js`.

Instead, use the global produced by the BroMetal output:

```typescript
const program = BroMetal.createProgram(renderer, Shaders.Fire);
```


The source file should only be consumed by:

```plain text
pnpm run build:shaders
```


## Practical recommendation

For your current project, I would use one of these two complete strategies:

### Strategy A: Vite-managed

```plain text
fire.shader.ts
    ↓ BroMetal
fire.shader.gen.ts
    ↓ imported by TypeScript
Vite bundles everything
    ↓
one self-contained HTML file
```


This gives the best TypeScript experience and requires no ambient global declarations.

### Strategy B: BroMetal JS13k output

```plain text
fire.shader.ts
    ↓ BroMetal JS13k build
dist/brometal.js
dist/shaders.js
    ↓ classic script tags
globalThis.BroMetal
globalThis.Shaders
    ↓
main.ts accesses declared globals
```


This can work, but only if BroMetal's generated JS13k files intentionally expose globals. If they do not, adding a `.d.ts` file alone will not be enough. You would need either a small wrapper that assigns their exports to `globalThis`, or you should use Strategy A instead.

## Me
This is the outputted brometal.js:

```textmate
// BroMetal 0.18.0 — WebGPU runtime for 13 kB games.  https://brometal.dev/js13k
//
// Written by `brometal prod --js13k` alongside dist/shaders.js, so the two are
// always from the same compiler. Everything is a global function: concatenate
// this with your shaders and your game, then minify the whole program at once.
//
//   cat dist/brometal.js dist/shaders.js game.js > out.js
//   terser out.js --compress --mangle --toplevel -o game.min.js
//
// --toplevel is the flag that pays: it renames these functions and deletes
// every one you never call. Comments cost nothing — they never reach the zip.
//
// Generated. Edit your shaders, not this file.

// Facts both runtimes must agree on.
//
// A separate module with *no state* on purpose. These first lived alongside the
// core's device and canvas variables, and importing them from `full` dragged
// that whole module in — mutable module-level bindings defeat tree-shaking, and
// the regular runtime grew 575 bytes gzipped to share four constants.
//
// Nothing here holds state, so a bundler drops whatever a consumer does not use.
// `--js13k` concatenates this ahead of the core, so the tiny build pays only for
// what it actually references.
// These are the WebGPU and compiler details that have no room for two answers.
// `full` imports them rather than restating them, because every one of them has
// a wrong spelling that fails silently rather than throwing.
/** COPY_DST 8 | VERTEX 32. Spelled numerically: `GPUBufferUsage.VERTEX` is a
 *  property access no minifier can shorten, and this file ships to a 13 kB budget. */
const BUF_VERTEX = 40;
/** COPY_DST 8 | INDEX 16. */
const BUF_INDEX = 24;
/** COPY_DST 8 | UNIFORM 64. */
const BUF_UNIFORM = 72;
/** COPY_DST 8 | STORAGE 128. */
const BUF_STORAGE = 136;
/** COPY_DST 2 | TEXTURE_BINDING 4 | RENDER_ATTACHMENT 16. */
const TEX_UPLOAD = 22;
/**
 * TEXTURE_BINDING 4 | RENDER_ATTACHMENT 16, for a render target. No COPY_DST:
 * nothing is uploaded into one, it is drawn into. Drop either bit and it fails
 * silently in its own way — without 16 the pass rejects the texture, without 4
 * the draw that samples it back rejects the bind group, a frame later.
 */
const TEX_TARGET = 20;
/**
 * The format render targets are drawn in. Half float, not the canvas format,
 * and that is most of the reason to have targets at all: an 8-bit one clamps at
 * 1 on the way in, so the values a post-process pass is looking for — the ones
 * brighter than white — are gone before it runs.
 */
const TEX_HDR = 'rgba16float';
/** The entry points the compiler emits. Renaming one breaks both runtimes. */
const VS_ENTRY = 'vs_main';
const FS_ENTRY = 'fs_main';
const CS_ENTRY = 'cs_main';
/**
 * Which stages a binding is visible to: VERTEX 1 | FRAGMENT 2 | COMPUTE 4.
 *
 * Naming a stage the pipeline does not have invalidates the layout, and with it
 * the pipeline, the bind group and the submit — the error names the submit.
 *
 * The last two differ by spec, not preference: a `read_write` storage binding
 * may not be visible to the vertex stage, a read-only one may be visible
 * anywhere. That asymmetry is the seam compute writes through to rendering —
 * the restriction is on the binding, so the same buffer bound read-only in a
 * second program is fine.
 */
const VIS_RENDER = 3;
const VIS_COMPUTE = 4;
const VIS_STORAGE_RW = 6;
const VIS_STORAGE_RO = 7;
/**
 * Component count to vertex format. One component is `float32`, not
 * `float32x1` — the latter is not a WebGPU format and rejects the whole
 * pipeline, so a scalar instance attribute silently draws nothing.
 */
function vertexFormat(n) {
    return (n > 1 ? `float32x${n}` : 'float32');
}
/**
 * writeBuffer needs a 4-byte multiple from the source as well as the
 * destination, and a Uint16 index list usually is not one — three indices for a
 * triangle is six bytes. Returns the input untouched when it already aligns.
 */
function padTo4(data) {
    if ((data.byteLength & 3) === 0)
        return data;
    const padded = new Uint8Array((data.byteLength + 3) & ~3);
    padded.set(new Uint8Array(data.buffer, data.byteOffset, data.byteLength));
    return padded;
}
//# sourceMappingURL=gpu.js.map
// BroMetal tiny — the core runtime.
//
// This is the single source of truth for the parts of WebGPU that are the same
// whatever you are building: how a buffer is created and filled, how an
// attribute format is spelled, which bindings the compiler assigns, how the
// depth texture tracks the canvas. Every runtime bug found so far lived here —
// buffer padding, usage bits, `float32x1` — which is the argument for one copy.
//
// It is also a complete renderer on its own. `brometal prod --js13k` emits it as
// plain source with the `export` keywords stripped, so a 13 kB game gets globals
// it can concatenate and mangle. `full` imports the same file and builds its
// heavier program and draw path on these primitives.
//
// Two rules keep it honest:
//   - No validation and no messages. Guards are bytes a game could have spent.
//   - No feature that only `full` needs. Every seam here costs the 13 kB build.
// Device-wide state. One device, one canvas, one depth buffer.
let bmDevice;
let bmCtx;
let bmFormat;
let bmDepth = null;
let bmCanvas;
let bmClear;
/** The render pass currently open inside bmLoop's callback. */
let bmPass;
/**
 * The frame's command encoder, held here rather than inside bmLoop's closure so
 * bmPassTo can open a second pass on it. Passes recorded on one encoder run in
 * the order they were recorded, which is what lets a game draw a scene into a
 * target and then sample it in the same frame.
 */
let bmEnc;
// Model-view matrix stack, the shape SafeSpace used: mutate the current matrix,
// push before a subtree, pop after.
let bmM = bmIdentity();
const bmStack = [];
async function bmInit(canvas, clear) {
    bmCanvas = canvas;
    bmClear = clear || [0, 0, 0, 1];
    const adapter = (await navigator.gpu.requestAdapter());
    bmDevice = await adapter.requestDevice();
    bmCtx = canvas.getContext('webgpu');
    bmFormat = navigator.gpu.getPreferredCanvasFormat();
    bmCtx.configure({ device: bmDevice, format: bmFormat, alphaMode: 'opaque' });
}
/**
 * The bind group layout both pipeline kinds share.
 *
 * Binding 0 is always the uniform block; textures and storage buffers follow at
 * the indices the compiler chose, so this mirrors the emitted WGSL exactly.
 *
 * Textures take `vis` rather than FRAGMENT alone, which they had before compute
 * existed here. A compute pipeline has no fragment stage to name, so the mask
 * has to follow the pipeline kind — and for a render pipeline the widening to
 * VERTEX|FRAGMENT costs nothing and makes vertex texture fetch work, which the
 * full runtime has always allowed and this quietly rejected.
 *
 * Storage visibility ignores `vis` and follows whether the *compiler* saw a
 * write — a property of the shader, not of the pipeline kind. So a buffer this
 * module writes is hidden from the vertex stage, while one it only reads stays
 * visible there, which is how a draw program picks up what compute produced.
 */
function bmLayout(vis, u, texes, stores) {
    // Binding 0 is the uniform block only when there *is* one. A shader whose
    // uniforms are all samplers has no block, and the compiler then gives binding
    // 0 to the first texture — so declaring one here anyway collides with it and
    // the pipeline never builds. That is exactly the shape of a post-process
    // shader: one sampler, no scalars.
    const entries = u ? [{ binding: 0, visibility: vis, buffer: {} }] : [];
    for (const [tex, samp] of texes) {
        entries.push({ binding: tex, visibility: vis, texture: {} });
        entries.push({ binding: samp, visibility: vis, sampler: {} });
    }
    for (const [binding, written] of stores) {
        entries.push({
            binding,
            visibility: written ? VIS_STORAGE_RW : VIS_STORAGE_RO,
            buffer: { type: written ? 'storage' : 'read-only-storage' },
        });
    }
    return bmDevice.createBindGroupLayout({ entries });
}
/** The empty shell every program starts as, before its buffers are attached. */
function bmShell(p, l, opts) {
    return {
        p,
        l,
        // No block, no buffer — and `ub` is then what bmBind tests to decide whether
        // to bind one. WebGPU rejects a zero-sized buffer anyway, which is what the
        // old `|| 16` was there to dodge; a buffer nothing in the shader can read is
        // a stranger thing to allocate than none at all.
        ub: opts.u ? bmDevice.createBuffer({ size: opts.u, usage: BUF_UNIFORM }) : null,
        t: opts.t || [],
        st: opts.s || [],
        b: [],
        ix: null,
        n: 0,
        bg: null,
        tx: [],
        sb: [],
    };
}
function bmProgram(wgsl, opts) {
    const module = bmDevice.createShaderModule({ code: wgsl });
    const attrs = opts.a || [];
    const insts = opts.i || [];
    const bindLayout = bmLayout(VIS_RENDER, opts.u || 0, opts.t || [], opts.s || []);
    // One vertex buffer per attribute: simpler than interleaving, and the extra
    // bind cost is irrelevant next to the bytes a packing scheme would take.
    const buffers = attrs.map((n, i) => ({
        arrayStride: n * 4,
        attributes: [{ shaderLocation: i, offset: 0, format: vertexFormat(n) }],
    }));
    insts.forEach((n, i) => {
        buffers.push({
            arrayStride: n * 4,
            stepMode: 'instance',
            attributes: [
                { shaderLocation: attrs.length + i, offset: 0, format: vertexFormat(n) },
            ],
        });
    });
    const pipeline = bmDevice.createRenderPipeline({
        layout: bmDevice.createPipelineLayout({ bindGroupLayouts: [bindLayout] }),
        vertex: { module, entryPoint: VS_ENTRY, buffers },
        fragment: {
            module,
            entryPoint: FS_ENTRY,
            targets: [{
                format: opts.fmt ? TEX_HDR : bmFormat,
                // A ternary, not `&&`: the falsy branch has to be undefined, and 0 is
                // not a blend state.
                blend: opts.blend
                    ? {
                        color: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha' },
                        alpha: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha' },
                    }
                    : undefined,
            }],
        },
        primitive: { topology: 'triangle-list', cullMode: opts.cull ? 'back' : 'none' },
        // Transparent geometry tests against depth but must not write it, or the
        // layers behind it get clipped away.
        depthStencil: {
            format: 'depth24plus',
            depthWriteEnabled: opts.zwrite !== 0,
            depthCompare: 'less',
        },
    });
    return bmShell(pipeline, bindLayout, opts);
}
/**
 * A compute program. Same descriptor, `cs_main` instead of the draw pair.
 *
 * Separate from bmProgram rather than a flag on it: a compute-only module has
 * no `vs_main`, so one constructor would have to branch around
 * createRenderPipeline and that branch would ship in every game. Kept apart,
 * `--toplevel` drops this whole function from a game that only draws.
 */
function bmCompute(wgsl, opts) {
    const module = bmDevice.createShaderModule({ code: wgsl });
    const bindLayout = bmLayout(VIS_COMPUTE, opts.u || 0, opts.t || [], opts.s || []);
    const pipeline = bmDevice.createComputePipeline({
        layout: bmDevice.createPipelineLayout({ bindGroupLayouts: [bindLayout] }),
        compute: { module, entryPoint: CS_ENTRY },
    });
    return bmShell(pipeline, bindLayout, opts);
}
// A vertex, instance or index buffer. `index` picks the INDEX usage bit.
// The buffer is pinned to ArrayBuffer rather than ArrayBufferLike: WebGPU will
// not accept a SharedArrayBuffer view, and the wider type makes that a runtime
// surprise instead of a compile error.
function bmBuffer(data, index) {
    const size = (data.byteLength + 3) & ~3;
    // Usage bits, spelled as numbers because GPUBufferUsage.* is far longer:
    //   COPY_DST 8 | INDEX 16 = 24    COPY_DST 8 | VERTEX 32 = 40
    // Getting these wrong fails silently — WebGPU reports it as an uncaptured
    // error, not a throw, so the canvas just stays black.
    const buffer = bmDevice.createBuffer({ size, usage: index ? 24 : 40 });
    // writeBuffer wants a 4-byte multiple from the *source* as well as the
    // destination, and a Uint16 index list usually is not one — three indices for
    // a triangle is six bytes. Pad rather than make every caller think about it.
    if (data.byteLength & 3) {
        const padded = new Uint8Array(size);
        padded.set(new Uint8Array(data.buffer, data.byteOffset, data.byteLength));
        data = padded;
    }
    bmDevice.queue.writeBuffer(buffer, 0, data);
    return buffer;
}
function bmAttr(prog, slot, data) {
    prog.b[slot] = bmBuffer(data);
}
function bmIndex(prog, data) {
    prog.ix = bmBuffer(data, 1);
    prog.n = data.length;
}
// A 2D texture from anything drawImage-able: an ImageBitmap, a <canvas>, an
// <img>. Procedural textures painted into a 2D canvas are the js13k staple, and
// they arrive here directly.
function bmTexture(source, smooth) {
    const texture = bmDevice.createTexture({
        size: [source.width, source.height],
        format: 'rgba8unorm',
        usage: TEX_UPLOAD,
    });
    bmDevice.queue.copyExternalImageToTexture({ source }, { texture }, [source.width, source.height]);
    const filter = smooth === 0 ? 'nearest' : 'linear';
    return {
        v: texture.createView(),
        s: bmDevice.createSampler({
            magFilter: filter,
            minFilter: filter,
            addressModeU: 'repeat',
            addressModeV: 'repeat',
        }),
    };
}
/**
 * An off-screen surface to draw into and then sample: half of a post-process.
 *
 * The handle is `{v, s}` plus a depth view, so it *is* a BmTexture and
 * `bmTextures(prog, target)` binds it with no second API.
 *
 * **Depth comes with it, always.** Every pipeline bmProgram builds declares a
 * depthStencil state, and WebGPU requires a matching attachment on the pass — a
 * target without depth would be one nothing could be drawn into, so making it
 * optional moves an unbuildable API to a validation error at first draw.
 *
 * **Sampled linearly**, unlike `full`'s targets: there they hold simulation
 * state, here they are nearly always about to be blurred or downsampled. A pass
 * reading exact texel centres gets the exact texel either way.
 */
function bmTarget(w, h) {
    return {
        v: bmDevice
            .createTexture({ size: [w, h], format: TEX_HDR, usage: TEX_TARGET })
            .createView(),
        s: bmDevice.createSampler({ magFilter: 'linear', minFilter: 'linear' }),
        d: bmDevice
            .createTexture({ size: [w, h], format: 'depth24plus', usage: 16 })
            .createView(),
    };
}
/**
 * Point the rest of the frame at a target, or back at the canvas.
 *
 * Ends the open pass and starts another on the same encoder. A target clears as
 * it opens; the canvas *loads*, because bmLoop cleared it when the frame began
 * and clearing again would throw away everything drawn before the detour.
 *
 *   bmPassTo(scene)   // the world, into an HDR target
 *   ...draws...
 *   bmPassTo()        // back to the screen
 *   bmTextures(post, scene); bmDraw(post)
 *
 * Programs drawing into a target need `fmt: 1`: a pipeline's colour format is
 * baked in and has to match the attachment.
 */
function bmPassTo(target) {
    bmPass.end();
    bmPass = bmEnc.beginRenderPass({
        colorAttachments: [{
            view: target ? target.v : bmCtx.getCurrentTexture().createView(),
            clearValue: bmClear,
            loadOp: target ? 'clear' : 'load',
            storeOp: 'store',
        }],
        depthStencilAttachment: {
            view: target ? target.d : bmDepth.createView(),
            depthClearValue: 1,
            depthLoadOp: 'clear',
            depthStoreOp: 'store',
        },
    });
}
// Bind textures in the order the shader declares them. Rebuilding the bind
// group here rather than caching is deliberate: SafeSpace-style rendering swaps
// texture per batch, and a cache keyed on the set would cost more than it saves.
function bmTextures(prog, ...textures) {
    prog.tx = textures;
    prog.bg = null;
}
/**
 * A storage buffer, sized and seeded from a typed array.
 *
 * Returned rather than attached to a program, because the point of one is to
 * outlive a single program: compute writes it, a vertex stage reads it, two
 * programs holding one GPUBuffer. For pure output pass a zeroed array — an
 * explicit `new Float32Array(n)` says the size out loud.
 */
function bmStore(data) {
    const buffer = bmDevice.createBuffer({
        size: (data.byteLength + 3) & ~3,
        usage: BUF_STORAGE,
    });
    bmDevice.queue.writeBuffer(buffer, 0, padTo4(data));
    return buffer;
}
/** Bind storage buffers in the order the shader declares them. */
function bmStorages(prog, ...buffers) {
    prog.sb = buffers;
    prog.bg = null;
}
function bmUniforms(prog, floats) {
    // Unguarded on purpose, per the no-validation rule: calling this on a program
    // whose shader declares no uniform block is a mistake in the game, and the
    // null it throws on names the line.
    bmDevice.queue.writeBuffer(prog.ub, 0, floats);
}
/** Lazily built, and thrown away whenever a binding changes. */
function bmBind(prog) {
    if (!prog.bg) {
        const entries = prog.ub
            ? [{ binding: 0, resource: { buffer: prog.ub } }]
            : [];
        prog.t.forEach(([tex, samp], i) => {
            entries.push({ binding: tex, resource: prog.tx[i].v });
            entries.push({ binding: samp, resource: prog.tx[i].s });
        });
        prog.st.forEach(([binding], i) => {
            entries.push({ binding, resource: { buffer: prog.sb[i] } });
        });
        prog.bg = bmDevice.createBindGroup({ layout: prog.l, entries });
    }
    return prog.bg;
}
// Draw the bound geometry. `count` instances, defaulting to one.
function bmDraw(prog, count) {
    bmPass.setPipeline(prog.p);
    bmPass.setBindGroup(0, bmBind(prog));
    for (let i = 0; i < prog.b.length; i++)
        bmPass.setVertexBuffer(i, prog.b[i]);
    bmPass.setIndexBuffer(prog.ix, 'uint16');
    bmPass.drawIndexed(prog.n, count || 1);
}
/**
 * Run a compute program over `x` by `y` by `z` workgroups.
 *
 * Its own encoder and submit: a compute pass cannot nest inside the render pass
 * bmLoop holds open, and seeding a buffer before the loop starts has to work.
 *
 * **Called inside bmLoop's callback, this lands before that frame's drawing.**
 * The loop records its pass first but submits only after the callback returns,
 * so a submit from inside the callback is queued ahead of it — and work runs in
 * submission order. What compute writes here, the same frame draws.
 */
function bmDispatch(prog, x, y, z) {
    const encoder = bmDevice.createCommandEncoder();
    const pass = encoder.beginComputePass();
    pass.setPipeline(prog.p);
    pass.setBindGroup(0, bmBind(prog));
    pass.dispatchWorkgroups(x, y || 1, z || 1);
    pass.end();
    bmDevice.queue.submit([encoder.finish()]);
}
// The frame loop. Sizes the drawing buffer to the CSS box, rebuilds the depth
// texture when that changes, opens one render pass, and hands it to you.
function bmLoop(callback) {
    const frame = (now) => {
        const w = (bmCanvas.clientWidth * devicePixelRatio) | 0;
        const h = (bmCanvas.clientHeight * devicePixelRatio) | 0;
        if (bmCanvas.width != w || bmCanvas.height != h) {
            bmCanvas.width = w;
            bmCanvas.height = h;
            if (bmDepth)
                bmDepth.destroy();
            bmDepth = bmDevice.createTexture({
                size: [w, h],
                format: 'depth24plus',
                usage: 16,
            });
        }
        bmEnc = bmDevice.createCommandEncoder();
        bmPass = bmEnc.beginRenderPass({
            colorAttachments: [{
                view: bmCtx.getCurrentTexture().createView(),
                clearValue: bmClear,
                loadOp: 'clear',
                storeOp: 'store',
            }],
            depthStencilAttachment: {
                view: bmDepth.createView(),
                depthClearValue: 1,
                depthLoadOp: 'clear',
                depthStoreOp: 'store',
            },
        });
        callback(now / 1000);
        // Whichever pass is open when the callback returns — bmPassTo may have
        // swapped it more than once — is the one that gets closed.
        bmPass.end();
        bmDevice.queue.submit([bmEnc.finish()]);
        requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
}
// ── Matrices ──────────────────────────────────────────────────────────────
// Column-major, the order WGSL expects, so a Float32Array of these goes
// straight into the uniform block.
function bmIdentity() {
    return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
}
function bmMul(a, b) {
    const out = [];
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            let sum = 0;
            for (let k = 0; k < 4; k++)
                sum += a[k * 4 + j] * b[i * 4 + k];
            out[i * 4 + j] = sum;
        }
    }
    return out;
}
function bmPersp(fov, aspect, near, far) {
    const f = 1 / Math.tan(fov / 2);
    const d = 1 / (near - far);
    return [f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * d, -1, 0, 0, 2 * far * near * d, 0];
}
function bmLook(eye, at, up) {
    let z = [eye[0] - at[0], eye[1] - at[1], eye[2] - at[2]];
    let l = Math.hypot(z[0], z[1], z[2]);
    z = z.map((v) => v / l);
    let x = [
        up[1] * z[2] - up[2] * z[1],
        up[2] * z[0] - up[0] * z[2],
        up[0] * z[1] - up[1] * z[0],
    ];
    l = Math.hypot(x[0], x[1], x[2]) || 1;
    x = x.map((v) => v / l);
    const y = [
        z[1] * x[2] - z[2] * x[1],
        z[2] * x[0] - z[0] * x[2],
        z[0] * x[1] - z[1] * x[0],
    ];
    return [
        x[0], y[0], z[0], 0,
        x[1], y[1], z[1], 0,
        x[2], y[2], z[2], 0,
        -(x[0] * eye[0] + x[1] * eye[1] + x[2] * eye[2]),
        -(y[0] * eye[0] + y[1] * eye[1] + y[2] * eye[2]),
        -(z[0] * eye[0] + z[1] * eye[1] + z[2] * eye[2]),
        1,
    ];
}
function bmTrans(x, y, z) {
    return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1];
}
function bmScale(x, y, z) {
    return [x, 0, 0, 0, 0, y, 0, 0, 0, 0, z, 0, 0, 0, 0, 1];
}
function bmRotX(a) {
    const s = Math.sin(a), c = Math.cos(a);
    return [1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1];
}
function bmRotY(a) {
    const s = Math.sin(a), c = Math.cos(a);
    return [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1];
}
function bmRotZ(a) {
    const s = Math.sin(a), c = Math.cos(a);
    return [c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
}
// Matrix stack, as SafeSpace used it: save before drawing a subtree, restore
// after, and let the current matrix be mutated in between.
function bmSave() {
    bmStack.push(bmM.slice());
}
function bmRestore() {
    bmM = bmStack.pop();
}
//# sourceMappingURL=index.js.map```


This typing
```


## AI Assistant
That output confirms the JS13k build is **not exposing a `brometal` object**. It emits plain global functions such as:

```javascript
bmInit(...)
bmProgram(...)
bmAttr(...)
bmIndex(...)
bmUniforms(...)
bmDraw(...)
bmLoop(...)
```


So this will not be correct:

```typescript
Brometal.createRenderer(...)
Brometal.createProgram(...)
```


There is no `Brometal` global in the generated file.

## TypeScript declarations are possible

Create an ambient declaration file containing the global functions that your game uses:

```typescript
declare function bmInit(
  canvas: HTMLCanvasElement,
  clear?: [number, number, number, number],
): Promise<void>;

declare function bmProgram(
  wgsl: string,
  options: {
    a?: number[];
    i?: number[];
    u?: number;
    t?: Array<[number, number]>;
    s?: Array<[number, boolean]>;
    fmt?: number;
    blend?: boolean;
    cull?: boolean;
    zwrite?: number;
  },
): BmProgram;

declare function bmAttr(
  program: BmProgram,
  slot: number,
  data: ArrayBufferView,
): void;

declare function bmIndex(
  program: BmProgram,
  data: Uint16Array,
): void;

declare function bmUniforms(
  program: BmProgram,
  values: Float32Array,
): void;

declare function bmDraw(
  program: BmProgram,
  count?: number,
): void;

declare function bmLoop(
  callback: (time: number) => void,
): void;

interface BmProgram {
  p: GPURenderPipeline;
  l: GPUBindGroupLayout;
  ub: GPUBuffer | null;
  t: Array<[number, number]>;
  st: Array<[number, boolean]>;
  b: GPUBuffer[];
  ix: GPUBuffer | null;
  n: number;
  bg: GPUBindGroup | null;
  tx: BmTexture[];
  sb: GPUBuffer[];
}

interface BmTexture {
  v: GPUTextureView;
  s: GPUSampler;
}
```


The declarations are erased during compilation. They do not add imports and do not increase the final bundle size.

Make sure the declaration file is included by your `tsconfig.json`. Since it is under `src`, your existing `include` setting may already cover it.

## Use the JS13k API directly

Your renderer code would then use the generated global functions:

```typescript
export async function createRender() {
  const canvas = document.querySelector("canvas");

  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error("Canvas not found");
  }

  await bmInit(canvas, [0, 0, 0, 1]);

  // The exact shader object and arguments come from dist/shaders.js.
  const program = createFireProgram();

  const positions = new Float32Array([
    -1, -1, 0,
     1, -1, 0,
     1,  1, 0,
    -1,  1, 0,
  ]);

  const indices = new Uint16Array([0, 1, 2, 0, 2, 3]);

  bmAttr(program, 0, positions);
  bmIndex(program, indices);

  bmLoop((time) => {
    bmUniforms(program, new Float32Array([
      time,
      canvas.width / canvas.height,
    ]));

    bmDraw(program);
  });
}
```


However, `createFireProgram()` is only an example name. You need to inspect `dist/shaders.js` to find the generated shader function and its expected arguments.

The important change is that you should no longer import these:

```typescript
import {
  createProgram,
  createRenderer,
  createPlane,
} from "brometal";
```


and you should no longer import the source shader:

```typescript
import { Fire as fireShader } from "./fire.shader.ts";
```


Both imports cause Vite to bundle the regular BroMetal module path.

## What should be in `shaders.js`?

The generated `shaders.js` should contain shader-specific global functions that call the runtime globals. Conceptually, it may look similar to:

```javascript
function fireProgram() {
  return bmProgram("...", {
    a: [3, 2],
    u: 8,
  });
}
```


The actual function name and signature depend on BroMetal's generated output. Use that generated function from TypeScript and declare it in `brometal.d.ts`:

```typescript
declare function fireProgram(): BmProgram;
```


If the generated file contains a different function, declare that exact function instead.

## Important: load order

The generated files must load before your Vite module:

```html
<script src="./brometal.js"></script>
<script src="./shaders.js"></script>
<script type="module" src="./src/main.ts"></script>
```


The order matters:

```plain text
brometal.js
  ↓ defines bmProgram, bmInit, bmDraw, etc.
shaders.js
  ↓ uses those runtime functions
main.js
  ↓ uses the generated shader functions
```


## Your Vite configuration

If `dist` is configured as `publicDir`, Vite copies those files to `build`. Your HTML can therefore reference them as:

```html
<script src="./brometal.js"></script>
<script src="./shaders.js"></script>
<script type="module" src="./src/main.ts"></script>
```


But be careful with `vite-plugin-singlefile`: these external classic scripts may remain external rather than being inlined. Check the generated `build/index.html`.

For the external-file strategy, package all three files:

```javascript
const zip = zipSync({
  "index.html": strToU8(html),
  "brometal.js": await readFile(resolve("build/brometal.js")),
  "shaders.js": await readFile(resolve("build/shaders.js")),
  "game.js": await readFile(resolve("build/assets/index.js")),
});
```


The exact Vite JavaScript filename may differ.

## Terser must concatenate the files

BroMetal's generated runtime is deliberately designed to be concatenated and minified as one script:

```textmate
cat dist/brometal.js dist/shaders.js game.js > game.unminified.js
pnpm exec terser game.unminified.js --compress --mangle --toplevel -o game.min.js
```


This is why the functions are plain globals rather than module exports. `--toplevel` can then rename and remove unused functions across the runtime, shader output, and game code.

This also means that using Vite to bundle the game while separately loading `brometal.js` and `shaders.js` is not the ideal final JS13k pipeline. It can work for development, but the intended production pipeline is:

```plain text
BroMetal JS13k output
        ↓
compile your game TypeScript to JavaScript
        ↓
concatenate brometal.js + shaders.js + game.js
        ↓
Terser with --toplevel
        ↓
put the final script in index.html
        ↓
ZIP
```


For TypeScript development, use the `.d.ts` declarations. For production, compile the TypeScript and concatenate the resulting JavaScript with BroMetal's two generated files.

## Me
The shaders.js contains the following program, how should I type it?

```

```


## Me
```
// Generated by BroMetal 0.18.0 (--js13k), alongside dist/brometal.js.
// Concatenate both with your game, then minify the whole program together
// (terser --toplevel --mangle).
//
// Each entry is [wgsl, attrSizes, instanceAttrSizes, uniformBytes, textureBindings,
// storageBindings] and goes straight into
//   bmProgram(src[0], { a: src[1], i: src[2], u: src[3], t: src[4], s: src[5] })
// or bmCompute(...) with the same descriptor, for a shader with a compute() stage.

// uniform floats: uTime @0, uAspect @1
const Fire = ["struct BmUniforms {\n  uTime : f32,\n  uAspect : f32,\n}\n@group(0) @binding(0) var<uniform> bm_u : BmUniforms;\nstruct BmVSIn {\n  @location(0) aPosition : vec3f,\n  @location(1) aUv : vec2f,\n}\nstruct BmVSOut {\n  @builtin(position) bm_position : vec4f,\n  @location(0) vUv : vec2f,\n}\nfn hash21(p : vec2f) -> f32 {\n  return fract(sin(dot(p, vec2f(127.1, 311.7))) * 43758.5453);\n}\nfn vnoise2(p : vec2f) -> f32 {\n  let cell = vec2f(floor(p.x), floor(p.y));\n  let f = p - cell;\n  let u = vec2f(f.x * f.x * (3.0 - 2.0 * f.x), f.y * f.y * (3.0 - 2.0 * f.y));\n  let a = hash21(cell);\n  let b = hash21(cell + vec2f(1.0, 0.0));\n  let c = hash21(cell + vec2f(0.0, 1.0));\n  let d = hash21(cell + vec2f(1.0, 1.0));\n  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);\n}\nfn fbm2(p : vec2f, octaves : f32) -> f32 {\n  var total = 0.0;\n  var amplitude = 0.5;\n  var frequency = 1.0;\n  var norm = 0.0;\n  for (var i = 0.0; i < octaves; i = i + 1.0) {\n    total = total + amplitude * vnoise2(p * frequency);\n    norm = norm + amplitude;\n    amplitude = amplitude * 0.5;\n    frequency = frequency * 2.0;\n  }\n  return total / norm;\n}\n@vertex\nfn vs_main(bm_in : BmVSIn) -> BmVSOut {\n  var bm_out : BmVSOut;\n  bm_out.vUv = bm_in.aUv;\n  bm_out.bm_position = vec4f(bm_in.aPosition, 1.0);\n  bm_out.bm_position.z = (bm_out.bm_position.z + bm_out.bm_position.w) * 0.5;\n  return bm_out;\n}\n@fragment\nfn fs_main(bm_in : BmVSOut) -> @location(0) vec4f {\n  let q = vec2f(bm_in.vUv.x * bm_u.uAspect * 2.4, bm_in.vUv.y * 2.0 - bm_u.uTime * 1.3);\n  let n = fbm2(q * 2.2, 5.0);\n  let shape = clamp(1.25 - bm_in.vUv.y * 1.6 + (n - 0.5) * 1.1, 0.0, 1.0);\n  let heat = pow(shape, 1.6);\n  return vec4f(pow(heat, 0.8) * 1.05, pow(heat, 2.2), pow(heat, 6.0), 1.0);\n}\n",[3,2],[],16,[]];
```



## AI Assistant
`shaders.js` defines `Fire` as a global constant:

```javascript
const Fire = [wgsl, attributes, instanceAttributes, uniformBytes, textures];
```


It is not a module export and it is not a `Brometal` object. You should type it as a BroMetal shader descriptor and declare it globally.

## Type the generated shader

```typescript
type BmTextureBinding = readonly [number, number];
type BmStorageBinding = readonly [number, boolean];

type BmShaderSource = readonly [
  wgsl: string,
  attributeSizes: readonly number[],
  instanceAttributeSizes: readonly number[],
  uniformBytes: number,
  textureBindings: readonly BmTextureBinding[],
  storageBindings?: readonly BmStorageBinding[],
];

interface BmProgram {
  p: GPURenderPipeline;
  l: GPUBindGroupLayout;
  ub: GPUBuffer | null;
  t: BmTextureBinding[];
  st: BmStorageBinding[];
  b: GPUBuffer[];
  ix: GPUBuffer | null;
  n: number;
  bg: GPUBindGroup | null;
  tx: BmTexture[];
  sb: GPUBuffer[];
}

interface BmTexture {
  v: GPUTextureView;
  s: GPUSampler;
}

declare const Fire: BmShaderSource;

declare function bmInit(
  canvas: HTMLCanvasElement,
  clear?: readonly [number, number, number, number],
): Promise<void>;

declare function bmProgram(
  wgsl: string,
  options: {
    a?: readonly number[];
    i?: readonly number[];
    u?: number;
    t?: readonly BmTextureBinding[];
    s?: readonly BmStorageBinding[];
    fmt?: number;
    blend?: boolean;
    cull?: boolean;
    zwrite?: number;
  },
): BmProgram;

declare function bmAttr(
  program: BmProgram,
  slot: number,
  data: ArrayBufferView,
): void;

declare function bmIndex(
  program: BmProgram,
  data: Uint16Array,
): void;

declare function bmUniforms(
  program: BmProgram,
  values: Float32Array,
): void;

declare function bmDraw(
  program: BmProgram,
  count?: number,
): void;

declare function bmLoop(
  callback: (time: number) => void,
): void;
```


The optional sixth tuple element is included because compute shaders may have storage bindings. Your current `Fire` descriptor has five elements:

```typescript
[
  string,
  number[],
  number[],
  number,
  textureBindings,
]
```


That is compatible with the declaration above.

## Use the descriptor

The JS13k API does not have `createRenderer`, `createProgram`, or `createPlane`. Those belong to the regular BroMetal runtime API.

Your example should construct the program from the generated descriptor:

```typescript
export async function createRender() {
  const canvas = document.querySelector("canvas");

  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error("Canvas not found");
  }

  await bmInit(canvas, [0, 0, 0, 1]);

  const program = bmProgram(Fire[0], {
    a: Fire[1],
    i: Fire[2],
    u: Fire[3],
    t: Fire[4],
    s: Fire[5],
  });

  const positions = new Float32Array([
    -1, -1, 0,
     1, -1, 0,
     1,  1, 0,
    -1,  1, 0,
  ]);

  const uvs = new Float32Array([
    0, 0,
    1, 0,
    1, 1,
    0, 1,
  ]);

  const indices = new Uint16Array([
    0, 1, 2,
    0, 2, 3,
  ]);

  bmAttr(program, 0, positions);
  bmAttr(program, 1, uvs);
  bmIndex(program, indices);

  bmLoop((time) => {
    bmUniforms(
      program,
      new Float32Array([
        time,
        canvas.width / canvas.height,
      ]),
    );

    bmDraw(program);
  });
}
```


Since your particular `Fire` array does not contain a sixth element, this is also valid:

```typescript
const program = bmProgram(Fire[0], {
  a: Fire[1],
  i: Fire[2],
  u: Fire[3],
  t: Fire[4],
});
```


The `s: Fire[5]` form is useful for a shared generic helper, but it is optional for this shader.

## Why the declaration works

The browser executes these scripts in order:

```html
<script src="./brometal.js"></script>
<script src="./shaders.js"></script>
<script type="module" src="./src/main.ts"></script>
```


At runtime:

```plain text
brometal.js
  defines bmInit, bmProgram, bmAttr, bmDraw, etc.

shaders.js
  defines Fire

main.ts
  calls those globals
```


The `.d.ts` file tells TypeScript about those values, but emits no JavaScript. Therefore it does not cause Vite to bundle BroMetal or the shader source.

## Important Vite issue

Make sure `shaders.js` is not also imported anywhere:

```typescript
import { Fire } from "./fire.shader.ts";
```


Remove that import. Otherwise Vite will still bundle the source shader and regular BroMetal runtime in addition to the external JS13k files.

Your application should only refer to the declared global:

```typescript
const program = bmProgram(Fire[0], {
  a: Fire[1],
  i: Fire[2],
  u: Fire[3],
});
```


## One caveat about `const Fire`

A top-level `const` in a classic script is available to later scripts through global lexical scope in normal browser execution, but it is not a property of `window`:

```typescript
window.Fire
```


is not necessarily available.

Use the identifier directly:

```typescript
Fire
```


If TypeScript or the browser does not resolve it as expected, the most robust generated-file format would be:

```javascript
globalThis.Fire = [...]
```


But changing BroMetal's generated output is probably undesirable for the size-optimized build. The generated comments explicitly indicate that the file is intended to be concatenated with the game, so direct global identifier access is the intended model.

## Me
Can I generate the d.ts based on the included shaders that I have? I think the file mirrors the fire.shader.ts

## AI Assistant
Yes. Since the generated `shaders.js` contains declarations such as:

```javascript
const Fire = [/* WGSL */, [3, 2], [], 16, []];
```


you can generate a TypeScript declaration file from the shader names automatically.

The declaration does not need to reproduce the WGSL string or infer the uniform names. The JS13k runtime only needs the descriptor tuple:

```plain text
[
  WGSL source,
  vertex attribute sizes,
  instance attribute sizes,
  uniform byte count,
  texture bindings,
  storage bindings?
]
```


## Shared descriptor types

```typescript
type BmTextureBinding = readonly [number, number];
type BmStorageBinding = readonly [number, boolean];

type BmShaderSource = readonly [
  wgsl: string,
  attributeSizes: readonly number[],
  instanceAttributeSizes: readonly number[],
  uniformBytes: number,
  textureBindings: readonly BmTextureBinding[],
  storageBindings?: readonly BmStorageBinding[],
];

declare function bmInit(
  canvas: HTMLCanvasElement,
  clear?: readonly [number, number, number, number],
): Promise<void>;

declare function bmProgram(
  wgsl: string,
  options: {
    a?: readonly number[];
    i?: readonly number[];
    u?: number;
    t?: readonly BmTextureBinding[];
    s?: readonly BmStorageBinding[];
    fmt?: number;
    blend?: boolean;
    cull?: boolean;
    zwrite?: number;
  },
): BmProgram;

declare function bmAttr(
  program: BmProgram,
  slot: number,
  data: ArrayBufferView,
): void;

declare function bmIndex(
  program: BmProgram,
  data: Uint16Array,
): void;

declare function bmUniforms(
  program: BmProgram,
  values: Float32Array,
): void;

declare function bmDraw(
  program: BmProgram,
  count?: number,
): void;

declare function bmLoop(
  callback: (time: number) => void,
): void;

interface BmProgram {
  p: GPURenderPipeline;
  l: GPUBindGroupLayout;
  ub: GPUBuffer | null;
  t: BmTextureBinding[];
  st: BmStorageBinding[];
  b: GPUBuffer[];
  ix: GPUBuffer | null;
  n: number;
  bg: GPUBindGroup | null;
  tx: BmTexture[];
  sb: GPUBuffer[];
}

interface BmTexture {
  v: GPUTextureView;
  s: GPUSampler;
}
```


## Generate declarations from `shaders.js`

Create a small Node script:

```javascript
import { readFile, writeFile } from "node:fs/promises";

const inputPath = "dist/shaders.js";
const outputPath = "src/render/shaders.d.ts";

const source = await readFile(inputPath, "utf8");

// Matches generated entries such as:
// const Fire = [...];
// const Water = [...];
const shaderNames = [
  ...source.matchAll(
    /^\s*const\s+([A-Za-z_$][\w$]*)\s*=\s*\[/gm,
  ),
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
```


For the generated file in your example, this will produce:

```typescript
// Generated file. Do not edit manually.

declare const Fire: BmShaderSource;
```


The `BmShaderSource` type is available because both declaration files are included in `src`.

## Add it to the build

Run the declaration generator after BroMetal emits `dist/shaders.js`:

```json
{
  "scripts": {
    "dev": "vite",
    "build:shaders": "pnpm exec brometal prod --js13k",
    "build:shader-types": "node scripts/generate-shader-types.mjs",
    "build:package": "vite build",
    "build:zip": "node scripts/package-build.mjs",
    "build": "pnpm run build:shaders && pnpm run build:shader-types && pnpm run build:package && pnpm run build:zip",
    "test": "vitest"
  }
}
```


You can combine the two first steps:

```json
{
  "scripts": {
    "build:shaders": "pnpm exec brometal prod --js13k && node scripts/generate-shader-types.mjs",
    "build:package": "vite build",
    "build:zip": "node scripts/package-build.mjs",
    "build": "pnpm run build:shaders && pnpm run build:package && pnpm run build:zip"
  }
}
```


## Use `Fire` from TypeScript

Your TypeScript code can now refer to the generated global:

```typescript
export function createFireProgram(): BmProgram {
  return bmProgram(Fire[0], {
    a: Fire[1],
    i: Fire[2],
    u: Fire[3],
    t: Fire[4],
    s: Fire[5],
  });
}
```


For this particular shader, the descriptor is effectively:

```typescript
const Fire: BmShaderSource = [
  /* WGSL */,
  [3, 2],
  [],
  16,
  [],
];
```


The fifth element is the empty texture-binding list. The sixth element is absent because this shader has no storage bindings.

## Keep runtime typing separate from shader-source typing

The generated `Fire` descriptor does **not** provide a typed object such as:

```typescript
program.uniforms.uTime.set(...)
```


That API belongs to the regular BroMetal runtime. In JS13k mode, uniforms are packed into a `Float32Array` and submitted with:

```typescript
bmUniforms(program, new Float32Array([
  time,
  aspect,
]));
```


The order comes from the generated shader comment:

```plain text
uTime @0
uAspect @1
```


So you can optionally add a shader-specific helper to make the uniform layout clearer:

```typescript
function setFireUniforms(
  program: BmProgram,
  time: number,
  aspect: number,
): void {
  bmUniforms(program, new Float32Array([time, aspect]));
}
```


Then use:

```typescript
bmLoop((time) => {
  setFireUniforms(program, time, canvas.width / canvas.height);
  bmDraw(program);
});
```


This gives you TypeScript checking for the global descriptor, runtime functions, program objects, and uniform data without importing the regular `brometal` runtime into Vite.

## Me
The fire shader also imports something from brometal. Should I also use the globals here instead of using the brometal imports? Or would that break brometal?

## AI Assistant
Keep those imports in `fire.shader.ts`.

They are **compiler-time imports**, not browser-runtime imports. BroMetal needs them when it processes the shader source:

```typescript
import { shader, vec2, vec4, clamp, pow } from "brometal";
import { fbm2 } from "brometal/shader-functions";
```


During:

```textmate
pnpm exec brometal prod --js13k
```


BroMetal evaluates/transforms that TypeScript shader and emits the WGSL descriptor into `shaders.js`. The generated output contains the finished WGSL string, not the original `shader`, `vec2`, `fbm2`, `clamp`, or `pow` calls.

The resulting dependency flow is:

```plain text
fire.shader.ts
  ├─ imports brometal compiler DSL
  └─ imports brometal shader functions
        ↓
BroMetal compiler
        ↓
dist/shaders.js
  └─ const Fire = [generated WGSL, ...]
```


The browser then loads:

```plain text
brometal.js
shaders.js
game.js
```


It does **not** load or execute `fire.shader.ts`.

## Do not replace the shader imports with JS13k globals

Do not change the shader source to something like:

```typescript
const Fire = shader({
  // ...
});
```


or:

```typescript
const q = vec2(...);
```


using the JS13k runtime globals.

The JS13k globals are runtime rendering functions such as:

```typescript
bmInit
bmProgram
bmAttr
bmUniforms
bmDraw
bmLoop
```


They are not the shader compiler DSL. The JS13k runtime does not provide replacements for:

```typescript
shader
vec2
vec4
clamp
pow
fbm2
```


Those shader functions are consumed during compilation and become WGSL.

## Prevent Vite from seeing the shader source

The important rule is that your application code must not import the source shader:

```typescript
import { Fire as fireShader } from "./fire.shader.ts";
```


That makes Vite process the shader source and may pull the regular BroMetal package into your application bundle.

Instead:

- `fire.shader.ts` is read by the BroMetal build;
- `shaders.js` is loaded by a `<script>` tag;
- `shaders.d.ts` tells TypeScript that `Fire` exists;
- application code uses the generated global `Fire`.

For example:

```typescript
const program = bmProgram(Fire[0], {
  a: Fire[1],
  i: Fire[2],
  u: Fire[3],
  t: Fire[4],
});
```


## Your two environments are intentionally different

### Shader compilation environment

```typescript
import { shader, vec2, vec4, clamp, pow } from "brometal";
import { fbm2 } from "brometal/shader-functions";
```


This code is only for BroMetal.

### Game runtime environment

```typescript
await bmInit(canvas);
const program = bmProgram(Fire[0], {
  a: Fire[1],
  i: Fire[2],
  u: Fire[3],
});
bmUniforms(program, values);
bmDraw(program);
```


This code runs in the browser.

So the imports in `fire.shader.ts` are correct and should remain unchanged. The duplication problem comes from importing `fire.shader.ts` into the game, not from the shader's own compiler imports.
