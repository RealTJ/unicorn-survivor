declare function bmInit(
  canvas: HTMLCanvasElement,
  clear?: [number, number, number, number],
): Promise<void>;

declare function bmProgram(
  wgsl: string,
  options: {
    a?: number[];
    i?: number[];
    u?: number;
    t?: Array<[number, number]>;
    s?: Array<[number, boolean]>;
    fmt?: number;
    blend?: boolean;
    cull?: boolean;
    zwrite?: number;
  },
): BmProgram;

declare function bmAttr(
  program: BmProgram,
  slot: number,
  data: ArrayBufferView,
): void;

declare function bmIndex(program: BmProgram, data: Uint16Array): void;

declare function bmUniforms(program: BmProgram, values: Float32Array): void;

declare function bmDraw(program: BmProgram, count?: number): void;

declare function bmLoop(callback: (time: number) => void): void;

interface BmProgram {
  p: GPURenderPipeline;
  l: GPUBindGroupLayout;
  ub: GPUBuffer | null;
  t: Array<[number, number]>;
  st: Array<[number, boolean]>;
  b: GPUBuffer[];
  ix: GPUBuffer | null;
  n: number;
  bg: GPUBindGroup | null;
  tx: BmTexture[];
  sb: GPUBuffer[];
}

interface BmTexture {
  v: GPUTextureView;
  s: GPUSampler;
}
