import { Group, AnimationMixer } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

/**
 * Loads a .glb model with animation (e.g. animal)
 */
export function createObjectWithAnimation({ name, onLoaded }) {
  const loader = new GLTFLoader();
  const group = new Group();
  group.name = name;

  const modelPath = `/assets/models/${name}.glb`;

  loader.load(
    modelPath,
    (gltf) => {
      const model = gltf.scene;
      if (!model) return;

      group.add(model);
      group.model = model;

      // Play the first animation if available
      if (gltf.animations?.length) {
        const mixer = new AnimationMixer(model);
        const action = mixer.clipAction(gltf.animations[0]);
        action.play();

        group.mixer = mixer;
        group.tick = (delta) => mixer.update(delta);
      }

      // Trigger callback when model is ready
      onLoaded?.(group, gltf);
    },
    undefined,
    (err) => console.error(`Failed to load ${modelPath}:`, err)
  );

  return group;
}
