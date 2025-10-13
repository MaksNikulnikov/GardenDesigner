import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Group } from 'three';

function createCow() {
  const group = new Group();
  const loader = new GLTFLoader();

  loader.load(
    '/assets/models/cow.glb',
    (gltf) => {
      group.add(gltf.scene);
    },
    undefined,
    (error) => {
      console.error('Error loading cow.glb:', error);
    }
  );

  return group;
}

export { createCow };
