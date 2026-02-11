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
      selectedCategory: null, // "plants" | "animals"
      selectedItem: null, // corn, tomato, chicken...
      buildMode: null, // "garden" | "pen"
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
    // --- Managers ---
    this.field = new FieldManager(scene);
    this.structures = new StructureManager(scene, (fx) =>
      this.addUpdatable(fx)
    );
    this.entities = new EntityManager(
      scene,
      (obj) => this.addUpdatable(obj),
      this.camera
    );

    // --- Create placeholders ---
    for (const field of this.field.fields) {
      const ph = this.structures.createPlaceholder(field);
      field.placeholder = ph.placeholder;
    }

    // --- UI ---
    this.ui = new GameUI({
      onBuildModeSelect: (type) => this._startBuildMode(type),
      onCategorySelect: (category) => this._onCategorySelect(category),
      onItemSelect: (item) => this._onItemSelect(item),
    });

    // --- Scene click handling ---
    this._setupSceneClick();

    // --- Tutorial ---
    this.tutorial = new TutorialManager(this.ui, this);

    this.dayNight = new DayNightManager(scene, this.ui);

    // --- Audio ---
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

  // ========================
  // 🔊 Audio
  // ========================
  _initAudio() {
    const sound = SoundManager.instance;

    // ждём первый клик
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

  // ========================
  // 🔁 Generic update hooks
  // ========================
  addUpdatable(obj) {
    if (obj && typeof obj.tick === "function") this.updatables.push(obj);
  }

  removeUpdatable(obj) {
    this.updatables = this.updatables.filter((o) => o !== obj);
  }

  clearSelectedItem() {
    this.state.selectedItem = null;
  }

  // ========================
  // 🧭 Category selection
  // ========================
  _onCategorySelect(category) {
    this.state.selectedCategory = category;
    this.state.selectedItem = null;
  }

  _onItemSelect(item) {
    this.state.selectedItem = item;
  }

  // ========================
  // 🏗️ Build Mode
  // ========================
  _startBuildMode(type) {
    this.state.buildMode = type;
  }

  // ========================
  // 🖱️ Click handling
  // ========================
  _setupSceneClick() {
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

    this.renderer.domElement.addEventListener("pointerdown", (event) => {
      const rect = this.renderer.domElement.getBoundingClientRect();
      this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.pointer, this.camera);

      // 🟢 click on any entity (plants / animals)
      const allMeshes = [];
      for (const e of this.entities.entities) {
        e.obj.traverse((child) => {
          if (child.isMesh) allMeshes.push(child);
        });
      }

      const hits = this.raycaster.intersectObjects(allMeshes, true);
      if (hits.length > 0) {
        let hit = hits[0].object;
        let foundId = null;

        while (hit && !foundId) {
          if (hit.userData?.entityId) foundId = hit.userData.entityId;
          hit = hit.parent;
        }

        if (foundId) {
          const entity = this.entities.entities.find((e) => e.id === foundId);
          if (entity) {
            this.entities.harvest(entity, this.state, this.ui);
            return;
          }
        }
      }

      // 🟡 fallback: click on field
      const point = new THREE.Vector3();
      this.raycaster.ray.intersectPlane(plane, point);
      if (!point) return;
      this._handleClick(point);
    });

    // 🟣 click on UI counters
    document.addEventListener("click", (e) => {
      const target = e.target;
      if (!target) return;
      // @ts-ignore
      const el = target.closest("[data-animal-id]");
      if (!el) return;
      const id = el.dataset.animalId;
      const entity = this.entities.entities.find((e) => e.id === id);
      if (entity) {
        this.entities.harvest(entity, this.state, this.ui);
        SoundManager.instance.playSfx(SOUND_KEYS.HARVEST);
      }
    });
  }

  _handleClick(point) {
    // 1️⃣ Check if a cell was clicked
    const cell = this._getClickedCell(point);
    if (cell) {
      this._handleCellClick(cell);
      return;
    }

    // 2️⃣ Check if building mode is active
    if (this.state.buildMode) {
      const field = this.field.getFieldByPosition(point);
      if (!field || field.structure) return;
      this._buildStructure(field);
      return;
    }
  }

  _getClickedCell(point) {
    for (const field of this.field.fields) {
      const structure = field.structure;
      if (!structure) continue;

      for (const cell of structure.cells) {
        const dist = cell.position.distanceTo(point);
        if (dist < 1) return cell;
      }
    }
    return null;
  }

  // ========================
  // 🏡 Build logic
  // ========================
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
  }

  // ========================
  // 🌿 / 🐔 Gameplay actions
  // ========================
  _handleCellClick(cell) {
    const item = this.entities.getEntityByCell(cell);

    if (!cell.content && this.state.selectedItem && cell.type === "plants") {
      this.entities.plantOrSpawn(
        cell,
        this.state.selectedItem,
        this.state,
        this.ui
      );
      return;
    }

    if (this.state.selectedItem && cell.type === "animals") {
      if (!cell.content) {
        this.entities.plantOrSpawn(
          cell,
          this.state.selectedItem,
          this.state,
          this.ui
        );
        return;
      } else {
        const emptyCellOnTheSameField = cell.field.structure.cells.find(
          (cell) => !cell.content
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
    }

    // Harvest ready crops
    if (item && item.readyToHarvest) {
      this.entities.harvest(item, this.state, this.ui);
    }
  }

  // ========================
  // ⏱️ Game Loop
  // ========================
  tick(delta) {
    this.entities.tick(delta, this.state, this.ui);
    this.dayNight.tick(delta);
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
      (f) => !f.structure && !occupiedTargets.includes(f)
    );
    if (!field) {
      field = this.field.fields.find((f) => !f.structure);
    }
    if (!field && structureType === "garden") {
      field = this.field.fields.find((f) => f.structure?.type === "garden");
    }
    if (!field && structureType === "pen") {
      field = this.field.fields.find((f) => f.structure?.type === "pen");
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
    // Build click detection works on the world plane y=0, so spotlight rect
    // must be projected from the same plane to match the real click zone.
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
