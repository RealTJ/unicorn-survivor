import { describe, it, expect, afterEach } from "vitest";
import { createWorld } from "./world.ts";
import { V2 } from "../utils/vector2";

describe.skip("world", () => {
  const world = createWorld({ size: new V2(1024, 1024), seed: 0 });
});
