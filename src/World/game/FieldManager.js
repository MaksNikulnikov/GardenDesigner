import { FIELDS_CONFIG } from "../config/fieldsConfig.js";

export class FieldManager {
  constructor(scene) {
    this.scene = scene;
    this.fields = FIELDS_CONFIG.map(config => ({
      id: config.id,
      type: config.type,
      position: config.position.clone(),
      rotationY: config.rotationY ?? 0,
      structure: null,
      placeholder: null,
    }));
  }

  getFieldByPosition(point) {
    let closest = null;
    let minDistance = Infinity;
    for (const field of this.fields) {
      const distance = field.position.distanceTo(point);
      if (distance < 3 && distance < minDistance) {
        closest = field;
        minDistance = distance;
      }
    }
    return closest;
  }
}