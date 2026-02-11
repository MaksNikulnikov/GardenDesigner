import { Vector3 } from "three";

/**
 * Global helper for converting 3D positions to screen-space.
 * Stores reference to the active game camera.
 */
class CameraHelper {
  constructor() {
    this.camera = null;
    this._projected = new Vector3();
    this._screenPoint = { x: -9999, y: -9999 };
  }

  setCamera(camera) {
    this.camera = camera;
  }

  worldToScreen(worldPos, out = this._screenPoint) {
    if (!this.camera) return { x: -9999, y: -9999 };

    this._projected.copy(worldPos).project(this.camera);
    out.x = (this._projected.x * 0.5 + 0.5) * window.innerWidth;
    out.y = (-this._projected.y * 0.5 + 0.5) * window.innerHeight;
    return out;
  }
}

export const cameraHelper = new CameraHelper();
