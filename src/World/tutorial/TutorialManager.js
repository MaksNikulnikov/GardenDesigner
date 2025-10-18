import { Step1 } from "./steps/Step1";
import { Step2 } from "./steps/Step2";
import { Step3 } from "./steps/Step3";
import { Step4 } from "./steps/Step4";
import { Step5 } from "./steps/Step5";
import { Step6 } from "./steps/Step6";


export class TutorialManager {
  constructor(ui, game) {
    this.ui = ui;
    this.game = game;
    this.steps = [];
    this.currentStepIndex = 0;
    this.activeStep = null;

    this._initSteps();
  }

  _initSteps() {
    this.steps = [
      new Step1(this),
      new Step2(this),
      new Step3(this),
      new Step4(this),
      new Step5(this),
      new Step6(this),
    ];
  }

  start() {
    this.currentStepIndex = 0;
    this._runCurrentStep();
  }

  _runCurrentStep() {
    this.activeStep = this.steps[this.currentStepIndex];
    if (!this.activeStep) return;

    this.activeStep.start();

    const loop = () => {
      if (!this.activeStep) return;
      this.activeStep.update?.();

      if (this.activeStep.isComplete) {
        this.activeStep.complete?.();
        this.currentStepIndex++;
        this._runCurrentStep();
      } else {
        requestAnimationFrame(loop);
      }
    };

    requestAnimationFrame(loop);
  }
}
