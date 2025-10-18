export class TutorialManager {
  constructor(ui, game) {
    this.ui = ui;
    this.game = game;
  }

  start() {
    this._step1();
  }

  _step1() {
    this.ui.enableButton("btn-build");
    this.ui.highlightButton("btn-build");
    this.ui.enableButton("sub-garden");
    this.ui.showHint("Let's start by building your first garden", "garden");

    const check = () => {
      const hasGarden = this.game.field.fields.some(
        (f) => f.structure?.type === "plot"
      );
      if (hasGarden) this._step2();
      else requestAnimationFrame(check);
    };
    requestAnimationFrame(check);
  }

  _step2() {
    this.ui.removeHighlights();
    this.ui.showHint("Nice! You built your first garden");
  }
}
