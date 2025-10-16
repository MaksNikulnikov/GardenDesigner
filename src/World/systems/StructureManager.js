import { FACTORIES } from "./factories.js";
import { gsap } from "gsap";
import { GAME_CONFIG } from "../config/gameConfig.js";
import { createSmokeEffect } from "../effects/createSmokeEffect.js";

export class StructureManager {
  constructor(scene, onEffectCreated) {
    this.scene = scene;
    this.onEffectCreated = onEffectCreated; // callback from GameManager
  }

  createPlaceholder(cfg) {
    const model = FACTORIES.placeholder();
    model.position.copy(cfg.position);
    if (cfg.rotationY) model.rotation.y = cfg.rotationY;

    this.scene.add(model);

    return {
      id: cfg.id,
      type: cfg.type,
      position: cfg.position.clone(),
      rotationY: cfg.rotationY ?? 0,
      placeholder: model,
      structure: null,
    };
  }

  removePlaceholder(field) {
    if (!field || !field.placeholder) return;

    this.scene.remove(field.placeholder);

    return {
      id: field.id,
      position: field.position.clone(),
      rotationY: field.rotationY,
      type: field.type,
    };
  }

  createGardenPlot(field) {
    const { position: origin, rotationY } = field;
    const buildTime = GAME_CONFIG.STRUCTURES.plot.buildTime;
    const offsetY =
      GAME_CONFIG.OFFSET_Y.PLOT - GAME_CONFIG.OFFSET_Y.PLACEHOLDER;

    const smoke = createSmokeEffect(this.scene, origin, {
      duration: buildTime,
    });
    this.onEffectCreated?.(smoke);

    const group = FACTORIES.plot();
    group.position.copy(origin);
    group.position.y += offsetY;
    group.rotation.y = rotationY;
    group.scale.set(0.001, 0.001, 0.001);
    group.visible = false;
    this.scene.add(group);

    gsap.delayedCall(buildTime, () => {
      group.visible = true;
      gsap.fromTo(
        group.scale,
        { x: 0.001, y: 0.001, z: 0.001 },
        {
          x: 1.05,
          y: 1.05,
          z: 1.05,
          duration: 0.6,
          ease: "back.out(2)",
          onComplete: () => group.scale.set(1, 1, 1),
        }
      );
    });

    return { type: "garden", group, cells: [], origin };
  }

  createAnimalPen(field) {
    const { position: origin, rotationY } = field;
    const buildTime = GAME_CONFIG.STRUCTURES.pen.buildTime;
    const offsetY = GAME_CONFIG.OFFSET_Y.PEN - GAME_CONFIG.OFFSET_Y.PLACEHOLDER;

    const smoke = createSmokeEffect(this.scene, origin, {
      duration: buildTime,
    });
    this.onEffectCreated?.(smoke);

    const group = FACTORIES.pen();
    group.position.copy(origin);
    group.position.y += offsetY;
    group.rotation.y = rotationY;

    group.scale.set(0.001, 0.001, 0.001);
    group.visible = false;
    this.scene.add(group);

    gsap.delayedCall(buildTime, () => {
      group.visible = true;
      gsap.fromTo(
        group.scale,
        { x: 0.001, y: 0.001, z: 0.001 },
        {
          x: 1.05,
          y: 1.05,
          z: 1.05,
          duration: 0.6,
          ease: "back.out(2.2)",
          onComplete: () => group.scale.set(1, 1, 1),
        }
      );
    });

    return {
      type: "pen",
      group,
      cell: { position: origin.clone(), type: "animals", content: null },
    };
  }
}
