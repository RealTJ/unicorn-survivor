import { describe, it, expect, afterEach } from "vitest";
import { createWorld } from "./world.ts";

describe("world", () => {
  const world = createWorld({ height: 10, width: 10 });
  afterEach(() => world.reset());
  it("should create a world", () => {
    expect(world).toBeDefined();
  });
  it("should create a world with correct dimensions", () => {
    expect(world.height).toBe(10);
    expect(world.width).toBe(10);
    expect(world.dimension).toEqual([10, 10]);
    expect(world.center).toEqual([5, 5]);
  });
  it("should only output correct indexes", () => {
    expect(world.getIndex(5, 5)).toBe(55);
    expect(world.getIndex(0, 0)).toBe(0);
    expect(world.getIndex(9, 9)).toBe(99);
  });
  it("calculates outbound indexes", () => {
    expect(world.getIndex(10, 10)).toBe(110);
    expect(world.getIndex(-1, -1)).toBe(-11);
  });
  it("should set the value at a given position", () => {
    world.set(5, 5, 1);
    expect(world.get(5, 5)).toBe(1);
    expect(world._world[55]).toBe(1);
  });
  it("should reset the world", () => {
    world.set(5, 5, 1);
    world.reset();
    expect(world.get(5, 5)).toBe(0);
    expect(world._world[55]).toBe(0);
  });
  it("should return undefined for invalid indexes", () => {
    expect(world.get(10, 10)).toBeUndefined();
    expect(world.get(-1, -1)).toBeUndefined();
  });
  it("should set no value for an invalid index", () => {
    world.set(10, 10, 1);
    expect(world.get(10, 10)).toBeUndefined();
    expect(world._world[110]).toBeUndefined();
  });
  it("should set a value to UInt8", () => {
    world.set(5, 5, 255);
    expect(world.get(5, 5)).toBe(255);
  });
  it("should not set a value higher or lower than UInt8", () => {
    world.set(5, 5, 256);
    expect(world.get(5, 5)).toBe(255);
    world.set(5, 5, -1);
    expect(world.get(5, 5)).toBe(0);
  });
});
