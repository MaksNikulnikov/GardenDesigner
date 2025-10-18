import { TutorialStep } from "../TutorialStep.js";

export class Step5 extends TutorialStep {
  constructor(manager) {
    super(manager);
    this.requiredCount = 5;
  }

  start() {
    const ui = this.manager.ui;
    const game = this.manager.game;

    ui.disableAllButtons?.();
    ui.enableButton("btn-animals");
    ui.enableButton("sub-chicken");

    ui.highlightButton("btn-animals");
    ui.showHint(
      "Now let's add some chickens to your new pen! 🐔",
      "animals"
    );

    ui.onMenuOpened?.("animals", () => this._onAnimalsMenuOpened());

    this._trackChickenPlacement(this.requiredCount, () => this._onAllChickensPlaced());
  }

  _onAnimalsMenuOpened() {
    const ui = this.manager.ui;
    ui.removeHighlights();
    ui.highlightButton("sub-chicken");
    ui.showHint("Choose Chicken and place 5 in your pen 🐔🐔🐔🐔🐔", "chicken");
  }

  _trackChickenPlacement(requiredCount, callback) {
    const game = this.manager.game;
    const ui = this.manager.ui;

    const check = () => {
      const chickens = game.entities.entities.filter((e) => e.type === "chicken").length;

      if (chickens < requiredCount) {
        const remaining = requiredCount - chickens;
        ui.showHint(
          `Good job! You placed ${chickens}/${requiredCount} chickens.\n${remaining} more to go!`,
          "chicken"
        );
        requestAnimationFrame(check);
      } else {
        callback?.();
      }
    };

    requestAnimationFrame(check);
  }

  _onAllChickensPlaced() {
    const ui = this.manager.ui;
    this.manager.game.clearSelectedItem()
    ui.removeHighlights();
    ui.hideAllSubButtons?.();
    ui.disableAllButtons();

    ui.showHint("Fantastic! You now have a whole flock! 🐔🐔🐔🐔🐔", "chicken");

    setTimeout(() => {
      ui.showHint("Your farm is growing fast! 🌾✨", "animals");
      this.isComplete = true;
    }, 2500);
  }

  complete() {
    const ui = this.manager.ui;
    ui.hideHint();
  }
}
