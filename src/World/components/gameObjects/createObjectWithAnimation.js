import { Group, AnimationMixer } from "three";
import { AssetLoader } from "../../assets/AssetLoader.js";

/**
 * Loads a .glb model with animation (e.g. animal)
 */
export function createObjectWithAnimation({ name, onLoaded }) {
  const group = new Group();
  group.name = name;

  const modelPath = `assets/models/${name}.glb`;

  AssetLoader.loadGLTF(modelPath)
    .then((gltf) => {
      const { scene: model, animations } = AssetLoader.instantiateGLTF(gltf);
      if (!model) return;

      group.add(model);
      group.model = model;

      // Play the first animation if available
      if (animations.length) {
        const mixer = new AnimationMixer(model);
        const action = mixer.clipAction(animations[0]);
        action.play();

        group.mixer = mixer;
        group.tick = (delta) => mixer.update(delta);
      }

      // Trigger callback when model is ready
      onLoaded?.(group, gltf);
    })
    .catch((err) => console.error(`Failed to load ${modelPath}:`, err));

  return group;
}
