import { describe, it, expect } from "vitest";
import {
  createMapChunk,
  getChunkCoordinates,
  getChunkKey,
  getSurroundingChunks,
} from "./map";
import { V2 } from "../utils/vector2";

describe("Map", () => {
  it("should create a map chunk", () => {
    const mapChunk = createMapChunk({
      worldCoordinates: new V2(0, 0),
      size: new V2(8, 8),
      seed: 0,
    });
    expect(mapChunk.tiles.getTiles().length).toBe(64);
    expect(mapChunk.decorations.getDecorations().length).toBe(64);
  });

  it("should return the correct chunk coordinates", () => {
    const chunkCoordinates = getChunkCoordinates({
      worldCoordinates: new V2(0, 0),
      chunkSize: new V2(8, 8),
    });
    expect(chunkCoordinates).toEqual(new V2(0, 0));
  });
  it("should return the correct chunk key", () => {
    const chunkKey = getChunkKey({
      worldCoordinates: new V2(0, 0),
      chunkSize: new V2(8, 8),
    });
    expect(chunkKey).toBe("0,0");
  });
  it("should keep the chunk key the same, as long as the world coordinates are inside the chunk size", () => {
    const chunkSize = new V2(8, 8);
    const chunkKey = getChunkKey({
      worldCoordinates: new V2(0, 0),
      chunkSize,
    });
    expect(chunkKey).toBe("0,0");
    const chunkKeySame = getChunkKey({
      worldCoordinates: new V2(4, 4),
      chunkSize,
    });
    expect(chunkKeySame).toBe(chunkKey);
  });
  it("should get the surrounding chunks from world coordinates", () => {
    const chunkSize = new V2(8, 8);
    const worldCoordinates = new V2(4, 4);
    const surroundingTiles = getSurroundingChunks({
      worldCoordinates,
      chunkSize,
      radius: 1,
    });
    expect(surroundingTiles.length).toBe(9);
  });
});
