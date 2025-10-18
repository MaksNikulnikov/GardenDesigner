import { FACTORIES } from "./factories.js";
import { gsap } from "gsap";
import { GAME_CONFIG } from "../config/gameConfig.js";
import { createSmokeEffect } from "../effects/createSmokeEffect.js";
import * as THREE from "three";

export class StructureManager {
  constructor(scene, onEffectCreated) {
    this.scene = scene;
    this.onEffectCreated = onEffectCreated;
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
    if (!field?.placeholder) return;
    this.scene.remove(field.placeholder);

    return {
      id: field.id,
      position: field.position.clone(),
      rotationY: field.rotationY,
      type: field.type,
    };
  }

  /**
   * Generic builder for any structure with cells
   */
  _createStructure(field, type, factoryFn, offsetY, cellType) {
    const { position: origin, rotationY } = field;
    const buildTime = GAME_CONFIG.STRUCTURES[type].buildTime;

    const smoke = createSmokeEffect(this.scene, origin, { duration: buildTime });
    this.onEffectCreated?.(smoke);

    const group = factoryFn();
    group.position.copy(origin);
    group.position.y += offsetY;
    group.rotation.y = rotationY;
    group.scale.set(0.001, 0.001, 0.001);
    group.visible = false;
    this.scene.add(group);

    // Animate appearance
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

    // Create grid of cells
    const cellLayout = GAME_CONFIG.STRUCTURES[type].cellLayout;
    const cells = this._createCells(origin, rotationY, cellType, cellLayout);

    return { type, group, cells, origin };
  }

  _createCells(origin, rotationY, cellType, layout) {
    const cells = [];
    const cellSizeX = layout.cellSizeX ?? 1;
    const cellSizeZ = layout.cellSizeZ ?? 1;
    const rows = layout.rows ?? 3;
    const cols = layout.cols ?? 2;

    let idCounter = 0;
    const matrixOffsetX = (cols - 1) * cellSizeX * 0.5;
    const matrixOffsetZ = (rows - 1) * cellSizeZ * 0.5;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const pos = new THREE.Vector3(
          origin.x + (c * cellSizeX - matrixOffsetX),
          origin.y,
          origin.z + (r * cellSizeZ - matrixOffsetZ)
        );

        const rotated = pos.clone().sub(origin).applyAxisAngle(new THREE.Vector3(0, 1, 0), rotationY).add(origin);

        cells.push({
          id: `cell_${idCounter++}`,
          type: cellType,
          position: rotated,
          content: null,
        });
      }
    }

    return cells;
  }

  createGarden(field) {
    const offsetY = GAME_CONFIG.OFFSET_Y.GARDEN - GAME_CONFIG.OFFSET_Y.PLACEHOLDER;
    return this._createStructure(field, "garden", FACTORIES.garden, offsetY, "plants");
  }

  createAnimalPen(field) {
    const offsetY = GAME_CONFIG.OFFSET_Y.PEN - GAME_CONFIG.OFFSET_Y.PLACEHOLDER;
    return this._createStructure(field, "pen", FACTORIES.pen, offsetY, "animals");
  }
}
