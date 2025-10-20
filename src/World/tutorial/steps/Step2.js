import { TutorialStep } from "../TutorialStep.js";

export class Step2 extends TutorialStep {
  constructor(manager) {
    super(manager);
    this.requiredCount = 3;
    this._lastHintTime = 0;
    this._hintInterval = 4000;
  }

  start() {
    const ui = this.manager.ui;
    ui.disableButton("btn-build");
    ui.enableButton("btn-plants");
    ui.enableButton("sub-corn");

    ui.highlightButton("btn-plants");
    ui.showHint(
      "Now let's plant some corn!",
      "corn"
    );

    ui.onMenuOpened?.("plants", () => this._onPlantsMenuOpened());
  }

  _onPlantsMenuOpened() {
    const ui = this.manager.ui;
    ui.removeHighlights();
    ui.highlightButton("sub-corn");
    ui.showHint("Choose Corn and plant it 3 times!", "corn");
  }

  update(time, delta) {
    const planted = this.manager.game.entities.entities.filter(
      (e) => e.type === "corn"
    ).length;

    if (planted < this.requiredCount) {
      const now = performance.now();
      if (now - this._lastHintTime > this._hintInterval) {
        const remaining = this.requiredCount - planted;
        this.manager.ui.showHint(`Plant ${remaining} more corn`, "corn");
        this._lastHintTime = now;
      }
    } else {
      this.manager.game.clearSelectedItem();
      this.isComplete = true;
    }
  }

  complete() {
    const ui = this.manager.ui;
    ui.removeHighlights();
    ui.hideAllSubButtons?.();
    ui.disableAllButtons();
    ui.showHint("Awesome! Now let’s wait for your corn to grow...");
  }
}
