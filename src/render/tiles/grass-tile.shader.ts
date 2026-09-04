import { mix, shader, smoothstep, vec2, vec3, vec4 } from "brometal";
import { fbm2 } from "brometal/shader-functions";

export const GrassTile = shader({
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
    // Smooth patches: low-frequency noise on the world coordinate so
    // neighbouring tiles blend into patches of darker/lighter grass instead of
    // flickering dark/light at random.
    const pch = fbm2(vWorld.add(vec2(1327.7, 984.3)).scale(0.08), 2);

    const normalGrass = vec3(0.18, 0.44, 0.13);
    const darkGrass = vec3(0.12, 0.3, 0.09);
    const lightGrass = vec3(0.27, 0.58, 0.17);

    const darkWeight = smoothstep(0.42, 0.32, pch);
    const lightWeight = smoothstep(0.58, 0.68, pch);

    let color = mix(normalGrass, darkGrass, darkWeight);
    color = mix(color, lightGrass, lightWeight);

    return vec4(color, 1);
  },
});
