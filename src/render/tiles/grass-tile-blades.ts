// Reference copy of the previous grass tile shader (per-tile hash variation +
// procedural blades in the tile's own UV space).
//
// This is kept around only for visual comparison against the current
// `grass-tile.shader.ts`. It is intentionally NOT named `*.shader.ts`, so it is
// not compiled into the js13k bundle. Blades will be reworked later as part of
// the decoration layer.
import {
  abs,
  floor,
  fract,
  mix,
  shader,
  smoothstep,
  vec2,
  vec3,
  vec4,
} from "brometal";
import { hash21 } from "brometal/shader-functions";

export const GrassTileBlades = shader({
  attributes: { aPosition: "vec3", aUv: "vec2" },
  instanceAttributes: { iWorld: "vec2" },
  uniforms: { uView: "mat4" },
  varyings: { vUv: "vec2", vWorld: "vec2" },

  vertex({ aPosition, aUv, iWorld }, { uView }, v) {
    v.vUv = aUv;
    v.vWorld = iWorld;
    const world = vec4(iWorld.x + aPosition.x, iWorld.y + aPosition.y, 0, 1);
    return uView.mul(world);
  },

  fragment(_uniforms, { vUv, vWorld }) {
    const variation = hash21(vWorld);
    const darkGrass = vec3(0.16, 0.38, 0.1);
    const lightGrass = vec3(0.24, 0.52, 0.15);
    let color = mix(darkGrass, lightGrass, variation);

    const bladeGrid = vUv.mul(vec2(6, 1));
    const bladeUv = vec2(fract(bladeGrid.x), fract(bladeGrid.y));
    const bladeDist = abs(bladeUv.x - 0.5);
    const bladeCell = vec2(floor(bladeGrid.x), floor(bladeGrid.y));
    const bladeRandom = hash21(vWorld.add(bladeCell));
    const bladeMask =
      smoothstep(0.14, 0.02, bladeDist) *
      smoothstep(1.0, 0.2, vUv.y) *
      smoothstep(0.3, 0.7, bladeRandom);
    const bladeColor = vec3(0.3, 0.58, 0.17);
    color = mix(color, bladeColor, bladeMask);
    return vec4(color, 1);
  },
});