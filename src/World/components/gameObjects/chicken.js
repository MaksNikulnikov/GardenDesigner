import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Group } from 'three';

function createChicken() {
  const group = new Group();
  const loader = new GLTFLoader();

  loader.load(
    '/assets/models/chicken.glb',
    (gltf) => {
      group.add(gltf.scene);
    },
    undefined,
    (error) => {
      console.error('Error loading chicken.glb:', error);
    }
  );

  return group;
}

export { createChicken };
