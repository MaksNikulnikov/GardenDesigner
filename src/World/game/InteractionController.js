import * as THREE from "three";

export class InteractionController {
  constructor({
    renderer,
    camera,
    getPickableEntities,
    onGroundPointDown,
    onGroundPointMove,
    onPointerLeave,
    onCounterClick,
  }) {
    this.renderer = renderer;
    this.camera = camera;
    this.getPickableEntities = getPickableEntities;
    this.onGroundPointDown = onGroundPointDown;
    this.onGroundPointMove = onGroundPointMove;
    this.onPointerLeave = onPointerLeave;
    this.onCounterClick = onCounterClick;

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

    this._onPointerDown = null;
    this._onPointerMove = null;
    this._onPointerLeave = null;
    this._onDocumentClick = null;
  }

  start() {
    this._onPointerDown = (event) => {
      const point = this._getPointerPointOnGround(event);
      if (!point) return;

      const raycastEntity = this._pickEntityFromRaycast();
      this.onGroundPointDown?.({ point, raycastEntity });
    };
    this.renderer.domElement.addEventListener("pointerdown", this._onPointerDown);

    this._onPointerMove = (event) => {
      const point = this._getPointerPointOnGround(event);
      this.onGroundPointMove?.(point);
    };
    this.renderer.domElement.addEventListener("pointermove", this._onPointerMove);

    this._onPointerLeave = () => {
      this.onPointerLeave?.();
    };
    this.renderer.domElement.addEventListener("pointerleave", this._onPointerLeave);

    this._onDocumentClick = (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const el = target.closest("[data-animal-id]");
      if (!el) return;
      this.onCounterClick?.(el.dataset.animalId);
    };
    document.addEventListener("click", this._onDocumentClick);
  }

  _getPointerPointOnGround(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);

    const point = new THREE.Vector3();
    const hit = this.raycaster.ray.intersectPlane(this.groundPlane, point);
    return hit ? point : null;
  }

  _pickEntityFromRaycast() {
    const entities = this.getPickableEntities?.() ?? [];
    const roots = entities.map((entry) => entry.obj).filter(Boolean);
    if (roots.length === 0) return null;

    const hits = this.raycaster.intersectObjects(roots, true);
    if (hits.length === 0) return null;

    let hit = hits[0].object;
    let foundId = null;
    while (hit && !foundId) {
      if (hit.userData?.entityId) foundId = hit.userData.entityId;
      hit = hit.parent;
    }
    if (!foundId) return null;

    return entities.find((entry) => entry.id === foundId) || null;
  }

  dispose() {
    if (this._onPointerDown) {
      this.renderer.domElement.removeEventListener("pointerdown", this._onPointerDown);
      this._onPointerDown = null;
    }
    if (this._onPointerMove) {
      this.renderer.domElement.removeEventListener("pointermove", this._onPointerMove);
      this._onPointerMove = null;
    }
    if (this._onPointerLeave) {
      this.renderer.domElement.removeEventListener("pointerleave", this._onPointerLeave);
      this._onPointerLeave = null;
    }
    if (this._onDocumentClick) {
      document.removeEventListener("click", this._onDocumentClick);
      this._onDocumentClick = null;
    }
  }
}

