import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Group } from 'three';

function createSheep() {
  const group = new Group();
  const loader = new GLTFLoader();

  loader.load(
    '/assets/models/sheep.glb',
    (gltf) => {
      group.add(gltf.scene);
    },
    undefined,
    (error) => {
      console.error('Error loading sheep.glb:', error);
    }
  );

  return group;
}

export { createSheep };
