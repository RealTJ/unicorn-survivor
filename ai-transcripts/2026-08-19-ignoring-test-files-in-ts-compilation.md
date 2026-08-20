## Me
When using tsc to build my output I want to ignore the *.test.ts - i have added it to the exclude in my tsconfig.json, but it still emits it.

What can I do?

## AI Assistant
When you add files to the `exclude` array in your `tsconfig.json`, TypeScript will ignore them when scanning for files to include in the compilation. However, **TypeScript will still compile those excluded files if they are imported by another file that is included in the build.**

Here are the most common reasons why this happens and how to fix it:

### 1. Check for Accidental Imports
The most common culprit is a non-test file importing something from a test file (or a test helper/mock file).
If `src/main.ts` includes `import { mockData } from './data.test.ts'`, TypeScript is forced to compile `data.test.ts` regardless of your `exclude` settings.

**Fix:** Search your codebase for imports pointing to your test files and remove them or move the shared code to a non-test utility file.

### 2. Verify your Exclude Pattern
Make sure your exclude pattern uses the globstar (`**`) to catch test files in any subdirectory, not just the root.

```json
{
  "compilerOptions": {
    // ... your options
  },
  "exclude": [
    "node_modules",
    "**/*.test.ts",
    "**/*.spec.ts"
  ]
}
```


### 3. Use a Separate "Build" Config (Recommended)
A best practice in TypeScript projects (especially when using testing frameworks like Vitest or Jest) is to have a base `tsconfig.json` for your editor (which includes tests so you get IDE support) and a separate `tsconfig.build.json` specifically for `tsc`.

Create a `tsconfig.build.json`:
```json
{
  "extends": "./tsconfig.json",
  "exclude": [
    "node_modules",
    "**/*.test.ts",
    "**/*.spec.ts",
    "tests/**/*" 
  ]
}
```


Then, run your build command pointing to the specific config:
```shell script
tsc -p tsconfig.build.json
```


This ensures your IDE still understands your tests, but your production build completely ignores them.
