import { RenderStage, RenderTile } from "./render-stage.ts";
import { TileType } from "../world/definitions/tiles.ts";

const quadPositions = new Float32Array([0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0]);
const quadUvs = new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]);
const quadIndices = new Uint16Array([0, 1, 2, 0, 2, 3]);

const byType: Partial<Record<TileType, BmShaderSource>> = {
  [TileType.Grass]: GrassTile,
  [TileType.Dirt]: DirtTile,
};

export async function createRenderer() {
  const canvas = document.querySelector("canvas");
  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error("Canvas not found");
  }

  await bmInit(canvas);

  const programs = new Map<TileType, BmProgram>();
  for (const [type, desc] of Object.entries(byType)) {
    const program = bmProgram(desc[0], {
      a: desc[1],
      i: desc[2],
      u: desc[3],
      t: desc[4],
    });
    bmAttr(program, 0, quadPositions);
    bmAttr(program, 1, quadUvs);
    bmIndex(program, quadIndices);
    programs.set(Number(type) as TileType, program);
  }

  function uploadWorlds(tiles: RenderTile[]) {
    const arr = new Float32Array(tiles.length * 2);
    for (let i = 0; i < tiles.length; i += 1) {
      arr[i * 2] = tiles[i].world.x;
      arr[i * 2 + 1] = tiles[i].world.y;
    }
    return arr;
  }

  return {
    start(stage: RenderStage) {
      bmLoop(() => {
        const aspect = canvas.clientWidth / canvas.clientHeight;
        const sy = 1 / stage.camera.zoom;
        const sx = sy / aspect;
        const view = new Float32Array([
          sx,
          0,
          0,
          0,
          0,
          sy,
          0,
          0,
          0,
          0,
          1,
          0,
          -sx * stage.camera.center.x,
          -sy * stage.camera.center.y,
          0,
          1,
        ]);

        for (const [type, program] of programs) {
          const tiles = stage.tiles.filter((tile) => tile.type === type);
          if (tiles.length === 0) continue;
          bmAttr(program, 2, uploadWorlds(tiles));
          bmUniforms(program, view);
          bmDraw(program, tiles.length);
        }
      });
    },
  };
}