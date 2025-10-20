import { TutorialStep } from "../TutorialStep.js";

export class Step6 extends TutorialStep {
  constructor(manager) {
    super(manager);
    this.requiredEggs = 5;
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

    ui.showHint(
      "Now your chickens are laying eggs!\nCollect 5 eggs to complete your training.",
      "egg",
      { persist: true }
    );

    this._trackEggCollection();
  }

  _trackEggCollection() {
    const ui = this.manager.ui;
    const game = this.manager.game;

    const check = () => {
      const collected = game.state.eggs ?? 0;

      if (collected >= this.requiredEggs) {
        this._onEggGoalReached();
      } else {
        ui.showHint(
          `You collected ${collected}/${this.requiredEggs} eggs\nKeep going!`,
          "egg"
        );
        requestAnimationFrame(check);
      }
    };

    requestAnimationFrame(check);
  }

  _onEggGoalReached() {
    const ui = this.manager.ui;
    const game = this.manager.game;

    ui.showHint(
      "Amazing! You collected enough eggs!\nYou're now a true farmer!",
      "farm",
      { persist: true }
    );

    setTimeout(() => {
      ui.showCTA("Download GardenMakeover");
    }, 2000);

    if (game.stop) game.stop();
    if (game.timeScale !== undefined) game.timeScale = 0;

    this.isComplete = true;
  }

  complete() {
    const ui = this.manager.ui;
    ui.hideHint();
    ui.disableAllButtons();
  }
}
