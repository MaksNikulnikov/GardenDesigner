import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js";

const gltfLoader = new GLTFLoader();
const gltfCache = new Map();

function loadGLTF(path) {
  if (!gltfCache.has(path)) {
    const promise = new Promise((resolve, reject) => {
      gltfLoader.load(path, resolve, undefined, reject);
    });
    gltfCache.set(path, promise);
  }
  return gltfCache.get(path);
}

function instantiateGLTF(gltf) {
  const scene = cloneSkeleton(gltf.scene);
  return { scene, animations: gltf.animations ?? [] };
}

export const AssetLoader = {
  loadGLTF,
  instantiateGLTF,
};

