import { TutorialStep } from "../TutorialStep.js";

export class Step3 extends TutorialStep {
  start() {
    const ui = this.manager.ui;

    console.log("🎓 Step3 started — waiting for corn to grow");
    ui.showHint("Your corn is growing... just wait a bit!", "corn");

    this._phase = "waitGrow"; // waitGrow → harvest → done
    this._timer = 0;
    this._harvestMessageShown = false;
  }

  update(delta) {
    const game = this.manager.game;
    const ui = this.manager.ui;
    this._timer += delta;
    if (this._phase === "waitGrow") {
      const ready = game.entities.areAllCropsReady?.("corn");
      if (ready) {
        ui.showHint(
          "Your corn is ready to harvest! Tap it to collect!",
          "corn"
        );
        game.entities.allowHarvest?.();
        this._phase = "harvest";
      }
      return;
    }

    if (this._phase === "harvest") {
      const anyCornLeft = game.entities.entities.some((e) => e.type === "corn");
      if (!anyCornLeft && !this._harvestMessageShown) {
        this._harvestMessageShown = true;
        ui.showHint("Great job! You harvested your first corn! 🎉", "corn");
        this._phase = "done";
        this._timer = 0;
      }
      return;
    }

    if (this._phase === "done") {
      if (this._timer > 2) {
        this.isComplete = true;
      }
    }
  }

  complete() {
    const ui = this.manager.ui;
    ui.hideHint();
  }
}
