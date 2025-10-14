import { createPlaceholder } from "../components/gameObjects/placeholder.js";
import { GridService } from "./GridService.js";

export class FieldManager {
  constructor(scene) {
    this.scene = scene;
    this.grid = new GridService({ cellSize: 2, rows: 2, cols: 4 });

    this.slots = [];
    this._createField();
  }

  _createField() {
    for (let r = 0; r < this.grid.rows; r++) {
      for (let c = 0; c < this.grid.cols; c++) {
        const position = this.grid.getWorldPosition(r, c);
        const placeholder = createPlaceholder();
        placeholder.position.copy(position);
        this.scene.add(placeholder);

        this.slots.push({
          row: r,
          col: c,
          type: this.grid.getCellType(r),
          position,
          placeholder,
          content: null,
        });
      }
    }
  }

  getSlot(row, col) {
    return this.slots.find((s) => s.row === row && s.col === col);
  }

  getSlotFromWorldPosition(worldPos) {
    const cell = this.grid.getCellFromWorldPosition(worldPos);
    if (!cell) return null;
    return this.getSlot(cell.row, cell.col);
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
