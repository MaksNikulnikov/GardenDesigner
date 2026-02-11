import { Group } from 'three';
import { AssetLoader } from "../../assets/AssetLoader.js";

function createGround() {
  const group = new Group();

  AssetLoader.loadGLTF("assets/models/ground.glb")
    .then((gltf) => {
      const { scene } = AssetLoader.instantiateGLTF(gltf);
      group.add(scene);
    })
    .catch((error) => {
      console.error("Error loading ground.glb:", error);
    });

  return group;
}

export { createGround };
