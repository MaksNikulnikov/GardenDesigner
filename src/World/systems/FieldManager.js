import * as THREE from "three";
import { createPlaceholder } from "../components/gameObjects/placeholder.js";

export class FieldManager {
  constructor(scene) {
    this.scene = scene;

    this.cellSize = 4;
    this.rows = 2;
    this.cols = 4;
    this.origin = new THREE.Vector3(0, 0, 0);

    this.slots = [];
    this._createField();
  }

  _createField() {
    const startX = this.origin.x - ((this.cols - 1) * this.cellSize) / 2;
    const startZ = this.origin.z - ((this.rows - 1) * this.cellSize) / 2;

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const posX = startX + c * this.cellSize;
        const posZ = startZ + r * this.cellSize;

        const placeholder = createPlaceholder();
        placeholder.position.set(posX, 0, posZ);
        this.scene.add(placeholder);

        this.slots.push({
          type: r === 0 ? "plants" : "animals",
          gridPos: { row: r, col: c },
          position: new THREE.Vector3(posX, 0, posZ),
          placeholder,
          content: null,
        });
      }
    }

    const gridHelper = new THREE.GridHelper(
      this.cols * this.cellSize,
      this.cols,
      0x888888,
      0x444444
    );
    this.scene.add(gridHelper);
  }

  getSlotFromWorldPosition(worldPos) {
    const startX = this.origin.x - ((this.cols - 1) * this.cellSize) / 2;
    const startZ = this.origin.z - ((this.rows - 1) * this.cellSize) / 2;

    const col = Math.round((worldPos.x - startX) / this.cellSize);
    const row = Math.round((worldPos.z - startZ) / this.cellSize);

    const index = row * this.cols + col;
    return this.slots[index];
  }

  plant(slot, obj) {
    if (!slot || slot.content) return;

    this.scene.remove(slot.placeholder);
    obj.position.copy(slot.position);
    this.scene.add(obj);
    slot.content = obj;
  }

  harvest(slot) {
    if (!slot || !slot.content) return;
    this.scene.remove(slot.content);
    slot.content = null;

    const placeholder = createPlaceholder();
    placeholder.position.copy(slot.position);
    this.scene.add(placeholder);
    slot.placeholder = placeholder;
  }
}
