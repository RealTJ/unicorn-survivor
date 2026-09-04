import { mix, shader, smoothstep, vec2, vec3, vec4 } from "brometal";
import { fbm2 } from "brometal/shader-functions";

export const DirtTile = shader({
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

  fragment(_uniforms, { vWorld }) {
    // Patches of darker/lighter soil, offset so grass and dirt do not line up
    // at the same cells.
    const pch = fbm2(vWorld.add(vec2(201.1, 460.7)).scale(0.08), 2);

    const soil = vec3(0.42, 0.31, 0.19);
    const darkSoil = vec3(0.3, 0.21, 0.12);
    const lightSoil = vec3(0.55, 0.42, 0.24);

    const darkWeight = smoothstep(0.42, 0.32, pch);
    const lightWeight = smoothstep(0.58, 0.68, pch);

    let color = mix(soil, darkSoil, darkWeight);
    color = mix(color, lightSoil, lightWeight);

    return vec4(color, 1);
  },
});