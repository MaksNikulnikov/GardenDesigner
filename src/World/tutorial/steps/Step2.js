import { TutorialStep } from "../TutorialStep.js";

export class Step2 extends TutorialStep {
  constructor(manager) {
    super(manager);
    this.requiredCount = 3;
  }

  start() {
    const ui = this.manager.ui;
    this._fieldSpotlightShown = false;
    this._cameraFocused = false;

    ui.disableButton("btn-build");
    ui.enableButton("btn-plants");
    ui.enableButton("sub-corn");

    ui.removeHighlights();
    ui.highlightButton("btn-plants");
    ui.showSpotlight("#btn-plants");

    ui.onMenuOpened?.("plants", () => this._onPlantsMenuOpened());
  }

  _onPlantsMenuOpened() {
    const ui = this.manager.ui;
    ui.removeHighlights();
    ui.highlightButton("sub-corn");
    ui.showSpotlight("#sub-corn");
  }

  update() {
    const game = this.manager.game;
    const ui = this.manager.ui;

    if (game.state.selectedItem === "corn") {
      if (!this._fieldSpotlightShown) {
        this._fieldSpotlightShown = true;
      }
      if (!this._cameraFocused) {
        this._cameraFocused = true;
        game.focusTutorialCamera(game.getTutorialPlantCellFocusPoint());
      }
      ui.showSpotlight(() => game.getTutorialPlantCellRect());
    }

    const planted = game.entities.entities.filter((e) => e.type === "corn").length;

    if (planted >= this.requiredCount) {
      game.clearSelectedItem();
      this.isComplete = true;
    }
  }

  complete() {
    const ui = this.manager.ui;
    ui.removeHighlights();
    ui.hideAllSubButtons?.();
    ui.disableAllButtons();
    ui.onMenuOpened?.("plants", null);
    ui.hideSpotlight();
  }
}
