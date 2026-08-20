export function createEntity({ size }: { size: number }) {
  return { size };
}

export type Entity = ReturnType<typeof createEntity>;
