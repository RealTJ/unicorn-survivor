export async function createRender() {
  const canvas = document.querySelector("canvas");

  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error("Canvas not found");
  }

  await bmInit(canvas);
  const program = bmProgram(Fire[0], {
    a: Fire[1],
    i: Fire[2],
    u: Fire[3],
    t: Fire[4],
    s: Fire[5],
  });

  const positions = new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]);

  const uvs = new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]);

  const indices = new Uint16Array([0, 1, 2, 0, 2, 3]);

  bmAttr(program, 0, positions);
  bmAttr(program, 1, uvs);
  bmIndex(program, indices);

  bmLoop((time) => {
    bmUniforms(program, new Float32Array([time, canvas.width / canvas.height]));

    bmDraw(program);
  });
}
