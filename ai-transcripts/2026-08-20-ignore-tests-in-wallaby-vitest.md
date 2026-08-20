## Me
In Wallaby.js can I get to ignore a test? I use vitest

## AI Assistant
Yes. With Vitest, use Vitest’s standard skip APIs, and Wallaby.js will respect them.

```typescript
import { describe, expect, it } from "vitest";

describe.skip("temporarily disabled suite", () => {
  it("is not run", () => {
    expect(true).toBe(false);
  });
});

it.skip("temporarily disabled test", () => {
  expect(true).toBe(false);
});
```


You can also use:

```typescript
it.todo("implement this test");
test.todo("implement this test");
```


For conditional skipping:

```typescript
it.skipIf(process.env.CI)("runs locally only", () => {
  // ...
});

it.runIf(process.env.RUN_INTEGRATION === "true")("conditional test", () => {
  // ...
});
```


For a quick local debugging session, `only` runs just the selected test, but remember to remove it afterward:

```typescript
it.only("focused test", () => {
  // ...
});
```


You can also skip from the Wallaby.js test tree/context menu if your Wallaby integration exposes that action, but putting `.skip` in the Vitest test source is the most reliable and portable approach.
