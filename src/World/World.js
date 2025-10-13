import { createCamera } from './components/camera.js';
import { createLights } from './components/lights.js';
import { createScene } from './components/scene.js';

import { createControls } from './systems/controls.js';
import { createRenderer } from './systems/renderer.js';
import { Resizer } from './systems/Resizer.js';
import { Loop } from './systems/Loop.js';
import { createGround } from './components/Ground/Ground.js';
import { createCorn } from './components/gameObjects/corn.js';
import { createTomato } from './components/gameObjects/tomato.js'; 

let camera;
let renderer;
let scene;
let loop;

class World {
  constructor(container) {
    camera = createCamera();
    renderer = createRenderer();
    scene = createScene();
    loop = new Loop(camera, scene, renderer);
    container.append(renderer.domElement);

    const controls = createControls(camera, renderer.domElement);
    const { ambientLight, mainLight } = createLights();
    const ground = createGround();
    const corn = createCorn();
    const tomato = createTomato()

    loop.updatables.push(controls);
    scene.add(ambientLight, mainLight, ground, corn, tomato);

    const resizer = new Resizer(container, camera, renderer);

  }

  render() {
    renderer.render(scene, camera);
  }

  start() {
    loop.start();
  }

  stop() {
    loop.stop();
  }
}

export { World };
