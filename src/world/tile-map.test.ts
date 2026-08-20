import { describe, it, expect } from "vitest";
import { TileMap } from "./tile-map";
import { V2 } from "../utils/vector2";

describe("TileMap", () => {
  it("should create a tile map", () => {
    const tileMap = new TileMap({ size: new V2(8, 8) });
    expect(tileMap.width).toBe(64);
  });
  it("should get tile", () => {
    const tileMap = new TileMap({ size: new V2(8, 8) });
    expect(tileMap.getTile({ coordinates: new V2(0, 0) })).toBe(0);
  });
  it("should set tile", () => {
    const tileMap = new TileMap({ size: new V2(8, 8) });
    tileMap.setTile({ coordinates: new V2(0, 0), type: 1 });
    expect(tileMap.getTile({ coordinates: new V2(0, 0) })).toBe(1);
  });
  it("should return all tiles", () => {
    const tileMap = new TileMap({ size: new V2(8, 8) });
    expect(tileMap.getTiles()).toHaveLength(64);
  });
});
