## Me
How do I generate a correct chunkKey, that if the world coordinates are in the current chunk and the surrounding chunks are loaded?

I would need to do a collision / boundary check, would I not?

## AI Assistant
You do not need a collision or boundary check to generate a `chunkKey`. Convert the world coordinates into **integer chunk coordinates**, then derive the key from those coordinates.

The important detail is using `Math.floor`, especially when world coordinates can be negative.

```typescript
type V2 = {
  x: number;
  y: number;
};

function getChunkCoordinates({
  worldCoordinates,
  chunkSize,
}: {
  worldCoordinates: V2;
  chunkSize: V2;
}): V2 {
  return {
    x: Math.floor(worldCoordinates.x / chunkSize.x),
    y: Math.floor(worldCoordinates.y / chunkSize.y),
  };
}

function getChunkKey({
  worldCoordinates,
  chunkSize,
}: {
  worldCoordinates: V2;
  chunkSize: V2;
}): string {
  const chunkCoordinates = getChunkCoordinates({
    worldCoordinates,
    chunkSize,
  });

  return `${chunkCoordinates.x},${chunkCoordinates.y}`;
}
```


For example, with a chunk size of `16 × 16`:

```typescript
const chunkSize = { x: 16, y: 16 };

getChunkKey({
  worldCoordinates: { x: 20, y: 5 },
  chunkSize,
});
// "1,0"

getChunkKey({
  worldCoordinates: { x: -1, y: -1 },
  chunkSize,
});
// "-1,-1"
```


`Math.floor` is important here. Using `Math.trunc` would incorrectly place `-1` in chunk `0` instead of chunk `-1`.

## Loading surrounding chunks

If the current chunk and its neighbors should be loaded, calculate the current chunk coordinate and iterate over a radius around it.

For a one-chunk radius, you load a `3 × 3` area:

```typescript
function getSurroundingChunkCoordinates({
  worldCoordinates,
  chunkSize,
  radius,
}: {
  worldCoordinates: V2;
  chunkSize: V2;
  radius: number;
}): V2[] {
  const currentChunk = getChunkCoordinates({
    worldCoordinates,
    chunkSize,
  });

  const result: V2[] = [];

  for (let y = -radius; y <= radius; y += 1) {
    for (let x = -radius; x <= radius; x += 1) {
      result.push({
        x: currentChunk.x + x,
        y: currentChunk.y + y,
      });
    }
  }

  return result;
}
```


Then use the chunk coordinates directly to create keys:

```typescript
function getChunkKeyFromCoordinates(chunkCoordinates: V2): string {
  return `${chunkCoordinates.x},${chunkCoordinates.y}`;
}
```


Example:

```typescript
const surroundingChunks = getSurroundingChunkCoordinates({
  worldCoordinates: { x: 20, y: 5 },
  chunkSize: { x: 16, y: 16 },
  radius: 1,
});

for (const chunkCoordinates of surroundingChunks) {
  const chunkKey = getChunkKeyFromCoordinates(chunkCoordinates);

  // Generate or retrieve the chunk using chunkKey.
  console.log(chunkKey);
}
```


The resulting keys would be:

```plain text
0,-1
1,-1
2,-1
0,0
1,0
2,0
0,1
1,1
2,1
```


## Boundary checks

You only need boundary checks if your world has finite limits, such as a world that is exactly `100 × 100` chunks.

For an infinite or procedurally generated world:

- No collision check is required for chunk-key generation.
- Negative chunk coordinates are valid.
- The map can simply use the key to determine whether a chunk is already loaded.
- The surrounding-chunk loop determines which chunks should be loaded.

For a finite world, check the **chunk coordinates**, not the raw world coordinates:

```typescript
function isWithinWorldBounds({
  chunkCoordinates,
  worldChunkSize,
}: {
  chunkCoordinates: V2;
  worldChunkSize: V2;
}): boolean {
  return (
    chunkCoordinates.x >= 0 &&
    chunkCoordinates.x < worldChunkSize.x &&
    chunkCoordinates.y >= 0 &&
    chunkCoordinates.y < worldChunkSize.y
  );
}
```


A typical update algorithm is therefore:

1. Convert the player/world position to the current chunk coordinate.
2. Iterate over the desired loading radius.
3. Reject coordinates outside finite world bounds, if applicable.
4. Build a key from the integer chunk coordinate.
5. Generate the chunk only if the key is not already loaded.
6. Optionally unload chunks outside the loading radius.
