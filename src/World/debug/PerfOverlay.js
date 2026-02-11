const PANEL_STYLE = `
position: fixed;
top: 10px;
right: 10px;
z-index: 9999;
padding: 10px 12px;
min-width: 170px;
background: rgba(8, 12, 24, 0.78);
backdrop-filter: blur(6px);
border: 1px solid rgba(140, 178, 255, 0.28);
border-radius: 10px;
color: #e8f0ff;
font: 12px/1.35 Consolas, "SF Mono", Menlo, monospace;
letter-spacing: 0.1px;
pointer-events: none;
user-select: none;
`;

export class PerfOverlay {
  constructor({ renderer, game = null }) {
    this.renderer = renderer;
    this.game = game;

    this._accumulatedTime = 0;
    this._accumulatedFrames = 0;
    this._lastFrameMs = 0;
    this._sampleInterval = 0.4;
    this._fps = 0;

    this._root = document.createElement("div");
    this._root.id = "perf-overlay";
    this._root.setAttribute("style", PANEL_STYLE);
    this._root.innerHTML = [
      "<div>FPS: --</div>",
      "<div>Frame: -- ms</div>",
      "<div>Calls: --</div>",
      "<div>Tris: --</div>",
      "<div>Geom: --</div>",
      "<div>Tex: --</div>",
      "<div>Entities: --</div>",
      "<div>Growing: --</div>",
    ].join("");
    document.body.appendChild(this._root);

    this._rows = Array.from(this._root.querySelectorAll("div"));
  }

  tick(delta) {
    this._accumulatedTime += delta;
    this._accumulatedFrames += 1;
    this._lastFrameMs = delta * 1000;

    if (this._accumulatedTime < this._sampleInterval) return;

    this._fps = Math.round(this._accumulatedFrames / this._accumulatedTime);
    this._accumulatedTime = 0;
    this._accumulatedFrames = 0;

    const renderInfo = this.renderer?.info?.render ?? {};
    const memoryInfo = this.renderer?.info?.memory ?? {};
    const entities = this.game?.entities?.entities ?? [];
    const growing = entities.filter(
      (entity) =>
        entity?.kind === "plant"
          ? !entity.readyToHarvest && !entity.harvested
          : entity?.kind === "animal"
            ? !!entity.producing
            : false
    ).length;

    this._rows[0].textContent = `FPS: ${this._fps}`;
    this._rows[1].textContent = `Frame: ${this._lastFrameMs.toFixed(1)} ms`;
    this._rows[2].textContent = `Calls: ${renderInfo.calls ?? 0}`;
    this._rows[3].textContent = `Tris: ${renderInfo.triangles ?? 0}`;
    this._rows[4].textContent = `Geom: ${memoryInfo.geometries ?? 0}`;
    this._rows[5].textContent = `Tex: ${memoryInfo.textures ?? 0}`;
    this._rows[6].textContent = `Entities: ${entities.length}`;
    this._rows[7].textContent = `Growing: ${growing}`;
  }

  dispose() {
    this._root?.remove();
  }
}

