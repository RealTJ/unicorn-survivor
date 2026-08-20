export class Vector2 {
  constructor(
    public x: number,
    public y: number,
    ...rest: number[]
  ) {
    if (__DEV__) {
      if (rest.length > 0) {
        throw new Error("Vector can only have two dimensions");
      }
    }
  }
  add(other: Vector2) {
    return new Vector2(this.x + other.x, this.y + other.y);
  }
  toString() {
    return `(${this.x}, ${this.y})`;
  }
}

export class V2 extends Vector2 {
  constructor(x: number, y: number) {
    super(x, y);
  }
}
