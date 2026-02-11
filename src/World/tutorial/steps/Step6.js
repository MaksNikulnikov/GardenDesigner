import { TutorialStep } from "../TutorialStep.js";

const FAILSAFE_TIMEOUT = 30; // seconds

export class Step6 extends TutorialStep {
  constructor(manager) {
    super(manager);
    this.requiredEggs = 5;
    this._timer = 0;
    this._checkInterval = null;
  }

  start() {
    const ui = this.manager.ui;
    const game = this.manager.game;

    ui.disableAllButtons?.();
    ui.hideAllSubButtons?.();
    ui.removeHighlights();

    ui.enableButton("btn-build");
    ui.enableButton("btn-plants");
    ui.enableButton("btn-animals");
    ui.enableButton("sub-garden");
    ui.enableButton("sub-pen");
    ui.enableButton("sub-corn");
    ui.enableButton("sub-strawberry");
    ui.enableButton("sub-chicken");

    ui.showSpotlight(() => game.renderer?.domElement);

    // check egg count every second
    this._checkInterval = setInterval(() => {
      const eggs = game.state.eggs;
      if (eggs >= this.requiredEggs) {
        this._completeSuccess();
      }
    }, 1000);
  }

  update(delta) {
    this._timer += delta;

    // If 30 seconds passed and player did not collect enough eggs
    if (this._timer > FAILSAFE_TIMEOUT && !this.isComplete) {
      this._completeTimeout();
    }
  }

  _completeSuccess() {
    if (this.isComplete) return;
    this.isComplete = true;
    clearInterval(this._checkInterval);

    const ui = this.manager.ui;
    ui.hideSpotlight();
    ui.showCTA("Download GardenMakeover!\n Continue building your amazing farm!");
  }

  _completeTimeout() {
    if (this.isComplete) return;
    this.isComplete = true;
    clearInterval(this._checkInterval);

    const ui = this.manager.ui;
    ui.hideSpotlight();
    ui.showCTA("Download GardenMakeover!\n Continue building your amazing farm!");
  }

  complete() {
    clearInterval(this._checkInterval);
    this.manager.ui.hideSpotlight();
    this.manager.ui.hideHint();
  }
}
