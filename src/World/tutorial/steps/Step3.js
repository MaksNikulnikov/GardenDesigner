import { TutorialStep } from "../TutorialStep.js";

export class Step3 extends TutorialStep {
  start() {
    const { ui, game } = this.manager;
    ui.hideSpotlight();
    game.entities.disallowHarvest?.();

    this._phase = "waitGrow";
    this._harvestMessageShown = false;
    this._timer = 0;
    this._cameraFocused = false;
  }

  update(delta) {
    const { game, ui } = this.manager;
    this._timer += delta;

    switch (this._phase) {
      case "waitGrow": {
        const hasAnyReadyCorn = game.entities.entities.some(
          (entity) => entity.type === "corn" && entity.readyToHarvest
        );
        if (hasAnyReadyCorn) {
          game.entities.allowHarvest?.();
          ui.showSpotlight(() => game.getTutorialHarvestCellRect("corn"));
          if (!this._cameraFocused) {
            this._cameraFocused = true;
            game.focusTutorialCamera(game.getTutorialHarvestCellFocusPoint("corn"));
          }
          this._phase = "harvest";
        }
        break;
      }

      case "harvest": {
        ui.showSpotlight(() => game.getTutorialHarvestCellRect("corn"));
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
