import { PerspectiveCamera } from 'three';

function createCamera() {
  const aspect = window.innerWidth / window.innerHeight;
  const camera = new PerspectiveCamera(35, aspect, 0.1, 200);
  const onResize = () => updateCameraPosition(camera);

  updateCameraPosition(camera);
  window.addEventListener("resize", onResize);
  camera.dispose = () => {
    window.removeEventListener("resize", onResize);
  };

  return camera;
}

function updateCameraPosition(camera) {
  const aspect = window.innerWidth / window.innerHeight;
  const isPortrait = aspect < 1;

  if (isPortrait) {
    camera.position.set(-2, 34, 34);
    camera.fov = 38;
  } else {
    camera.position.set(-3, 45, 45);
    camera.fov = 35;
  }

  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();
}

export { createCamera };
