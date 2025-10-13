import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Group } from 'three';

function createPlaceholder() {
  const group = new Group();
  const loader = new GLTFLoader();

  loader.load(
    '/assets/models/placeholder.glb',
    (gltf) => {
      group.add(gltf.scene);
    },
    undefined,
    (error) => {
      console.error('Error loading placeholder.glb:', error);
    }
  );

  return group;
}

export { createPlaceholder };
