import { TutorialStep } from "../TutorialStep.js";

export class Step3 extends TutorialStep {
  start() {
    const { ui, game } = this.manager;
    ui.hideSpotlight();
    ui.setTimeToggleLocked?.(true);
    game.entities.disallowHarvest?.();
    game.setTimeFlow?.({ scale: 28, forceRunning: false });

    this._phase = "waitGrow";
    this._harvestMessageShown = false;
    this._cameraFocused = false;
    this._timeFocused = false;
  }

  update() {
    const { game, ui } = this.manager;

    switch (this._phase) {
      case "waitGrow": {
        if (!this._timeFocused) {
          this._timeFocused = true;
          game.focusTutorialCamera(game.getTutorialPlantCellFocusPoint());
        }

        const hasAnyReadyCorn = game.entities.entities.some(
          (entity) => entity.type === "corn" && entity.readyToHarvest
        );
        if (hasAnyReadyCorn) {
          game.setTimeFlow?.({ scale: 1, forceRunning: false });
          ui.setTimeToggleLocked?.(false);
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
          this.isComplete = true;
        }
        break;
      }
    }
  }

  complete() {
    this.manager.ui.setTimeToggleLocked?.(false);
    this.manager.game.resetTimeFlow?.();
    this.manager.ui.hideSpotlight();
    this.manager.ui.hideHint?.();
  }
}
