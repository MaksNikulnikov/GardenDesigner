import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

function createControls(camera, canvas) {
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.enablePan = false;

  controls.minPolarAngle = Math.PI / 4;
  controls.maxPolarAngle = Math.PI / 2.3;
  controls.minDistance = 35;
  controls.maxDistance = 100;

  controls.target.set(0, 0, 0);

  updateZoomLimits(controls);
  window.addEventListener('resize', () => updateZoomLimits(controls));

  controls.tick = () => controls.update();
  return controls;
}

function updateZoomLimits(controls) {
  const aspect = window.innerWidth / window.innerHeight;
  const isPortrait = aspect < 1;

  if (isPortrait) {
    controls.minDistance = 22;
    controls.maxDistance = 42;
  } else {
    controls.minDistance = 28;
    controls.maxDistance = 55;
  }
}

export { createControls };
