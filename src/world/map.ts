import { V2 } from "../utils/vector2.ts";
import { TileType } from "./definitions/tiles.ts";
import { DecorationType } from "./definitions/decorations.ts";
import { TileMap } from "./tile-map.ts";
import { DecorationMap } from "./decoration-map.ts";

export const createMapChunk = ({
  size,
  worldCoordinates,
  seed,
}: {
  worldCoordinates: V2;
  size: V2;
  seed: number;
}) => {
  const tiles = new TileMap({ size });
  const decorations = new DecorationMap({ size });

  for (let y = 0; y < size.y; y++) {
    for (let x = 0; x < size.x; x++) {
      tiles.setTile({ coordinates: new V2(x, y), type: TileType.Grass });
      decorations.setDecoration({
        coordinates: new V2(x, y),
        type: DecorationType.None,
      });
    }
  }

  return {
    tiles,
    decorations,
  };
};
export type MapChunk = ReturnType<typeof createMapChunk>;

export function getChunkCoordinates({
  worldCoordinates,
  chunkSize,
}: {
  worldCoordinates: V2;
  chunkSize: V2;
}): V2 {
  return new V2(
    Math.floor(worldCoordinates.x / chunkSize.x),
    Math.floor(worldCoordinates.y / chunkSize.y),
  );
}

export function getChunkKey({
  worldCoordinates,
  chunkSize,
}: {
  worldCoordinates: V2;
  chunkSize: V2;
}): string {
  const chunkCoordinates = getChunkCoordinates({
    worldCoordinates,
    chunkSize,
  });

  return `${chunkCoordinates.x},${chunkCoordinates.y}`;
}

export function getSurroundingChunks({
  worldCoordinates,
  chunkSize,
  radius,
}: {
  worldCoordinates: V2;
  chunkSize: V2;
  radius: number;
}): V2[] {
  const currentChunk = getChunkCoordinates({
    worldCoordinates,
    chunkSize,
  });

  const chunks: V2[] = [];

  for (let y = -radius; y <= radius; y += 1) {
    for (let x = -radius; x <= radius; x += 1) {
      chunks.push(new V2(currentChunk.x + x, currentChunk.y + y));
    }
  }

  return chunks;
}
