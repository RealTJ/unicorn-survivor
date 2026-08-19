import { describe, it, expect } from "vitest";
import { createEntity } from "./entity.ts";
import { Vector } from "./vector";

describe("entity", () => {
  it("should create a entity with correct position", () => {
    const entity = createEntity({
      startPosition: new Vector(5, 5),
      bounds: new Vector(10, 10),
    });
    expect(entity).toBeDefined();
    expect(entity.position).toEqual(new Vector(5, 5));
  });

  describe("movement by x,y", () => {
    it("it should move by offset", () => {
      const entity = createEntity({
        startPosition: new Vector(5, 5),
        bounds: new Vector(10, 10),
      });
      entity.moveBy(new Vector(1, 1));
      expect(entity.position).toEqual(new Vector(6, 6));
    });
    it("should not move out of bounds", () => {
      const entity = createEntity({
        startPosition: new Vector(5, 5),
        bounds: new Vector(6, 6),
      });
      entity.moveBy(new Vector(2, 2));
      expect(entity.position).toEqual(new Vector(5, 5));
    });
  });

  describe("movement to x,y", () => {
    it("should move to coordinates", () => {
      const entity = createEntity({
        startPosition: new Vector(5, 5),
        bounds: new Vector(6, 6),
      });
      entity.moveTo(new Vector(6, 6));
      expect(entity.position).toEqual(new Vector(6, 6));
    });
  });
});
