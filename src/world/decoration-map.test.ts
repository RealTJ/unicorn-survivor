import { describe, it, expect } from "vitest";
import { DecorationMap } from "./decoration-map";
import { V2 } from "../utils/vector2";

describe("DecorationMap", () => {
  it("should create a decoration map", () => {
    const decorationMap = new DecorationMap({ size: new V2(8, 8) });
    expect(decorationMap.width).toBe(64);
  });
  it("should get decoration", () => {
    const decorationMap = new DecorationMap({ size: new V2(8, 8) });
    expect(decorationMap.getDecoration({ coordinates: new V2(0, 0) })).toBe(0);
  });
  it("should set decoration", () => {
    const decorationMap = new DecorationMap({ size: new V2(8, 8) });
    decorationMap.setDecoration({ coordinates: new V2(0, 0), type: 1 });
    expect(decorationMap.getDecoration({ coordinates: new V2(0, 0) })).toBe(1);
  });
  it("should return all decorations", () => {
    const decorationMap = new DecorationMap({ size: new V2(8, 8) });
    expect(decorationMap.getDecorations()).toHaveLength(64);
  });
});
