import { TutorialStep } from "../TutorialStep.js";

export class Step3 extends TutorialStep {
  start() {
    const ui = this.manager.ui;
    ui.hideSpotlight();

    this._phase = "waitGrow";
    this._harvestMessageShown = false;
    this._timer = 0;
  }

  update(delta) {
    const { game, ui } = this.manager;
    this._timer += delta;

    switch (this._phase) {
      case "waitGrow": {
        const ready = game.entities.areAllCropsReady?.("corn");
        if (ready) {
          game.entities.allowHarvest?.();
          ui.showSpotlight(() => game.renderer?.domElement);
          this._phase = "harvest";
        }
        break;
      }

      case "harvest": {
        const anyCornLeft = game.entities.entities.some((e) => e.type === "corn");
        if (!anyCornLeft && !this._harvestMessageShown) {
          this._harvestMessageShown = true;
          this._phase = "done";
          this._timer = 0;
        }
        break;
      }

      case "done": {
        if (this._timer > 2) {
          this.isComplete = true;
        }
        break;
      }
    }
  }

  complete() {
    this.manager.ui.hideSpotlight();
    this.manager.ui.hideHint?.();
  }
}
