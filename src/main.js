import { World } from './World/World.js';

let world = null;

function main() {
  const container = document.querySelector('#scene-container');
  world?.dispose?.();
  world = new World(container);
  world.start();
}

main();

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    world?.dispose?.();
    world = null;
  });
}
