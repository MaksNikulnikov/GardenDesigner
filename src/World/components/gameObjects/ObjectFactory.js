import { Group } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

/**
 * Universal object factory for loading 3D models (animals, plants, structures).
 * Supports both single-mesh models and multi-stage growth models.
 *
 * @param {Object} options
 * @param {string} options.name - short name, e.g. "corn" or "sheep"
 * @param {string} [options.path] - path to .glb model (default: `/assets/models/{name}.glb`)
 * @param {number} [options.stages] - number of growth stages (optional)
 */
export function createObject({ name, path, stages = 1 }) {
  const loader = new GLTFLoader();
  const group = new Group();
  group.name = name;

  const modelPath = path || `/assets/models/${name}.glb`;

  // --- prepare multi-stage system ---
  if (stages > 1) {
    group.stages = {};
    group.currentStage = 1;

    group.setStage = (index) => {
      if (!group.stages) return;
      const stageKeys = Object.keys(group.stages);
      stageKeys.forEach((key, i) => {
        const mesh = group.stages[key];
        if (mesh) mesh.visible = i === index - 1;
      });
      group.currentStage = index;
    };
  }

  // --- load GLB model ---
  loader.load(
    modelPath,
    (gltf) => {
      const scene = gltf.scene;

      if (stages > 1) {
        // e.g. corn_1, corn_2, corn_3
        for (let i = 1; i <= stages; i++) {
          const node = scene.getObjectByName(`${name}_${i}`);
          if (node) {
            group.add(node);
            group.stages[`stage${i}`] = node;
          }
        }
        group.setStage(1);
      } else {
        group.add(scene);
      }
    },
    undefined,
    (err) => console.error(`Error loading ${modelPath}:`, err)
  );

  return group;
}
