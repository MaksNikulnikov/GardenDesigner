export class TutorialManager {
  constructor(ui, game) {
    this.ui = ui;
    this.game = game;
    this.currentStage = 0;
  }

  start() {
    this._step1();
  }

  // 🌿 STEP 1 — BUILD GARDEN
  _step1() {
    this.currentStage = 1;
    this.ui.enableButton("btn-build");
    this.ui.enableButton("sub-garden");
    this.ui.highlightButton("btn-build");
    this.ui.showHint("Let's start by building your first garden", "build");
    this.ui.onMenuOpened?.("build", () => this._onBuildMenuOpened());
    this._waitForGarden(() => this._onGardenBuilt());
  }

  _onBuildMenuOpened() {
    if (this.currentStage !== 1) return;
    this.ui.removeHighlights();
    this.ui.highlightButton("sub-garden");
    this.ui.showHint("Tap to place your garden", "garden");
  }

  _onGardenBuilt() {
    this.ui.removeHighlights();
    this.ui.hideAllSubButtons?.();
    this.ui.showHint("Nice! You built your first garden!");
    setTimeout(() => this._step2(), 1500);
  }

  _waitForGarden(callback) {
    const check = () => {
      const hasGarden = this.game.field.fields.some(
        (f) => f.structure?.type === "garden"
      );
      if (hasGarden) callback?.();
      else requestAnimationFrame(check);
    };
    requestAnimationFrame(check);
  }

  _step2() {
    this.currentStage = 2;
    this.targetCornCount = 3;

    this.ui.disableButton("btn-build");
    this.ui.enableButton("btn-plants");
    this.ui.enableButton("sub-corn");

    this.ui.highlightButton("btn-plants");
    this.ui.showHint(
      "Now let's plant some corn!\nTap the Plants button to open the menu.",
      "corn"
    );

    this.ui.onMenuOpened?.("plants", () => this._onPlantsMenuOpened());
    this._trackPlantedCornProgress(this.targetCornCount, () =>
      this._onCornPlanted()
    );
  }

  _onPlantsMenuOpened() {
    this.ui.removeHighlights();
    this.ui.highlightButton("sub-corn");
    this.ui.showHint(
      "Choose Corn and tap on your garden to plant it 3 times!",
      "corn"
    );
  }

  _onCornPlanted() {
    this.game.clearSelectedItem();
    this.ui.removeHighlights();
    this.ui.hideAllSubButtons?.();
    this.ui.disableButton("sub-corn");

    this.ui.showHint(
      "Awesome! You've planted your corn!\nNow let’s wait for it to grow...",
      "corn"
    );

    this._waitForAllCornReady(() => this._onCornReady());
  }

  _onCornReady() {
    this.ui.showHint(
      "Your corn is ready to harvest! Tap it to collect!",
      "corn"
    );

    this.game.entities.alowHarvest?.();

    this._waitForHarvest(() => this._onCornHarvested());
  }

  _onCornHarvested() {
    this.ui.showHint("Great job! You harvested your first corn!", "corn");

    setTimeout(() => {
      this._step3?.();
    }, 2000);
  }

  _trackPlantedCornProgress(requiredCount, onComplete) {
    const check = () => {
      const planted = this.game.entities.entities.filter(
        (e) => e.type === "corn"
      ).length;
      const remaining = requiredCount - planted;

      if (planted < requiredCount) {
        this.ui.showHint(
          `Good job! You planted ${planted}/${requiredCount} corn.\n${remaining} more to go!`,
          "corn"
        );
        requestAnimationFrame(check);
      } else {
        onComplete?.();
      }
    };

    requestAnimationFrame(check);
  }

  _waitForAllCornReady(callback) {
    const check = () => {
      if (this.game.entities.areAllCropsReady?.("corn")) callback?.();
      else requestAnimationFrame(check);
    };
    requestAnimationFrame(check);
  }

  _waitForHarvest(callback) {
    const check = () => {
      const anyCornLeft = this.game.entities.entities.some(
        (e) => e.type === "corn"
      );
      if (!anyCornLeft) callback?.();
      else requestAnimationFrame(check);
    };
    requestAnimationFrame(check);
  }

  _step3() {
    this.currentStage = 3;
  }
}
