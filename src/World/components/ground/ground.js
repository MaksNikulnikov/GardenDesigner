import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Group } from 'three';

function createGround() {
  const group = new Group();
  const loader = new GLTFLoader();

  loader.load(
    '/assets/models/ground.glb',
    (gltf) => {
      const model = gltf.scene;
      model.position.set(0, 0, 0);
      model.scale.set(1, 1, 1);
      group.add(model);
    },
    undefined,
    (error) => {
      console.error('Error loading ground.glb:', error);
    }
  );

  return group;
}

export { createGround };
