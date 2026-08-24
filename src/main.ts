import { createWorld } from "./world/world.ts";
import { V2 } from "./utils/vector2.ts";
import { createRender } from "./render/brometal-example.ts";
async function main() {
  const world = createWorld({ size: new V2(1024, 1024), seed: 0 });
  world.init({ worldCoordinates: new V2(0, 0) });
  const appContainer = document.getElementById("app");
  if (!appContainer) return;
  appContainer.innerHTML = `<p>Created world with size: ${world.size.toString()}</p><p>Created world with chunks: ${world.chunks.size}</p>`;
  await createRender();
}
main().catch(console.error);
