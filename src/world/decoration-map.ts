import { DecorationType } from "./definitions/decorations.ts";
import { V2 } from "../utils/vector2.ts";

export class DecorationMap {
  private readonly _decorations: Uint8Array;
  constructor({ size: { x: width, y: height } }: { size: V2 }) {
    const _size = width * height;
    this._decorations = new Uint8Array(_size);
  }
  getDecorations() {
    return this._decorations;
  }
  getDecoration({ coordinates }: { coordinates: V2 }) {
    const index = this.index(coordinates);
    return this._decorations[index];
  }
  setDecoration({
    coordinates,
    type,
  }: {
    coordinates: V2;
    type: DecorationType;
  }) {
    const index = this.index(coordinates);
    this._decorations[index] = type;
  }
  index({ x, y }: V2) {
    return x + y * this.width;
  }
  get width() {
    return this._decorations.length;
  }
}
