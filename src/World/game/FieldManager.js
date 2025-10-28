import * as THREE from "three";
import { FIELDS_CONFIG } from "../config/fieldsConfig.js";

export class FieldManager {
  constructor(scene) {
    this.scene = scene;

    this.fields = FIELDS_CONFIG.map(config => {
      const { id, type, position, rotationY = 0, size } = config;
      const halfWidth = size.x / 2;
      const halfHeight = size.z / 2;

      return {
        id,
        type,
        position: position.clone(),
        rotationY,
        size,
        bounds: {
          min: new THREE.Vector2(-halfWidth, -halfHeight),
          max: new THREE.Vector2(halfWidth, halfHeight),
        },
        structure: null,
        placeholder: null,
      };
    });
  }

  getFieldByPosition(point) {
    for (const field of this.fields) {
      const localPoint = this._convertWorldToLocal(point, field);
      if (this._isPointInsideBounds(localPoint, field.bounds)) {
        return field;
      }
    }
    return null;
  }

  // converts a world-space click position into the local coordinate space of a field
  _convertWorldToLocal(point, field) {
    const deltaX = point.x - field.position.x;
    const deltaZ = point.z - field.position.z;
    const cos = Math.cos(-field.rotationY);
    const sin = Math.sin(-field.rotationY);
    return new THREE.Vector2(
      deltaX * cos - deltaZ * sin,
      deltaX * sin + deltaZ * cos
    );
  }

  // checks if the local point lies within rectangular bounds
  _isPointInsideBounds(localPoint, bounds) {
    return (
      localPoint.x >= bounds.min.x &&
      localPoint.x <= bounds.max.x &&
      localPoint.y >= bounds.min.y &&
      localPoint.y <= bounds.max.y
    );
  }
}
