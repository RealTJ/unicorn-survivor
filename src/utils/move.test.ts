// @ts-ignore
import { describe, it, expect } from "vitest";
import { createWorld } from "../world/world";
import { createEntity } from "../entities/entity";
import { Vector2 } from "./vector2";

describe.skip("move", () => {
  const world = createWorld({ width: 10, height: 10 });
  const entity = createEntity({ size: 1 });

  it("should move an entity", () => {});
});
