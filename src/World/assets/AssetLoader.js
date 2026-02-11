import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js";

const gltfLoader = new GLTFLoader();
const gltfCache = new Map();
const textureLoader = new THREE.TextureLoader();
const textureCache = new Map();

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

function preloadGLTF(paths = []) {
  for (const path of paths) {
    loadGLTF(path).catch((err) => {
      console.error(`[AssetLoader] Failed to preload ${path}`, err);
    });
  }
}

function loadTexture(path, { colorSpace } = {}) {
  if (!textureCache.has(path)) {
    const texture = textureLoader.load(path);
    if (colorSpace !== undefined && texture.colorSpace !== undefined) {
      texture.colorSpace = colorSpace;
    }
    textureCache.set(path, texture);
  }
  return textureCache.get(path);
}

export const AssetLoader = {
  loadGLTF,
  instantiateGLTF,
  loadTexture,
  preloadGLTF,
};
