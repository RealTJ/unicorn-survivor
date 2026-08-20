import { V2 } from "../utils/vector2.ts";
import {
  createMapChunk,
  getChunkKey as getChunkKeyBase,
  getSurroundingChunks,
  MapChunk,
} from "./map.ts";
export const CHUNK_SIZE = new V2(128, 128);
const getChunkKey = (worldCoordinates: V2) =>
  getChunkKeyBase({ chunkSize: CHUNK_SIZE, worldCoordinates });

export function createWorld({ size, seed }: { size: V2; seed: number }) {
  const chunks = new Map<string, MapChunk>();
  function init({ worldCoordinates }: { worldCoordinates: V2 }) {
    update({ worldCoordinates });
  }
  function update({ worldCoordinates }: { worldCoordinates: V2 }) {
    const surroundingChunks = getSurroundingChunks({
      worldCoordinates,
      chunkSize: CHUNK_SIZE,
      radius: 1,
    });
    const surroundingChunkKeys = surroundingChunks.map(getChunkKey);
    const missingChunks = surroundingChunkKeys.filter(
      (key) => !chunks.has(key),
    );
    const needsUpdate = missingChunks.length > 0;
    if (needsUpdate) {
      for (const chunkKey of missingChunks) {
        chunks.set(
          chunkKey,
          createMapChunk({ size: CHUNK_SIZE, worldCoordinates, seed }),
        );
      }
    }
  }
  return { init, update, chunks, size };
}
export type World = ReturnType<typeof createWorld>;
