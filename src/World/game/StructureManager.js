import { FACTORIES } from "../components/gameObjects/factories.js";
import { gsap } from "gsap";
import { GAME_CONFIG } from "../config/gameConfig.js";
import { createSmokeEffect } from "../effects/createSmokeEffect.js";
import * as THREE from "three";
import { SoundManager, SOUND_KEYS } from "../audio/SoundManager.js";

function disposeObject3D(root) {
  root?.traverse?.((node) => {
    if (!node?.isMesh) return;
    node.geometry?.dispose?.();
    if (Array.isArray(node.material)) {
      node.material.forEach((mat) => mat?.dispose?.());
    } else {
      node.material?.dispose?.();
    }
  });
}

export class StructureManager {
  constructor(scene, onEffectCreated) {
    this.scene = scene;
    this.onEffectCreated = onEffectCreated;
    this._placeholders = new Set();
    this._structures = new Set();
    this._effects = new Set();
    this._buildCalls = new Set();
  }

  createPlaceholder(config) {
    const model = FACTORIES.placeholder();
    model.position.copy(config.position);
    if (config.rotationY) model.rotation.y = config.rotationY;
    this.scene.add(model);
    this._placeholders.add(model);

    return {
      id: config.id,
      type: config.type,
      position: config.position.clone(),
      rotationY: config.rotationY ?? 0,
      placeholder: model,
      structure: null,
    };
  }

  removePlaceholder(field) {
    if (!field?.placeholder) return;
    this.scene.remove(field.placeholder);
    this._placeholders.delete(field.placeholder);
    disposeObject3D(field.placeholder);

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
    this._effects.add(smoke);
    this.onEffectCreated?.(smoke);

    const group = factoryFn();
    group.position.copy(origin);
    group.position.y += offsetY;
    group.rotation.y = rotationY;
    group.scale.set(0.001, 0.001, 0.001);
    group.visible = false;
    this.scene.add(group);
    this._structures.add(group);
    SoundManager.instance.playSfx(SOUND_KEYS.BUILD);
    // Animate appearance
    const delayed = gsap.delayedCall(buildTime, () => {
      this._buildCalls.delete(delayed);
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
          onComplete: () => {
            group.scale.set(1, 1, 1)
          },
        }
      );
    });
    this._buildCalls.add(delayed);

    // Create grid of cells
    const cellLayout = GAME_CONFIG.STRUCTURES[type].cellLayout;
    const cells = this._createCells(origin, rotationY, cellType, cellLayout, field);

    return { type, group, cells, origin };
  }

  _createCells(origin, rotationY, cellType, layout, field) {
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
          field
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

  dispose(fields = []) {
    for (const tween of this._buildCalls) {
      tween?.kill?.();
    }
    this._buildCalls.clear();

    for (const effect of this._effects) {
      effect?.dispose?.();
    }
    this._effects.clear();

    for (const structure of this._structures) {
      this.scene.remove(structure);
      disposeObject3D(structure);
    }
    this._structures.clear();

    for (const placeholder of this._placeholders) {
      this.scene.remove(placeholder);
      disposeObject3D(placeholder);
    }
    this._placeholders.clear();

    for (const field of fields) {
      field.placeholder = null;
      field.structure = null;
    }
  }
}
