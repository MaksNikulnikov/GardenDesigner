import { TutorialStep } from "../TutorialStep.js";

export class Step1 extends TutorialStep {
  start() {
    const ui = this.manager.ui;
    this._fieldSpotlightShown = false;
    this._cameraFocused = false;

    ui.disableAllButtons?.();
    ui.enableButton("btn-build");
    ui.enableButton("sub-garden");

    ui.removeHighlights();
    ui.highlightButton("btn-build");
    ui.showSpotlight("#btn-build");

    ui.onMenuOpened?.("build", () => this._onBuildMenuOpened());
  }

  _onBuildMenuOpened() {
    const ui = this.manager.ui;
    ui.removeHighlights();
    ui.highlightButton("sub-garden");
    ui.showSpotlight("#sub-garden");
  }

  update() {
    const game = this.manager.game;
    const ui = this.manager.ui;

    if (!this._fieldSpotlightShown && game.state.buildMode === "garden") {
      this._fieldSpotlightShown = true;
      ui.showSpotlight(() => game.getTutorialBuildRect("garden"));
      if (!this._cameraFocused) {
        this._cameraFocused = true;
        game.focusTutorialCamera(game.getTutorialBuildFocusPoint("garden"));
      }
    }

    const hasGarden = game.field.fields.some((f) => f.structure?.type === "garden");
    if (hasGarden) {
      this.isComplete = true;
    }
  }

  complete() {
    const ui = this.manager.ui;

    ui.removeHighlights();
    ui.hideAllSubButtons?.();
    ui.onMenuOpened?.("build", null);
    ui.hideSpotlight();
  }
}
