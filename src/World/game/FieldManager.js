import { FIELDS_CONFIG } from "../config/fieldsConfig.js";

export class FieldManager {
  constructor(scene) {
    this.scene = scene;
    this.fields = FIELDS_CONFIG.map(cfg => ({
      id: cfg.id,
      type: cfg.type,
      position: cfg.position.clone(),
      rotationY: cfg.rotationY ?? 0,
      structure: null,
      placeholder: null,
    }));
  }

  getFieldByPosition(point) {
    let closest = null;
    let minDist = Infinity;
    for (const field of this.fields) {
      const dist = field.position.distanceTo(point);
      if (dist < 3 && dist < minDist) {
        closest = field;
        minDist = dist;
      }
    }
    return closest;
  }
}