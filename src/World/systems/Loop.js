import { Clock } from 'three';

class Loop {
  constructor(camera, scene, renderer) {
    this.camera = camera;
    this.scene = scene;
    this.renderer = renderer;
    this.updatables = [];
    this.clock = new Clock();
  }

  start() {
    this.renderer.setAnimationLoop(() => {
      this.tick();
      this.renderer.render(this.scene, this.camera);
    });
  }

  stop() {
    this.renderer.setAnimationLoop(null);
  }

  tick() {
    const delta = this.clock.getDelta();
    for (let i = 0; i < this.updatables.length; i++) {
      const object = this.updatables[i];
      const keep = object?.tick?.(delta);
      if (keep === false) {
        this.updatables.splice(i, 1);
        i -= 1;
      }
    }
  }
}

export { Loop };
