import { Vector2 } from "./vector2.ts";
import { Entity } from "../entities/entity.ts";
import { World } from "../world/world.ts";

export function moveBy({
  world,
  entity,
  offset,
}: {
  world: World;
  entity: Entity;
  offset: Vector2;
}) {}

export function moveTo({
  position,
  entity,
  world,
}: {
  position: Vector2;
  entity: Entity;
  world: World;
}) {}

export function isInvalidMove({
  position,
  world,
}: {
  position: Vector2;
  world: World;
}) {}
