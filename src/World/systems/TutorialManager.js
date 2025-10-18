export class TutorialManager {
  constructor(ui, game) {
    this.ui = ui;
    this.game = game;
    this.menuOpened = false; // отслеживает открытие подменю
  }

  start() {
    this._step1();
  }

  _step1() {
    this.ui.enableButton("btn-build");
    this.ui.enableButton("sub-garden");
    this.ui.highlightButton("btn-build");
    this.ui.showHint("Let's start by building your first garden", "garden");
    this.ui.onMenuOpened?.("build", () => this._onBuildMenuOpened());
    this._waitForGarden(() => this._onGardenBuilt());
  }

  _onBuildMenuOpened() {
    this.ui.removeHighlights();
    this.ui.highlightButton("sub-garden");
    this.ui.showHint("Tap to place your garden plot", "garden");
  }

  _onGardenBuilt() {
    this.ui.removeHighlights();
    this.ui.hideAllSubButtons?.();
    this.ui.showHint("Nice! You built your first garden!");
    this._step2();
  }

    _waitForGarden(callback) {
    const check = () => {
      const hasGarden = this.game.field.fields.some(
        (f) => f.structure?.type === "plot" || f.structure?.type === "garden"
      );
      if (hasGarden) callback?.();
      else requestAnimationFrame(check);
    };
    requestAnimationFrame(check);
  }

  _step2() {
    
  }


}
