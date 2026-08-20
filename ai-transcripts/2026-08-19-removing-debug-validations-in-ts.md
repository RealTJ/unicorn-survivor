## Me
Using TypeScript for validation, instead of doing runtime validation?

Using it for code golfing and I want to use asserts so that the code is still clean, but it's not output into the final bundle.

Or should I use a build step that go over all the typescript code and removes the debug / assert statements as I will not load any external code / json ever. Theoretically TypeScript should be enough.

## AI Assistant
TypeScript alone **will not** remove assertion calls or debug statements from your final output. TypeScript's compiler (`tsc`) only performs **type erasure**—it removes type annotations, interfaces, and types, but it explicitly avoids altering or optimizing your runtime JavaScript logic.

If you write a function call like `assert(condition)`, TypeScript will emit exactly that in the resulting JavaScript.

Since you are code golfing and want to keep the final bundle as small as possible, **you must use a build step** (like esbuild, Terser, Rollup, or Vite) to strip out these assertions via Dead Code Elimination (DCE).

Here is the standard and cleanest way to achieve this:

### 1. The TypeScript Setup (Static Validation)

You can use TypeScript's `asserts` keyword to tell the compiler that a condition must be true, keeping your types strict without needing runtime checks in production.

```typescript
// Define a global constant that your bundler will replace
declare const __DEBUG__: boolean;

// A custom assert function using TypeScript's `asserts` signature
export function assert(condition: any, msg?: string): asserts condition {
  if (__DEBUG__ && !condition) {
    throw new Error(msg);
  }
}

// Usage in your code
export function processValue(val: string | null) {
  // TypeScript will narrow 'val' to 'string' after this line
  assert(val !== null, "Value cannot be null");
  
  // val is now strictly 'string'
  return val.toUpperCase();
}
```


### 2. The Build Step (Dead Code Elimination)

To prevent `assert` function calls from ending up in your final bundle, you shouldn't just rely on the `__DEBUG__` check inside the function (because the function call `assert(...)` will still be in the bundle). Instead, you wrap the *call* in the debug check, or use a bundler plugin to strip the `assert` calls entirely.

#### Approach A: Strip the calls using a bundler/minifier

Most modern bundlers (like Vite, esbuild, or Webpack using Terser) allow you to define global constants. If you define `__DEBUG__` as `false` during the build, the minifier will see `if (false)` and completely remove the dead code.

To completely remove the function *call* itself, you can use **esbuild's `drop` feature** or a plugin like `@rollup/plugin-strip`.

For example, using esbuild (which Vite uses under the hood):
```shell script
esbuild main.ts --bundle --minify --drop:console --drop:debugger
```

*(Note: esbuild doesn't natively drop custom function calls out-of-the-box via CLI flags, so developers often use pure annotations `/* @__PURE__ */` or Babel plugins like `babel-plugin-unassert` for aggressive golfing).*

#### Approach B: The `if (__DEBUG__)` wrapper pattern

If you want pure dead-code elimination without AST-transform plugins, wrap the checks:

```typescript
declare const __DEBUG__: boolean;

export function processValue(val: string | null) {
  if (__DEBUG__) {
    // If __DEBUG__ is replaced with `false` by your bundler, 
    // the minifier removes this entire block.
    if (val === null) throw new Error("Null value");
  }
  
  // You might need a non-null assertion operator (!) here 
  // since the TS compiler doesn't know the minifier will remove the check.
  return val!.toUpperCase(); 
}
```


### Summary
* **Use TypeScript** for authoring time: It proves your logic is sound based on the types.
* **Use a Build Step** for compile time: Minifiers (Terser/esbuild) or strippers (`unassert`) are necessary to physically remove the assertion code from your final golfed bundle. TypeScript is not a minifier.
