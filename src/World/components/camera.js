import { PerspectiveCamera } from 'three';

function createCamera() {
  const camera = new PerspectiveCamera(35, 1, 0.1, 200);
  camera.position.set(-3, 50, 50);
  return camera;
}

export { createCamera };
