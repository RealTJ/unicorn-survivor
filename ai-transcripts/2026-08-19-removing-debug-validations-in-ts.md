## Me
For code golfing I want to remove validations from the output, e.g. in this vector class I test for ...rest and x, y, but this is only needed in a "debug" build and not in the final release. As I'm not loading any external data from disk or network.

But while I'm writing the code base I want these asserts to be there.

## AI Assistant
That's a classic "dead code elimination" pattern. The trick is to use a global boolean constant (something like `__DEV__`) that a bundler/minifier can replace with a literal `true` or `false` at build time. Once it's a literal `false`, tools like **esbuild** (which Vitest/Vite use under the hood) or **Terser** will completely erase the `if (false) { ... }` block — including the `throw` statements and any error message strings — during the production build. In dev/test mode it stays `true`, so your assertions run normally.

Here's how to set that up:

### 1. Declare the global flag's type

New file, e.g. `src/globals.d.ts`:

```typescript
declare const __DEV__: boolean;
```


### 2. Define the flag in your Vite/Vitest config

Since Vitest is built on Vite, you can use the same `define` option there, and reuse the config for your real build if you build with Vite/esbuild.

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  define: {
    __DEV__: process.env.NODE_ENV !== "production",
  },
  test: {
    // __DEV__ will be `true` here, so asserts run during tests
  },
});
```


If your production build uses plain `esbuild` (or `tsup`, which wraps it) instead of Vite, pass the same thing via its `define` option, e.g. `esbuild.build({ define: { __DEV__: "false" } })`, and its minifier will strip the dead branch.

### 3. Guard the validations with `__DEV__`

```typescript
export class Vector {
  constructor(
    public x: number,
    public y: number,
    ...rest: number[]
  ) {
    if (__DEV__) {
      if (rest.length > 0) {
        throw new Error("Vector can only have two dimensions");
      }
      if (x <= 0 || y <= 0) {
        throw new Error("Vector must be positive");
      }
    }
  }
  add(other: Vector) {
    return new Vector(this.x + other.x, this.y + other.y);
  }
}
```


### Why this works

- During `vitest run`/`vitest`, `__DEV__` is `true`, so the guarded code behaves exactly as before — your tests can still verify the thrown errors.
- During a production build with `NODE_ENV=production`, `define` substitutes `__DEV__` with the literal `false`. Esbuild/Terser then recognize `if (false) { ... }` as unreachable and drop the entire block, including the `throw new Error(...)` strings — shrinking your golfed output and removing the runtime overhead entirely.

A couple of extra notes:

- Since `...rest` is now unused for its length check outside of `__DEV__`, TypeScript might still keep it in the type signature (needed for the public API), but the runtime check disappears — that's fine, it doesn't affect emitted JS size for the constructor body itself.
- If you want this pattern everywhere without repeating `if (__DEV__)`, you could write a tiny `invariant(condition, message)` helper and call it plainly; some bundler plugins (e.g. `babel-plugin-dev-expression`, or the `unassert`/`babel-plugin-unassert` ecosystem) are specifically built to strip `invariant`/`assert`-style calls in production builds. But given you're already on esbuild via Vite/Vitest, the `__DEV__` + `define` approach avoids adding another dependency.
