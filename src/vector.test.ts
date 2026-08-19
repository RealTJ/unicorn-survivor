import { describe, it, expect } from "vitest";
import { Vector } from "./vector.ts";

describe("vector", () => {
  it("should create a vector", () => {
    const vector = new Vector(1, 2);
    expect(vector.x).toBe(1);
    expect(vector.y).toBe(2);
  });
  it("should add vectors", () => {
    const vector1 = new Vector(1, 2);
    const vector2 = new Vector(3, 4);
    const result = vector1.add(vector2);
    expect(result.x).toBe(4);
    expect(result.y).toBe(6);
  });
  it("should not create wrong vectors", () => {
    expect(() => new Vector(1, 2, 3)).toThrow();
  });
});
