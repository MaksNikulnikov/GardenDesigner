import { Group } from 'three';
import { AssetLoader } from "../../assets/AssetLoader.js";

function createGround({ onLoaded } = {}) {
  const group = new Group();

  AssetLoader.loadGLTF("assets/models/ground.glb")
    .then((gltf) => {
      const { scene } = AssetLoader.instantiateGLTF(gltf);
      group.add(scene);
      onLoaded?.(group);
    })
    .catch((error) => {
      console.error("Error loading ground.glb:", error);
      onLoaded?.(group);
    });

  return group;
}

export { createGround };
