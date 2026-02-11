import * as THREE from "three";
import { GameUI } from "../ui/ui.js";
import { GAME_CONFIG } from "../config/gameConfig.js";
import { FieldManager } from "./FieldManager.js";
import { StructureManager } from "./StructureManager.js";
import { EntityManager } from "./EntityManager.js";
import { DayNightManager } from "./DayNightManager.js";
import { TutorialManager } from "../tutorial/TutorialManager.js";
import { SOUND_KEYS, SoundManager } from "../audio/SoundManager.js";
import { gsap } from "gsap";

const INTERACTION_CONFIG = {
  CELL_PICK_RADIUS: 1.6,
  CELL_SNAP_RADIUS: 2.6,
  BUILD_SNAP_MARGIN: 1.35,
  HARVEST_SNAP_RADIUS_PLANT: 2.2,
  HARVEST_SNAP_RADIUS_ANIMAL: 3.6,
};

export class GameManager {
  constructor(scene, camera, renderer, controls = null) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.controls = controls;

    this.state = {
      coins: GAME_CONFIG.INITIAL_COINS,
      corn: 0,
      eggs: 0,
      selectedCategory: null,
      selectedItem: null,
      buildMode: null,
    };

    this.clock = new THREE.Clock();
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.updatables = [];
    this._cameraTween = null;
    this.tutorialTargets = {
      gardenField: null,
      penField: null,
    };
    this._previewFieldMesh = null;
    this._previewCellGroup = null;
    this._previewPulse = 0;
    this._previewResolvedCell = null;
    this._previewResolvedField = null;
    this._timeScale = 1;
    this._timeForceRunning = false;

    this.field = new FieldManager(scene);
    this.structures = new StructureManager(scene, (fx) => this.addUpdatable(fx));
    this.entities = new EntityManager(
      scene,
      (obj) => this.addUpdatable(obj),
      this.camera
    );

    for (const field of this.field.fields) {
      const ph = this.structures.createPlaceholder(field);
      field.placeholder = ph.placeholder;
    }

    this.ui = new GameUI({
      onBuildModeSelect: (type) => this._startBuildMode(type),
      onCategorySelect: (category) => this._onCategorySelect(category),
      onItemSelect: (item) => this._onItemSelect(item),
    });

    this._setupSceneClick();
    this._initInteractionPreview();

    this.tutorial = new TutorialManager(this.ui, this);
    this.dayNight = new DayNightManager(scene, this.ui);

    this._initAudio();

    this.ui.ready.then(() => {
      this.ui.onDayNightToggle(() => {
        this.dayNight.toggleDayNight();
      });
      this.ui.updateCoins(this.state.coins);
      this.tutorial.start();
      this.addUpdatable(this.tutorial);
    });
  }

  _initAudio() {
    const sound = SoundManager.instance;

    document.addEventListener(
      "pointerdown",
      async () => {
        try {
          sound._unlockAudio();
          await sound.loadAll();
          sound.playMusic(true);
        } catch (err) {
          console.warn("[GameManager] Failed to initialize audio", err);
        }
      },
      { once: true }
    );
  }

  addUpdatable(obj) {
    if (obj && typeof obj.tick === "function") this.updatables.push(obj);
  }

  removeUpdatable(obj) {
    this.updatables = this.updatables.filter((o) => o !== obj);
  }

  clearSelectedItem() {
    this.state.selectedItem = null;
    this._setPreviewTarget(null);
  }

  setTimeFlow({ scale = 1, forceRunning = false } = {}) {
    this._timeScale = Math.max(0, scale);
    this._timeForceRunning = !!forceRunning;
    this.ui?.setTimeWarpActive?.(this._timeScale > 1.05);
  }

  resetTimeFlow() {
    this._timeScale = 1;
    this._timeForceRunning = false;
    this.ui?.setTimeWarpActive?.(false);
  }

  _onCategorySelect(category) {
    this.state.selectedCategory = category;
    this.state.selectedItem = null;
    this._setPreviewTarget(null);
  }

  _onItemSelect(item) {
    this.state.selectedItem = item;
    this._setPreviewTarget(null);
  }

  _startBuildMode(type) {
    this.state.buildMode = type;
    this._setPreviewTarget(null);
  }

  _setupSceneClick() {
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

    this.renderer.domElement.addEventListener("pointerdown", (event) => {
      const point = this._getPointerPointOnGround(event, plane);
      if (!point) return;

      if (this.state.selectedItem || this.state.buildMode) {
        this._handleClick(point);
        return;
      }

      const hitEntity = this._pickEntityFromRaycast();
      if (hitEntity) {
        this.entities.harvest(hitEntity, this.state, this.ui);
        return;
      }

      const nearestHarvestable = this._findNearestHarvestableEntity(point);
      if (nearestHarvestable) {
        this.entities.harvest(nearestHarvestable, this.state, this.ui);
        return;
      }

      this._handleClick(point);
    });

    this.renderer.domElement.addEventListener("pointermove", (event) => {
      if (!this.state.selectedItem && !this.state.buildMode) {
        this._setPreviewTarget(null);
        return;
      }
      const point = this._getPointerPointOnGround(event, plane);
      if (!point) {
        this._setPreviewTarget(null);
        return;
      }
      this._updateInteractionPreview(point);
    });

    this.renderer.domElement.addEventListener("pointerleave", () => {
      this._setPreviewTarget(null);
    });

    document.addEventListener("click", (e) => {
      const target = e.target;
      if (!target) return;
      // @ts-ignore
      const el = target.closest("[data-animal-id]");
      if (!el) return;
      const id = el.dataset.animalId;
      const entity = this.entities.entities.find((entry) => entry.id === id);
      if (entity) {
        this.entities.harvest(entity, this.state, this.ui);
        SoundManager.instance.playSfx(SOUND_KEYS.HARVEST);
      }
    });
  }

  _pickEntityFromRaycast() {
    const allMeshes = [];
    for (const entity of this.entities.entities) {
      entity.obj.traverse((child) => {
        if (child.isMesh) allMeshes.push(child);
      });
    }

    const hits = this.raycaster.intersectObjects(allMeshes, true);
    if (hits.length === 0) return null;

    let hit = hits[0].object;
    let foundId = null;
    while (hit && !foundId) {
      if (hit.userData?.entityId) foundId = hit.userData.entityId;
      hit = hit.parent;
    }

    if (!foundId) return null;
    return this.entities.entities.find((entry) => entry.id === foundId) || null;
  }

  _handleClick(point) {
    if (this.state.selectedItem) {
      const previewCell = this._previewResolvedCell;
      const targetCell =
        this._isCellValidForItem(previewCell, this.state.selectedItem)
          ? previewCell
          : this._resolvePlacementCell(point, this.state.selectedItem);
      if (targetCell) {
        this._handleCellClick(targetCell);
      }
      return;
    }

    const clickedCell = this._getClickedCell(point, INTERACTION_CONFIG.CELL_PICK_RADIUS);
    if (clickedCell) {
      const targetEntity = this.entities.getEntityByCell(clickedCell);
      if (targetEntity?.readyToHarvest) {
        this.entities.harvest(targetEntity, this.state, this.ui);
        return;
      }
    }

    const nearestHarvestable = this._findNearestHarvestableEntity(point);
    if (nearestHarvestable) {
      this.entities.harvest(nearestHarvestable, this.state, this.ui);
      return;
    }

    if (this.state.buildMode) {
      const previewField = this._previewResolvedField;
      const field =
        previewField && !previewField.structure
          ? previewField
          : this._resolveBuildField(point);
      if (!field || field.structure) return;
      this._buildStructure(field);
    }
  }

  _getClickedCell(point, maxDistance = INTERACTION_CONFIG.CELL_PICK_RADIUS) {
    let bestCell = null;
    let bestDistance = Infinity;

    for (const field of this.field.fields) {
      const structure = field.structure;
      if (!structure) continue;

      for (const cell of structure.cells) {
        const dist = cell.position.distanceTo(point);
        if (dist <= maxDistance && dist < bestDistance) {
          bestDistance = dist;
          bestCell = cell;
        }
      }
    }

    return bestCell;
  }

  _buildStructure(field) {
    const mode = this.state.buildMode;
    if (!mode) return;

    if (this.state.coins < GAME_CONFIG.STRUCTURES[mode].cost) {
      this.ui.showHint("Oh no! You didn't have enough coins!", "money");
      return;
    }

    this.state.coins -= GAME_CONFIG.STRUCTURES[mode].cost;
    this.ui.updateCoins(this.state.coins);

    if (mode === "garden") {
      field.structure = this.structures.createGarden(field);
    } else if (mode === "pen") {
      field.structure = this.structures.createAnimalPen(field);
    }

    this.structures.removePlaceholder(field);
    field.placeholder = null;
    this.ui.hideHint();

    this.state.buildMode = null;
    this._setPreviewTarget(null);
  }

  _handleCellClick(cell) {
    const item = this.entities.getEntityByCell(cell);

    if (!cell.content && this.state.selectedItem && cell.type === "plants") {
      this.entities.plantOrSpawn(cell, this.state.selectedItem, this.state, this.ui);
      return;
    }

    if (this.state.selectedItem && cell.type === "animals") {
      if (!cell.content) {
        this.entities.plantOrSpawn(cell, this.state.selectedItem, this.state, this.ui);
        return;
      }

      const emptyCellOnTheSameField = cell.field.structure.cells.find(
        (entry) => !entry.content
      );
      if (emptyCellOnTheSameField) {
        this.entities.plantOrSpawn(
          emptyCellOnTheSameField,
          this.state.selectedItem,
          this.state,
          this.ui
        );
        return;
      }
    }

    if (item && item.readyToHarvest) {
      this.entities.harvest(item, this.state, this.ui);
    }
  }

  _resolvePlacementCell(point, itemType) {
    const itemConfig = GAME_CONFIG.ITEMS[itemType];
    const category = itemConfig?.category;
    if (!category) return null;
    const cellType = category === "plants" ? "plants" : "animals";

    const directCell = this._getClickedCell(point, INTERACTION_CONFIG.CELL_PICK_RADIUS);
    if (this._isCellValidForItem(directCell, itemType)) {
      return directCell;
    }

    return this._findNearestValidCell(point, itemType, {
      cellType,
      maxDistance: INTERACTION_CONFIG.CELL_SNAP_RADIUS,
    });
  }

  _isCellValidForItem(cell, itemType) {
    if (!cell || cell.content) return false;
    const config = GAME_CONFIG.ITEMS[itemType];
    if (!config) return false;
    if (config.category === "plants") return cell.type === "plants";
    if (config.category === "animals") return cell.type === "animals";
    return false;
  }

  _findNearestValidCell(point, itemType, { cellType, maxDistance }) {
    let bestCell = null;
    let bestDist = Infinity;

    for (const field of this.field.fields) {
      const structure = field.structure;
      if (!structure) continue;

      for (const cell of structure.cells) {
        if (cell.type !== cellType) continue;
        if (!this._isCellValidForItem(cell, itemType)) continue;

        const dist = cell.position.distanceTo(point);
        if (dist <= maxDistance && dist < bestDist) {
          bestDist = dist;
          bestCell = cell;
        }
      }
    }

    return bestCell;
  }

  _findNearestHarvestableEntity(point) {
    let bestEntity = null;
    let bestScore = Infinity;

    for (const entity of this.entities.entities) {
      if (!entity?.readyToHarvest || !entity?.cell?.position) continue;

      const dx = entity.cell.position.x - point.x;
      const dz = entity.cell.position.z - point.z;
      const distXZ = Math.hypot(dx, dz);
      const radius =
        entity.kind === "animal"
          ? INTERACTION_CONFIG.HARVEST_SNAP_RADIUS_ANIMAL
          : INTERACTION_CONFIG.HARVEST_SNAP_RADIUS_PLANT;

      if (distXZ <= radius) {
        const score = distXZ / radius;
        if (score < bestScore) {
          bestScore = score;
          bestEntity = entity;
        }
      }
    }

    return bestEntity;
  }

  _resolveBuildField(point) {
    const exactField = this.field.getFieldByPosition(point);
    if (exactField && !exactField.structure) return exactField;

    let bestField = null;
    let bestDist = Infinity;
    for (const field of this.field.fields) {
      if (field.structure) continue;
      const dist = this._distanceToField(point, field);
      if (dist <= INTERACTION_CONFIG.BUILD_SNAP_MARGIN && dist < bestDist) {
        bestDist = dist;
        bestField = field;
      }
    }

    return bestField;
  }

  _distanceToField(point, field) {
    const localPoint = this._worldToFieldLocal(point, field);
    const dx = Math.max(field.bounds.min.x - localPoint.x, 0, localPoint.x - field.bounds.max.x);
    const dz = Math.max(field.bounds.min.y - localPoint.y, 0, localPoint.y - field.bounds.max.y);
    return Math.hypot(dx, dz);
  }

  _worldToFieldLocal(point, field) {
    const deltaX = point.x - field.position.x;
    const deltaZ = point.z - field.position.z;
    const cos = Math.cos(-field.rotationY);
    const sin = Math.sin(-field.rotationY);
    return new THREE.Vector2(
      deltaX * cos - deltaZ * sin,
      deltaX * sin + deltaZ * cos
    );
  }

  _getPointerPointOnGround(event, plane) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);

    const point = new THREE.Vector3();
    const hit = this.raycaster.ray.intersectPlane(plane, point);
    return hit ? point : null;
  }

  _initInteractionPreview() {
    const fieldRing = new THREE.Mesh(
      new THREE.RingGeometry(0.55, 0.76, 32),
      new THREE.MeshBasicMaterial({
        color: 0xffe17a,
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide,
        depthTest: false,
        depthWrite: false,
      })
    );
    fieldRing.rotation.x = -Math.PI / 2;
    fieldRing.position.set(0, 0.08, 0);
    fieldRing.visible = false;
    fieldRing.renderOrder = 30;
    this.scene.add(fieldRing);
    this._previewFieldMesh = fieldRing;

    const cellGroup = new THREE.Group();

    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(0.45, 0.06, 12, 32),
      new THREE.MeshBasicMaterial({
        color: 0xfff3a8,
        transparent: true,
        opacity: 0.95,
        depthTest: false,
        depthWrite: false,
      })
    );
    halo.rotation.x = -Math.PI / 2;

    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 0.6, 10),
      new THREE.MeshBasicMaterial({
        color: 0xffd676,
        transparent: true,
        opacity: 0.65,
        depthTest: false,
        depthWrite: false,
      })
    );
    stem.position.y = -0.34;

    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 10, 10),
      new THREE.MeshBasicMaterial({
        color: 0xffe17a,
        transparent: true,
        opacity: 0.9,
        depthTest: false,
        depthWrite: false,
      })
    );
    cap.position.y = 0.04;

    cellGroup.add(halo, stem, cap);
    cellGroup.visible = false;
    cellGroup.renderOrder = 31;
    cellGroup.userData.baseY = 0;
    cellGroup.userData.baseScale = 1;
    this.scene.add(cellGroup);
    this._previewCellGroup = cellGroup;
  }

  _setPreviewTarget(target) {
    if (!this._previewFieldMesh || !this._previewCellGroup) return;
    if (!target) {
      this._previewResolvedCell = null;
      this._previewResolvedField = null;
      this._previewFieldMesh.visible = false;
      this._previewCellGroup.visible = false;
      return;
    }

    this._previewResolvedCell = target.cell ?? null;
    this._previewResolvedField = target.field ?? null;

    if (target.kind === "field") {
      this._previewCellGroup.visible = false;
      this._previewFieldMesh.visible = true;
      this._previewFieldMesh.position.copy(target.position);
      this._previewFieldMesh.position.y = target.position.y + 0.08;
      this._previewFieldMesh.scale.set(target.scale, target.scale, target.scale);
      return;
    }

    this._previewFieldMesh.visible = false;
    this._previewCellGroup.visible = true;
    this._previewCellGroup.userData.baseY = target.position.y + (target.yOffset ?? 0.9);
    this._previewCellGroup.userData.baseScale = target.scale ?? 1;
    this._previewCellGroup.position.set(
      target.position.x,
      this._previewCellGroup.userData.baseY,
      target.position.z
    );
    this._previewCellGroup.scale.set(
      this._previewCellGroup.userData.baseScale,
      this._previewCellGroup.userData.baseScale,
      this._previewCellGroup.userData.baseScale
    );
  }

  _updateInteractionPreview(point) {
    if (this.state.buildMode) {
      const field = this._resolveBuildField(point);
      if (!field) {
        this._setPreviewTarget(null);
        return;
      }

      const size = Math.max(field.size.x, field.size.z) * 0.32;
      this._setPreviewTarget({
        kind: "field",
        position: field.position,
        scale: size,
        field,
      });
      return;
    }

    if (this.state.selectedItem) {
      const cell = this._resolvePlacementCell(point, this.state.selectedItem);
      if (!cell) {
        this._setPreviewTarget(null);
        return;
      }

      this._setPreviewTarget({
        kind: "cell",
        position: cell.position,
        scale: 1,
        yOffset: cell.type === "plants" ? 1.0 : 0.75,
        cell,
      });
      return;
    }

    this._setPreviewTarget(null);
  }

  tick(delta) {
    this._previewPulse += delta * 4;
    if (this._previewCellGroup?.visible) {
      const bob = Math.sin(this._previewPulse) * 0.05;
      const pulse = 1 + Math.sin(this._previewPulse * 1.3) * 0.06;
      const baseY = this._previewCellGroup.userData.baseY ?? this._previewCellGroup.position.y;
      const baseScale = this._previewCellGroup.userData.baseScale ?? 1;
      this._previewCellGroup.position.y = baseY + bob;
      this._previewCellGroup.scale.set(
        baseScale * pulse,
        baseScale * pulse,
        baseScale * pulse
      );
    }

    const hasActiveGrowth = this.entities.hasActiveGrowth?.() ?? false;
    const shouldAdvanceTime = this._timeForceRunning || hasActiveGrowth;
    const simulationDelta = shouldAdvanceTime ? delta * this._timeScale : 0;

    this.entities.tick(simulationDelta, this.state, this.ui);
    this.dayNight.tick(simulationDelta);
    for (const obj of this.updatables) obj.tick?.(delta);
  }

  waitForBuild(callback) {
    const originalBuild = this._buildStructure.bind(this);
    this._buildStructure = (field) => {
      originalBuild(field);
      this._buildStructure = originalBuild;
      callback?.();
    };
  }

  waitForPlant(callback) {
    const originalHandle = this._handleCellClick.bind(this);
    this._handleCellClick = (cell) => {
      originalHandle(cell);
      if (cell.content) {
        this._handleCellClick = originalHandle;
        callback?.();
      }
    };
  }

  waitForAnimal(callback) {
    const originalHandle = this._handleCellClick.bind(this);
    this._handleCellClick = (cell) => {
      originalHandle(cell);
      if (cell.content && cell.type === "animals") {
        this._handleCellClick = originalHandle;
        callback?.();
      }
    };
  }

  // ========================
  // Tutorial spotlight helpers
  // ========================
  getTutorialBuildRect(structureType) {
    const field = this._getOrPickTutorialField(structureType);
    if (!field) return null;
    return this._getFieldScreenRect(field);
  }

  getTutorialBuildFocusPoint(structureType) {
    const field = this._getOrPickTutorialField(structureType);
    return field?.position?.clone?.() ?? null;
  }

  getTutorialPlantCellRect() {
    const gardenField = this._getOrPickTutorialField("garden");
    const cells = gardenField?.structure?.cells ?? [];
    const targetCell = cells.find((cell) => !cell.content);
    if (!targetCell) return null;
    return this._getCellScreenRect(targetCell);
  }

  getTutorialPlantCellFocusPoint() {
    const gardenField = this._getOrPickTutorialField("garden");
    const cells = gardenField?.structure?.cells ?? [];
    const targetCell = cells.find((cell) => !cell.content);
    if (targetCell?.position?.clone) return targetCell.position.clone();
    return gardenField?.position?.clone?.() ?? null;
  }

  getTutorialHarvestCellRect(type = "corn") {
    const entity = this.entities.entities.find(
      (entry) => entry.type === type && entry.readyToHarvest && entry.cell?.position
    );
    if (!entity?.cell) return null;
    return this._getCellScreenRect(entity.cell);
  }

  getTutorialHarvestCellFocusPoint(type = "corn") {
    const entity = this.entities.entities.find(
      (entry) => entry.type === type && entry.readyToHarvest && entry.cell?.position
    );
    return entity?.cell?.position?.clone?.() ?? null;
  }

  getTutorialEggHarvestCellRect() {
    const entity = this.entities.entities.find(
      (entry) =>
        entry.kind === "animal" &&
        entry.readyToHarvest &&
        entry.config?.reward?.type === "eggs" &&
        entry.cell?.position
    );
    if (!entity?.cell) return null;
    return this._getCellScreenRect(entity.cell);
  }

  getTutorialEggHarvestCellFocusPoint() {
    const entity = this.entities.entities.find(
      (entry) =>
        entry.kind === "animal" &&
        entry.readyToHarvest &&
        entry.config?.reward?.type === "eggs" &&
        entry.cell?.position
    );
    return entity?.cell?.position?.clone?.() ?? null;
  }

  getTutorialAnimalCellRect() {
    const penField = this._getOrPickTutorialField("pen");
    const cells = penField?.structure?.cells ?? [];
    const targetCell = cells.find((cell) => !cell.content);
    if (!targetCell) return null;
    return this._getCellScreenRect(targetCell);
  }

  getTutorialAnimalCellFocusPoint() {
    const penField = this._getOrPickTutorialField("pen");
    const cells = penField?.structure?.cells ?? [];
    const targetCell = cells.find((cell) => !cell.content);
    if (targetCell?.position?.clone) return targetCell.position.clone();
    return penField?.position?.clone?.() ?? null;
  }

  _getOrPickTutorialField(structureType) {
    const slot = structureType === "garden" ? "gardenField" : "penField";
    const current = this.tutorialTargets[slot];
    if (current && !current.structure) return current;
    if (current?.structure?.type === structureType) return current;

    const occupiedTargets = Object.values(this.tutorialTargets).filter(Boolean);
    let field = this.field.fields.find(
      (entry) => !entry.structure && !occupiedTargets.includes(entry)
    );
    if (!field) {
      field = this.field.fields.find((entry) => !entry.structure);
    }
    if (!field && structureType === "garden") {
      field = this.field.fields.find((entry) => entry.structure?.type === "garden");
    }
    if (!field && structureType === "pen") {
      field = this.field.fields.find((entry) => entry.structure?.type === "pen");
    }

    this.tutorialTargets[slot] = field ?? null;
    return this.tutorialTargets[slot];
  }

  _getFieldScreenRect(field) {
    if (!field?.position || !field?.size) return null;

    const halfX = field.size.x / 2;
    const halfZ = field.size.z / 2;
    const rotation = field.rotationY ?? 0;
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);
    const y = 0;

    const localCorners = [
      new THREE.Vector2(-halfX, -halfZ),
      new THREE.Vector2(halfX, -halfZ),
      new THREE.Vector2(halfX, halfZ),
      new THREE.Vector2(-halfX, halfZ),
    ];

    const worldCorners = localCorners.map((corner) => {
      const x = corner.x * cos - corner.y * sin;
      const z = corner.x * sin + corner.y * cos;
      return new THREE.Vector3(field.position.x + x, y, field.position.z + z);
    });

    return this._getScreenRectFromWorldPoints(worldCorners, { padding: 8, minSize: 72 });
  }

  _getCellScreenRect(cell) {
    if (!cell?.position) return null;

    const half = 1.05;
    const y = cell.position.y + 0.3;
    const worldCorners = [
      new THREE.Vector3(cell.position.x - half, y, cell.position.z - half),
      new THREE.Vector3(cell.position.x + half, y, cell.position.z - half),
      new THREE.Vector3(cell.position.x + half, y, cell.position.z + half),
      new THREE.Vector3(cell.position.x - half, y, cell.position.z + half),
    ];

    return this._getScreenRectFromWorldPoints(worldCorners, { padding: 6, minSize: 56 });
  }

  _getScreenRectFromWorldPoints(points, { padding = 0, minSize = 0 } = {}) {
    const canvasRect = this.renderer?.domElement?.getBoundingClientRect?.();
    if (!canvasRect || !points?.length) return null;

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (const point of points) {
      const cameraSpace = point.clone().applyMatrix4(this.camera.matrixWorldInverse);
      if (cameraSpace.z > -0.05) {
        return null;
      }

      const projected = point.clone().project(this.camera);
      const x = canvasRect.left + (projected.x * 0.5 + 0.5) * canvasRect.width;
      const y = canvasRect.top + (-projected.y * 0.5 + 0.5) * canvasRect.height;

      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }

    if (!Number.isFinite(minX) || !Number.isFinite(minY)) return null;

    let width = Math.max(1, maxX - minX);
    let height = Math.max(1, maxY - minY);
    let left = minX;
    let top = minY;

    if (width < minSize) {
      const expand = (minSize - width) / 2;
      left -= expand;
      width = minSize;
    }

    if (height < minSize) {
      const expand = (minSize - height) / 2;
      top -= expand;
      height = minSize;
    }

    left -= padding;
    top -= padding;
    width += padding * 2;
    height += padding * 2;

    return {
      left,
      top,
      right: left + width,
      bottom: top + height,
      width,
      height,
    };
  }

  focusTutorialCamera(worldPosition) {
    if (!this.controls || !worldPosition) return;

    const controls = this.controls;
    const target = worldPosition.clone
      ? worldPosition.clone()
      : new THREE.Vector3(worldPosition.x ?? 0, worldPosition.y ?? 0, worldPosition.z ?? 0);

    const currentOffset = this.camera.position.clone().sub(controls.target);
    const currentSpherical = new THREE.Spherical().setFromVector3(currentOffset);

    const minPolar = controls.minPolarAngle ?? Math.PI / 4;
    const maxPolar = controls.maxPolarAngle ?? Math.PI / 2;
    const desiredPhi = Math.max(minPolar, Math.min(maxPolar, minPolar + 0.03));
    const desiredRadius = Math.max(
      controls.minDistance ?? currentSpherical.radius,
      Math.min(controls.maxDistance ?? currentSpherical.radius, currentSpherical.radius)
    );

    this._cameraTween?.kill?.();
    controls.enabled = false;

    const tweenState = {
      tx: controls.target.x,
      ty: controls.target.y,
      tz: controls.target.z,
      radius: currentSpherical.radius,
      phi: currentSpherical.phi,
      theta: currentSpherical.theta,
    };

    this._cameraTween = gsap.to(tweenState, {
      tx: target.x,
      ty: Math.max(0, target.y),
      tz: target.z,
      radius: desiredRadius,
      phi: desiredPhi,
      theta: currentSpherical.theta,
      duration: 0.9,
      ease: "power2.out",
      onUpdate: () => {
        controls.target.set(tweenState.tx, tweenState.ty, tweenState.tz);
        const spherical = new THREE.Spherical(
          tweenState.radius,
          tweenState.phi,
          tweenState.theta
        );
        const offset = new THREE.Vector3().setFromSpherical(spherical);
        this.camera.position.copy(controls.target).add(offset);
        this.camera.lookAt(controls.target);
        controls.update();
      },
      onComplete: () => {
        controls.enabled = true;
      },
      onInterrupt: () => {
        controls.enabled = true;
      },
    });
  }
}
