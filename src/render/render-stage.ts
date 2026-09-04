import type { TileType } from "../world/definitions/tiles.ts";
import { V2 } from "../utils/vector2.ts";

export type RenderTile = {
  world: V2;
  type: TileType;
};

export type Camera = {
  center: V2;
  zoom: number;
};

export type RenderStage = {
  camera: Camera;
  tiles: RenderTile[];
};