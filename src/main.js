import { World } from './World/World.js';

let world = null;
const isE2EMode = new URLSearchParams(window.location.search).has("e2e");

if (isE2EMode) {
  window.__gardenDebug = {
    getWorld: () => world,
    getGame: () => world?.game ?? null,
  };
}

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
    if (isE2EMode) {
      window.__gardenDebug = undefined;
    }
  });
}
