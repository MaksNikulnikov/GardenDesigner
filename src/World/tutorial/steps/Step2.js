import { TutorialStep } from "../TutorialStep.js";

export class Step2 extends TutorialStep {
  constructor(manager) {
    super(manager);
    this.requiredCount = 3;
  }

  start() {
    const ui = this.manager.ui;
    ui.disableButton("btn-build");
    ui.enableButton("btn-plants");
    ui.enableButton("sub-corn");

    ui.highlightButton("btn-plants");
    ui.showHint(
      "Now let's plant some corn!\nTap the Plants button to open the menu.",
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

  update() {
    const planted = this.manager.game.entities.entities.filter(
      (e) => e.type === "corn"
    ).length;

    if (planted < this.requiredCount) {
      const remaining = this.requiredCount - planted;
      this.manager.ui.showHint(
        `Good job! You planted ${planted}/${this.requiredCount} corn.\n${remaining} more to go!`,
        "corn"
      );
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
    ui.showHint("Awesome! 🌽 Now let’s wait for your corn to grow...");
  }
}
