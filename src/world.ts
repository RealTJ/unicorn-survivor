export function createWorld({
  height,
  width,
}: {
  height: number;
  width: number;
}) {
  const _world = new Uint8ClampedArray(height * width);
  const getIndex = (x: number, y: number) => x + y * width;
  const get = (x: number, y: number) => _world[getIndex(x, y)];
  const set = (x: number, y: number, value: number) =>
    (_world[getIndex(x, y)] = value);
  const reset = () => _world.fill(0);
  return {
    _world,
    height,
    width,
    dimension: [height, width],
    get,
    set,
    getIndex,
    reset,
  };
}
