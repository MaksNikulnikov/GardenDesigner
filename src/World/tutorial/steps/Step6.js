import { TutorialStep } from "../TutorialStep.js";

export class Step6 extends TutorialStep {
  constructor(manager) {
    super(manager);
  }

  start() {
    const ui = this.manager.ui;

    ui.disableAllButtons?.();
    ui.hideAllSubButtons?.();
    ui.removeHighlights();

    ui.enableButton("btn-build");
    ui.enableButton("btn-plants");
    ui.enableButton("btn-animals");

    ui.enableButton("sub-garden");
    ui.enableButton("sub-pen");
    ui.enableButton("sub-corn");
    ui.enableButton("sub-strawberry");
    ui.enableButton("sub-chicken");

    ui.showHint(
      "You’ve mastered the basics of farming! 🌾\nNow you’re ready to run your own farm.\nGrow crops and raise animals to earn money at the fair!",
      "farm"
    );
    this._startFreePlayCountdown();
  }

  _startFreePlayCountdown() {
    const ui = this.manager.ui;
    const game = this.manager.game;

    let timeLeft = 10;
    const tick = () => {
      timeLeft -= 1;
      if (timeLeft <= 0) {
        this._onFreePlayEnd();
      } else {
        ui.showHint(
          `Enjoy your free play mode! 🕒\n${timeLeft} seconds remaining...`,
          "farm"
        );
        setTimeout(tick, 1000);
      }
    };

    setTimeout(tick, 1000);
  }

  _onFreePlayEnd() {
    const ui = this.manager.ui;
    const game = this.manager.game;

    if (game.stop) game.stop();
    if (game.timeScale !== undefined) game.timeScale = 0;

    ui.removeHighlights();
    ui.hideAllSubButtons?.();

    ui.showHint(
      "Great work, farmer! 🌻\nDownload the full version to continue your journey!",
      "farm"
    );

    setTimeout(() => {
      ui.showCTA("Download GardenMakeover");
    }, 200);

    this.isComplete = true;
  }

  complete() {
    const ui = this.manager.ui;
    ui.disableAllButtons();
    ui.hideHint();
  }
}
