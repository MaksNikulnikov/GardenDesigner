import { TutorialStep } from "../TutorialStep.js";

export class Step5 extends TutorialStep {
  constructor(manager) {
    super(manager);
    this.requiredCount = 5;
  }

  start() {
    const ui = this.manager.ui;
    this._fieldSpotlightShown = false;
    this._cameraFocused = false;

    ui.disableAllButtons?.();
    ui.enableButton("btn-animals");
    ui.enableButton("sub-chicken");

    ui.removeHighlights();
    ui.highlightButton("btn-animals");
    ui.showSpotlight("#btn-animals");

    ui.onMenuOpened?.("animals", () => this._onAnimalsMenuOpened());

    this._phase = "place";
    this._timer = 0;
    this._lastCount = 0;
  }

  _onAnimalsMenuOpened() {
    const ui = this.manager.ui;
    ui.removeHighlights();
    ui.highlightButton("sub-chicken");
    ui.showSpotlight("#sub-chicken");
  }

  update(delta) {
    const game = this.manager.game;
    const ui = this.manager.ui;
    this._timer += delta;

    if (game.state.selectedItem === "chicken") {
      if (!this._fieldSpotlightShown) {
        this._fieldSpotlightShown = true;
      }
      if (!this._cameraFocused) {
        this._cameraFocused = true;
        game.focusTutorialCamera(game.getTutorialAnimalCellFocusPoint());
      }
      ui.showSpotlight(() => game.getTutorialAnimalCellRect());
    }

    if (this._phase === "place") {
      const chickens = game.entities.entities.filter((e) => e.type === "chicken").length;

      if (chickens !== this._lastCount && this._timer > 0.5) {
        this._timer = 0;
        this._lastCount = chickens;

        const remaining = this.requiredCount - chickens;
        if (remaining <= 0) {
          this._onAllChickensPlaced();
        }
      }
    }

    if (this._phase === "done" && this._timer > 2.5) {
      this.isComplete = true;
    }
  }

  _onAllChickensPlaced() {
    const ui = this.manager.ui;
    const game = this.manager.game;

    game.clearSelectedItem?.();

    this._phase = "done";
    this._timer = 0;

    ui.removeHighlights();
    ui.hideAllSubButtons?.();
    ui.disableAllButtons();
    ui.hideSpotlight();
  }

  complete() {
    const ui = this.manager.ui;
    ui.onMenuOpened?.("animals", null);
    ui.hideSpotlight();
    ui.hideHint();
  }
}
