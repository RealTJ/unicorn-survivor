import { V2 } from "../utils/vector2.ts";
import { TileType } from "../world/definitions/tiles.ts";
import { RenderStage, RenderTile } from "./render-stage.ts";

export function createStaticStage({
  width,
  height,
  origin = new V2(0, 0),
  zoom = 20,
  getTileType = () => TileType.Grass,
}: {
  width: number;
  height: number;
  origin?: V2;
  zoom?: number;
  getTileType?: (x: number, y: number) => TileType;
}): RenderStage {
  const center = new V2(origin.x + width / 2, origin.y + height / 2);
  const tiles: RenderTile[] = new Array(width * height);
  let i = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      tiles[i] = {
        world: new V2(origin.x + x, origin.y + y),
        type: getTileType(x, y),
      };
      i += 1;
    }
  }
  return { camera: { center, zoom }, tiles };
}