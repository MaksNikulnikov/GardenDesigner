import * as THREE from "three";

export class GridService {
  constructor({
    cellSize = 1,
    rows = 3, // Z
    cols = 2, // X
    origin = new THREE.Vector3(0, 0, 0),
  } = {}) {
    this.cellSize = cellSize;
    this.rows = rows;
    this.cols = cols;
    this.origin = origin;
  }

  getWorldPosition(row, col) {
    const totalWidth = (this.cols - 1) * this.cellSize;
    const totalDepth = (this.rows - 1) * this.cellSize;

    const startX = this.origin.x - totalWidth / 2;
    const startZ = this.origin.z - totalDepth / 2;

    const x = startX + col * this.cellSize;
    const z = startZ + row * this.cellSize;

    return new THREE.Vector3(x, this.origin.y, z);
  }

  getCellFromWorldPosition(worldPos) {
    const totalWidth = (this.cols - 1) * this.cellSize;
    const totalDepth = (this.rows - 1) * this.cellSize;

    const startX = this.origin.x - totalWidth / 2;
    const startZ = this.origin.z - totalDepth / 2;

    const col = Math.round((worldPos.x - startX) / this.cellSize);
    const row = Math.round((worldPos.z - startZ) / this.cellSize);

    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) {
      return null;
    }

    return { row, col };
  }
}
