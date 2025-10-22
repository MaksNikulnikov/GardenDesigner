import { TutorialStep } from "../TutorialStep.js";

export class Step1 extends TutorialStep {
  start() {
    const ui = this.manager.ui;
    ui.disableAllButtons?.();
    ui.enableButton("btn-build");
    ui.enableButton("sub-garden");

    ui.highlightButton("btn-build");
    ui.showHint("Let's start by building!", "build");

    ui.onMenuOpened?.("build", () => this._onBuildMenuOpened());
  }

  _onBuildMenuOpened() {
    const ui = this.manager.ui;
    ui.removeHighlights();
    ui.highlightButton("sub-garden");
    ui.showHint("Tap to place your garden", "garden");
  }

  update() {
    const game = this.manager.game;

    const hasGarden = game.field.fields.some(
      (f) => f.structure?.type === "garden"
    );

    if (hasGarden) {
      this.isComplete = true;
    }
  }

  complete() {
    const ui = this.manager.ui;

    ui.removeHighlights();
    ui.hideAllSubButtons?.();
    ui.onMenuOpened?.("build", null);
    ui.showHint("Nice! You built your first garden! 🌱");
  }
}
