import { TutorialStep } from "../TutorialStep.js";

export class Step5 extends TutorialStep {
  constructor(manager) {
    super(manager);
    this.requiredCount = 5;
  }

  start() {
    const ui = this.manager.ui;

    ui.disableAllButtons?.();
    ui.enableButton("btn-animals");
    ui.enableButton("sub-chicken");

    ui.highlightButton("btn-animals");
    ui.showHint(
      "Now let's add some chickens to your new pen! 🐔",
      "animals"
    );

    ui.onMenuOpened?.("animals", () => this._onAnimalsMenuOpened());

    this._phase = "place";
    this._timer = 0;
    this._lastCount = 0;
  }

  _onAnimalsMenuOpened() {
    const ui = this.manager.ui;
    ui.removeHighlights();
    ui.highlightButton("sub-chicken");
    ui.showHint("Choose Chicken and place 5 in your pen", "chicken");
  }

  update(delta) {
    const game = this.manager.game;
    const ui = this.manager.ui;
    this._timer += delta;

    if (this._phase === "place") {
      const chickens = game.entities.entities.filter((e) => e.type === "chicken").length;

      if (chickens !== this._lastCount && this._timer > 0.5) {
        this._timer = 0;
        this._lastCount = chickens;

        const remaining = this.requiredCount - chickens;
        if (remaining > 0) {
          ui.showHint(
            `Good job! You placed ${chickens}/${this.requiredCount} chickens.\n${remaining} more to go!`,
            "chicken"
          );
        } else {
          this._onAllChickensPlaced();
        }
      }
    }

    if (this._phase === "done" && this._timer > 2.5) {
      this.isComplete = true;
    }
  }

  _onAllChickensPlaced() {
    const ui = this.manager.ui;
    const game = this.manager.game;

    game.clearSelectedItem?.();

    this._phase = "done";
    this._timer = 0;

    ui.removeHighlights();
    ui.hideAllSubButtons?.();
    ui.disableAllButtons();

    ui.showHint("Fantastic! You now have a whole flock!", "chicken");

    setTimeout(() => {
      ui.showHint("Your farm is growing fast!", "animals");
    }, 1500);
  }

  complete() {
    const ui = this.manager.ui;
    ui.hideHint();
  }
}
