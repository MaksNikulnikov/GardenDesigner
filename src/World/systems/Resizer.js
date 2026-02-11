const setSize = (container, camera, renderer) => {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
};

class Resizer {
  constructor(container, camera, renderer) {
    this._container = container;
    this._camera = camera;
    this._renderer = renderer;
    this._onWindowResize = () => {
      setSize(this._container, this._camera, this._renderer);
      this.onResize();
    };

    setSize(container, camera, renderer);
    window.addEventListener("resize", this._onWindowResize);
  }

  onResize() {}

  dispose() {
    window.removeEventListener("resize", this._onWindowResize);
  }
}

export { Resizer };
