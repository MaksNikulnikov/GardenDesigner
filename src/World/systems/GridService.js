import * as THREE from "three";

export class GridService {
  constructor({ cellSize = 2, rows = 2, cols = 4, origin = new THREE.Vector3(0, 0, 0) } = {}) {
    this.cellSize = cellSize;
    this.rows = rows;
    this.cols = cols;
    this.origin = origin;
  }

  getWorldPosition(row, col) {
    const startX = this.origin.x - ((this.cols - 1) * this.cellSize) / 2;
    const startZ = this.origin.z - ((this.rows - 1) * this.cellSize) / 2;
    const x = startX + col * this.cellSize;
    const z = startZ + row * this.cellSize;
    return new THREE.Vector3(x, 0, z);
  }

  getCellFromWorldPosition(worldPos) {
    const startX = this.origin.x - ((this.cols - 1) * this.cellSize) / 2;
    const startZ = this.origin.z - ((this.rows - 1) * this.cellSize) / 2;

    const col = Math.round((worldPos.x - startX) / this.cellSize);
    const row = Math.round((worldPos.z - startZ) / this.cellSize);

    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) {
      return null;
    }

    return { row, col };
  }

  getCellType(row) {
    return row === 0 ? "plants" : "animals";
  }
}
