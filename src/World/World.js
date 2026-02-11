import { createCamera } from './components/camera.js';
import { createScene } from './components/scene.js';
import { createControls } from './systems/controls.js';
import { createRenderer } from './systems/renderer.js';
import { Resizer } from './systems/Resizer.js';
import { Loop } from './systems/Loop.js';
import { createGround } from './components/ground/ground.js';
import { GameManager } from './game/GameManager.js';
import { cameraHelper } from './helpers/CameraHelper.js';
import { AssetLoader } from "./assets/AssetLoader.js";
import { PerfOverlay } from "./debug/PerfOverlay.js";

function disposeSceneObject(root) {
  root.traverse?.((node) => {
    if (!node?.isMesh) return;
    node.geometry?.dispose?.();
    if (Array.isArray(node.material)) {
      node.material.forEach((mat) => mat?.dispose?.());
    } else {
      node.material?.dispose?.();
    }
  });
}

class World {
  constructor(container) {
    this.container = container;
    this.camera = createCamera();
    this.renderer = createRenderer();
    this.scene = createScene();
    this.loop = new Loop(this.camera, this.scene, this.renderer);
    this.resizer = new Resizer(container, this.camera, this.renderer);
    cameraHelper.setCamera(this.camera);
    container.append(this.renderer.domElement);
    this.renderer.domElement.style.opacity = "0";
    this.renderer.domElement.style.transition = "opacity 260ms ease";
    this._revealTimer = setTimeout(() => this._revealCanvas(), 2200);

    this.controls = createControls(this.camera, this.renderer.domElement);

    const ground = createGround({
      onLoaded: () => this._revealCanvas(),
    });
    this.scene.add(ground);
    
    this.game = new GameManager(this.scene, this.camera, this.renderer, this.controls);
    this.loop.updatables.push(this.controls, this.game);
    this.perfOverlay = null;

    const debugEnabled =
      import.meta.env.DEV || new URLSearchParams(window.location.search).has("debug");
    if (debugEnabled) {
      this.perfOverlay = new PerfOverlay({ renderer: this.renderer, game: this.game });
      this.loop.updatables.push(this.perfOverlay);
    }

    AssetLoader.preloadGLTF([
      "assets/models/placeholder.glb",
      "assets/models/garden.glb",
      "assets/models/pen.glb",
      "assets/models/corn.glb",
      "assets/models/chicken.glb",
    ]);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  start() {
    this.loop.start();
  }

  stop() {
    this.loop.stop();
  }

  _revealCanvas() {
    if (this._revealTimer) {
      clearTimeout(this._revealTimer);
      this._revealTimer = null;
    }
    requestAnimationFrame(() => {
      if (this.renderer?.domElement) {
        this.renderer.domElement.style.opacity = "1";
      }
    });
  }

  dispose() {
    this.stop();
    if (this._revealTimer) {
      clearTimeout(this._revealTimer);
      this._revealTimer = null;
    }
    this.perfOverlay?.dispose?.();
    this.game?.dispose?.();
    this.resizer?.dispose?.();
    this.controls?.disposeWithListeners?.();
    this.camera?.dispose?.();
    this.renderer?.dispose?.();
    disposeSceneObject(this.scene);
    this.scene?.clear?.();
    cameraHelper.setCamera(null);

    if (this.renderer?.domElement?.parentElement === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}

export { World };
