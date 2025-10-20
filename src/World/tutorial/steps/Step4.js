import { TutorialStep } from "../TutorialStep.js";

export class Step4 extends TutorialStep {
  start() {
    const ui = this.manager.ui;

    ui.disableAllButtons?.();
    ui.enableButton("btn-build");
    ui.enableButton("sub-pen");

    ui.highlightButton("btn-build");
    ui.showHint("Now let's build a pen for your animals!", "build");

    ui.onMenuOpened?.("build", () => this._onBuildMenuOpened());

    this._phase = "waitBuild";
    this._timer = 0;
  }

  _onBuildMenuOpened() {
    const ui = this.manager.ui;
    ui.removeHighlights();
    ui.highlightButton("sub-pen");
    ui.showHint("Tap to place your animal pen", "pen");
  }

  update(delta) {
    const game = this.manager.game;
    const ui = this.manager.ui;

    this._timer += delta;

    if (this._phase === "waitBuild") {
      const hasPen = game.field.fields.some((f) => f.structure?.type === "pen");
      if (hasPen) {
        this._phase = "built";
        this._timer = 0;

        ui.removeHighlights();
        ui.hideAllSubButtons?.();
        ui.disableAllButtons();
        ui.showHint("Perfect! You’ve built your first animal pen!", "pen");
      }
      return;
    }

    if (this._phase === "built" && this._timer > 1.8) {
      this.isComplete = true;
    }
  }

  complete() {
    const ui = this.manager.ui;
    ui.hideHint();
  }
}
