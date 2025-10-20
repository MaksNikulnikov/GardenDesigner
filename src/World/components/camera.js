import { PerspectiveCamera } from 'three';

function createCamera() {
  const aspect = window.innerWidth / window.innerHeight;
  const camera = new PerspectiveCamera(35, aspect, 0.1, 200);

  updateCameraPosition(camera);
  window.addEventListener('resize', () => updateCameraPosition(camera));

  return camera;
}

function updateCameraPosition(camera) {
  const aspect = window.innerWidth / window.innerHeight;
  const isPortrait = aspect < 1;

  if (isPortrait) {
    camera.position.set(-3, 70, 70);
  } else {
    camera.position.set(-3, 45, 45);
  }

  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();
}

export { createCamera };
