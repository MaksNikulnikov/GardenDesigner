import { TutorialStep } from "../TutorialStep.js";

export class Step4 extends TutorialStep {
  start() {
    const ui = this.manager.ui;
    ui.disableAllButtons?.();
    ui.enableButton("btn-build");
    ui.enableButton("sub-pen");
    ui.highlightButton("btn-build");
    ui.showHint("Now let's build a pen for your animals! 🏗️", "build");
    ui.onMenuOpened?.("build", () => this._onBuildMenuOpened());
    this._waitForPen(() => this._onPenBuilt());
  }

  _onBuildMenuOpened() {
    const ui = this.manager.ui;
    ui.removeHighlights();
    ui.highlightButton("sub-pen");
    ui.showHint("Tap to place your animal pen 🐔", "pen");
  }

  _waitForPen(callback) {
    const game = this.manager.game;
    const check = () => {
      const hasPen = game.field.fields.some(
        (f) => f.structure?.type === "pen"
      );
      if (hasPen) callback?.();
      else requestAnimationFrame(check);
    };
    requestAnimationFrame(check);
  }

  _onPenBuilt() {
    const ui = this.manager.ui;
    ui.removeHighlights();
    ui.hideAllSubButtons?.();
    ui.disableAllButtons();
    ui.showHint("Perfect! You’ve built your first animal pen! 🐑", "pen");

    setTimeout(() => {
      this.isComplete = true;
    }, 1800);
  }

  complete() {
    const ui = this.manager.ui;
    ui.hideHint();
  }
}
