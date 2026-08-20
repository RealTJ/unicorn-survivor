import { describe, it, expect } from "vitest";
import { Vector2 } from "./vector2.ts";

describe("vector2", () => {
  it("should create a vector2", () => {
    const vector = new Vector2(1, 2);
    expect(vector.x).toBe(1);
    expect(vector.y).toBe(2);
  });
  it("should add vector2s", () => {
    const vector1 = new Vector2(1, 2);
    const vector2 = new Vector2(3, 4);
    const result = vector1.add(vector2);
    expect(result.x).toBe(4);
    expect(result.y).toBe(6);
  });
  it("should not create wrong vector2s", () => {
    expect(() => new Vector2(1, 2, 3)).toThrow();
  });
});
