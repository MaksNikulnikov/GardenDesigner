import { TutorialStep } from "../TutorialStep.js";

export class Step4 extends TutorialStep {
  start() {
    const ui = this.manager.ui;
    this._fieldSpotlightShown = false;
    this._cameraFocused = false;

    ui.disableAllButtons?.();
    ui.enableButton("btn-build");
    ui.enableButton("sub-pen");

    ui.removeHighlights();
    ui.highlightButton("btn-build");
    ui.showSpotlight("#btn-build");

    ui.onMenuOpened?.("build", () => this._onBuildMenuOpened());

    this._phase = "waitBuild";
    this._timer = 0;
  }

  _onBuildMenuOpened() {
    const ui = this.manager.ui;
    ui.removeHighlights();
    ui.highlightButton("sub-pen");
    ui.showSpotlight("#sub-pen");
  }

  update(delta) {
    const game = this.manager.game;
    const ui = this.manager.ui;

    this._timer += delta;

    if (!this._fieldSpotlightShown && game.state.buildMode === "pen") {
      this._fieldSpotlightShown = true;
      ui.showSpotlight(() => game.getTutorialBuildRect("pen"));
      if (!this._cameraFocused) {
        this._cameraFocused = true;
        game.focusTutorialCamera(game.getTutorialBuildFocusPoint("pen"));
      }
    }

    if (this._phase === "waitBuild") {
      const hasPen = game.field.fields.some((f) => f.structure?.type === "pen");
      if (hasPen) {
        this._phase = "built";
        this._timer = 0;

        ui.removeHighlights();
        ui.hideAllSubButtons?.();
        ui.disableAllButtons();
        ui.hideSpotlight();
      }
      return;
    }

    if (this._phase === "built" && this._timer > 1.8) {
      this.isComplete = true;
    }
  }

  complete() {
    const ui = this.manager.ui;
    ui.onMenuOpened?.("build", null);
    ui.hideSpotlight();
    ui.hideHint();
  }
}
