import { TutorialStep } from "../TutorialStep.js";

export class Step6 extends TutorialStep {
  constructor(manager) {
    super(manager);
    this.requiredEggs = 5;
    this._checkInterval = null;
  }

  start() {
    const ui = this.manager.ui;

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

    ui.showHint("Now your chickens are laying eggs!", "eggs", { persist: true });

    this._startEggTracking();
  }

  _startEggTracking() {
    const ui = this.manager.ui;
    const game = this.manager.game;

    this._checkInterval = setInterval(() => {
      const collected = game.state.eggs ?? 0;

      if (collected >= this.requiredEggs) {
        clearInterval(this._checkInterval);
        this._onEggGoalReached();
      } else {
        ui.showHint(
          `You collected ${collected}/${this.requiredEggs} eggs\nKeep going!`,
          "eggs"
        );
      }
    }, 5000);
  }

  _onEggGoalReached() {
    const ui = this.manager.ui;
    const game = this.manager.game;

    ui.showHint("Amazing! You're now a true farmer!", "animals");

    setTimeout(() => {
      ui.showCTA("Download GardenMakeover!\n Continue building your amazing farm!");
      game.stop?.();
      if (game.timeScale !== undefined) game.timeScale = 0;
      this.isComplete = true;
    }, 2000);
  }

  complete() {
    clearInterval(this._checkInterval);
    this.manager.ui.hideHint?.();
    this.manager.ui.disableAllButtons?.();
  }
}
