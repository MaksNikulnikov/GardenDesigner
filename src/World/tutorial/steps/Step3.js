import { TutorialStep } from "../TutorialStep.js";

export class Step3 extends TutorialStep {
  start() {
    const game = this.manager.game;
    const ui = this.manager.ui;

    ui.showHint("Your corn is growing... just wait a bit!", "corn");

    this._waitForAllCornReady(() => this._onCornReady());
  }

  _waitForAllCornReady(callback) {
    const check = () => {
      if (this.manager.game.entities.areAllCropsReady?.("corn")) callback?.();
      else requestAnimationFrame(check);
    };
    requestAnimationFrame(check);
  }

  _onCornReady() {
    const ui = this.manager.ui;
    const game = this.manager.game;

    ui.showHint("Your corn is ready to harvest! 🌾 Tap it to collect!", "corn");
    game.entities.allowHarvest?.();

    this._waitForHarvest(() => {
      ui.showHint("Great job! You harvested your first corn! 🎉", "corn");
      setTimeout(() => (this.isComplete = true), 2000);
    });
  }

  _waitForHarvest(callback) {
    const check = () => {
      const anyCornLeft = this.manager.game.entities.entities.some((e) => e.type === "corn");
      if (!anyCornLeft) callback?.();
      else requestAnimationFrame(check);
    };
    requestAnimationFrame(check);
  }
}
