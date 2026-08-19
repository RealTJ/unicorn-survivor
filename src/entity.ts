import { Vector } from "./vector.ts";

export function createEntity({
  startPosition: position,
  bounds,
}: {
  startPosition: Vector;
  bounds: Vector;
}) {
  if (
    position.x < 0 ||
    position.x > bounds.x ||
    position.y < 0 ||
    position.y > bounds.y
  ) {
    throw new Error("Start position is out of bounds");
  }
  return {
    position,
    bounds,
    isOutOfBounds(newPosition: Vector) {
      return (
        newPosition.x < 0 ||
        newPosition.x > bounds.x ||
        newPosition.y < 0 ||
        newPosition.y > bounds.y
      );
    },
    moveTo(newPosition: Vector) {
      if (this.isOutOfBounds(newPosition)) {
        return;
      }
      this.position = newPosition;
    },
    moveBy(offset: Vector) {
      const newPosition = this.position.add(offset);
      if (this.isOutOfBounds(newPosition)) {
        return;
      }
      this.position = newPosition;
    },
  };
}

export type Entity = ReturnType<typeof createEntity>;
