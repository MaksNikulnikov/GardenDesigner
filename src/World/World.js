import { createCamera } from './components/camera.js';
import { createScene } from './components/scene.js';
import { createControls } from './systems/controls.js';
import { createRenderer } from './systems/renderer.js';
import { Resizer } from './systems/Resizer.js';
import { Loop } from './systems/Loop.js';
import { createGround } from './components/ground/ground.js';
import { GameManager } from './game/GameManager.js';
import { cameraHelper } from './helpers/CameraHelper.js';

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
    new Resizer(container, camera, renderer);
    cameraHelper.setCamera(camera);
    container.append(renderer.domElement);

    const controls = createControls(camera, renderer.domElement);

    const ground = createGround();
    scene.add(ground);
    
    const game = new GameManager(scene, camera, renderer);
    loop.updatables.push(controls, game);




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
