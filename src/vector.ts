export class Vector {
  constructor(
    public x: number,
    public y: number,
    ...rest: number[]
  ) {
    if (rest.length > 0) {
      throw new Error("Vector can only have two dimensions");
    }
    if (x <= 0 || y <= 0) {
      throw new Error("Vector must be positive");
    }
  }
  add(other: Vector) {
    return new Vector(this.x + other.x, this.y + other.y);
  }
}
