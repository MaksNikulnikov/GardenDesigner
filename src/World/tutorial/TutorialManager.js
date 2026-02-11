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
    this.running = false;

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
    this.running = true;
    this._runCurrentStep();
  }

  stop() {
    this.running = false;
    this.activeStep?.complete?.();
    this.activeStep = null;
  }

  _runCurrentStep() {
    this.activeStep = this.steps[this.currentStepIndex];
    if (!this.activeStep) {
      this.running = false;
      return;
    }

    this.activeStep.start();
  }

  tick(delta) {
    if (!this.running || !this.activeStep) return;

    this.activeStep.update?.(delta);

    if (this.activeStep.isComplete) {
      this.activeStep.complete?.();
      this.currentStepIndex++;

      if (this.currentStepIndex < this.steps.length) {
        this._runCurrentStep();
      } else {
        this.running = false;
      }
    }
  }

  dispose() {
    this.stop();
    this.steps = [];
  }
}
