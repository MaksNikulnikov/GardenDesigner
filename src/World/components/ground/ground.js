import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Group } from 'three';

function createGround() {
  const group = new Group();
  const loader = new GLTFLoader();

  loader.load(
    'assets/models/ground.glb',
    (gltf) => {
      group.add(gltf.scene);
    },
    undefined,
    (error) => {
      console.error('Error loading ground.glb:', error);
    }
  );

  return group;
}

export { createGround };
