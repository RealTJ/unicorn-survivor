import { TileType } from "./definitions/tiles.ts";
import { V2 } from "../utils/vector2.ts";

export class TileMap {
  private readonly _tiles: Uint8Array;
  constructor({ size: { x: width, y: height } }: { size: V2 }) {
    const _size = width * height;
    this._tiles = new Uint8Array(_size);
  }
  getTiles() {
    return this._tiles;
  }
  getTile({ coordinates }: { coordinates: V2 }) {
    const index = this.index(coordinates);
    return this._tiles[index];
  }
  setTile({ coordinates, type }: { coordinates: V2; type: TileType }) {
    const index = this.index(coordinates);
    this._tiles[index] = type;
  }
  index({ x, y }: V2) {
    return x + y * this.width;
  }
  get width() {
    return this._tiles.length;
  }
}
