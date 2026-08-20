import { describe, it, expect } from "vitest";
import { createEntity } from "./entity.ts";

describe("entity", () => {
  it("should create a entity with correct size", () => {
    const entity = createEntity({
      size: 10,
    });
    expect(entity).toBeDefined();
    expect(entity.size).toBe(10);
  });
});
