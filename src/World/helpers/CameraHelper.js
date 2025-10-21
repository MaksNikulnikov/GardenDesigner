/**
 * Global helper for converting 3D positions to screen-space.
 * Stores reference to the active game camera.
 */
class CameraHelper {
  constructor() {
    this.camera = null;
  }

  setCamera(camera) {
    this.camera = camera;
  }

  worldToScreen(worldPos) {
    if (!this.camera) return { x: -9999, y: -9999 };

    const v = worldPos.clone().project(this.camera);
    return {
      x: (v.x * 0.5 + 0.5) * window.innerWidth,
      y: (-v.y * 0.5 + 0.5) * window.innerHeight,
    };
  }
}

export const cameraHelper = new CameraHelper();
