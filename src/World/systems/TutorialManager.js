export class TutorialManager {
  constructor(ui, game) {
    this.ui = ui;
    this.game = game;
    this.step = 0;
  }

  start() {
    this._nextStep();
  }

  _nextStep() {
    this.step++;

    switch (this.step) {
      case 1:
        // Intro
        this.ui.showHint("Welcome to GardenMakeover!\nTap anywhere to start 🌸");
        this.ui.onClick(() => this._nextStep());
        break;

      case 2:
        // Show build button
        this.ui.showHint("First, let’s build your garden! 🏗️");
        this.ui.highlightButton("btn-build");
        this.ui.onClick(() => this._nextStep());
        break;

      case 3:
        // Player builds something
        this.ui.showHint("Choose what to build:\n🌿 Garden Plot or 🐔 Animal Pen");
        this.ui.removeHighlights();
        this.game.waitForBuild(() => this._nextStep());
        break;

      case 4:
        // Unlock planting
        this.ui.showHint("Nice work! Now let's plant some crops 🌱");
        this.ui.unlockCategory("plants");
        this.ui.highlightButton("btn-plants");
        this.ui.onClick(() => this._nextStep());
        break;

      case 5:
        // Plant crops
        this.ui.showHint("Tap a garden cell to plant!");
        this.ui.removeHighlights();
        this.game.waitForPlant(() => this._nextStep());
        break;

      case 6:
        // Unlock animals
        this.ui.showHint("Great! Now let's raise some chickens 🐔");
        this.ui.unlockCategory("animals");
        this.ui.highlightButton("btn-animals");
        this.ui.onClick(() => this._nextStep());
        break;

      case 7:
        // Place animal
        this.ui.showHint("Tap a pen cell to add your chicken!");
        this.ui.removeHighlights();
        this.game.waitForAnimal(() => this._nextStep());
        break;

      case 8:
        // Finish
        this.ui.showHint("Your farm looks amazing! 🌾");
        setTimeout(() => {
          this.ui.showCTA("Download GardenMakeover");
        }, 1000);
        break;
    }
  }
}
