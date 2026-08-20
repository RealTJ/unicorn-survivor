export const enum TileType {
  Empty = 0,
  Grass = 1,
  Dirt = 2,
  Water = 3,
  Stone = 4,
  Wall = 5,
}

const enum TileFlags {
  None = 0,
  BlocksMovement = 1 << 0,
  AllowsDecoration = 1 << 1,
  DamagesEntities = 1 << 2,
}

export type TileDefinition = {
  name: string;
  flag: TileFlags;
};

const tileDefinitions: Record<TileType, TileDefinition> = {
  [TileType.Empty]: {
    name: "empty",
    flag: TileFlags.BlocksMovement,
  },
  [TileType.Grass]: {
    name: "grass",
    flag: TileFlags.AllowsDecoration,
  },
  [TileType.Dirt]: {
    name: "dirt",
    flag: TileFlags.AllowsDecoration,
  },
  [TileType.Water]: {
    name: "water",
    flag: TileFlags.BlocksMovement,
  },
  [TileType.Stone]: {
    name: "stone",
    flag: TileFlags.BlocksMovement,
  },
  [TileType.Wall]: {
    name: "wall",
    flag: TileFlags.BlocksMovement,
  },
};
