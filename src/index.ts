import { createWorld } from "./world.ts";
const world = createWorld({ height: 10, width: 10 });
console.log("Created world with dimensions", world.dimension);
