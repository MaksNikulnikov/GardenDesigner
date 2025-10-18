import { TutorialStep } from "../TutorialStep.js";

export class Step1 extends TutorialStep {
  start() {
    const ui = this.manager.ui;
    const game = this.manager.game;

    ui.disableAllButtons?.();
    ui.enableButton("btn-build");
    ui.enableButton("sub-garden");

    ui.highlightButton("btn-build");
    ui.showHint("Let's start by building your first garden 🏡", "build");

    ui.onMenuOpened?.("build", () => this._onBuildMenuOpened());

    this._checkGarden = () => {
      const hasGarden = game.field.fields.some(
        (f) => f.structure?.type === "garden"
      );
      if (hasGarden) this.isComplete = true;
      else requestAnimationFrame(this._checkGarden);
    };
    requestAnimationFrame(this._checkGarden);
  }

  _onBuildMenuOpened() {
    const ui = this.manager.ui;
    ui.removeHighlights();
    ui.highlightButton("sub-garden");
    ui.showHint("Tap to place your garden", "garden");
  }

  complete() {
    const ui = this.manager.ui;
    ui.removeHighlights();
    ui.hideAllSubButtons?.();
    ui.showHint("Nice! You built your first garden! 🌱");
  }
}
