import { V2 } from "./utils/vector2.ts";
import { createRenderer } from "./render/renderer.ts";
import { createStaticStage } from "./render/static-map.ts";
import { TileType } from "./world/definitions/tiles.ts";

async function main() {
  const renderer = await createRenderer();
  const stage = createStaticStage({
    width: 48,
    height: 36,
    origin: new V2(0, 0),
    zoom: 20,
    getTileType: (x, y) =>
      x >= 18 && x < 30 && y >= 8 && y < 28 ? TileType.Dirt : TileType.Grass,
  });
  renderer.start(stage);
}

main().catch(console.error);