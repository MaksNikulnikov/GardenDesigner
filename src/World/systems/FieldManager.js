import { FIELDS_CONFIG } from "../config/fieldsConfig.js";
import { FACTORIES } from "./factories.js";

export class FieldManager {
  constructor(scene) {
    this.scene = scene;
    this.placeholders = [];

    this._createPlaceholders();
  }

  _createPlaceholders() {
    FIELDS_CONFIG.forEach((cfg) => {
      const placeholder = FACTORIES.placeholder();

      placeholder.position.copy(cfg.position);
      if (cfg.rotationY) placeholder.rotation.y = cfg.rotationY;

      this.scene.add(placeholder);

      this.placeholders.push({
        id: cfg.id,
        position: cfg.position.clone(),
        rotationY: cfg.rotationY ?? 0,
        placeholder,
        structure: null,
        type: cfg.type,
      });
    });
  }

  getPlaceholderByPosition(point) {
    let closest = null;
    let minDist = Infinity;
    for (const ph of this.placeholders) {
      const dist = ph.position.distanceTo(point);
      if (dist < 3 && dist < minDist) {
        closest = ph;
        minDist = dist;
      }
    }
    return closest;
  }

  removePlaceholder(placeholder) {
    if (!placeholder || placeholder.structure) return;
    this.scene.remove(placeholder.placeholder);
  }

  removeStructure(placeholder) {
    if (!placeholder.structure) return;

    this.scene.remove(placeholder.structure.group);

    const placeholderModel = FACTORIES.placeholder();
    placeholderModel.position.copy(placeholder.position);
    placeholderModel.rotation.y = placeholder.rotationY || 0;
    this.scene.add(placeholderModel);

    placeholder.placeholder = placeholderModel;
    placeholder.structure = null;
  }
}
