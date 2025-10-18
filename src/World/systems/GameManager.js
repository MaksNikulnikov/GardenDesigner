import * as THREE from "three";
import { GameUI } from "../ui/ui.js";
import { GAME_CONFIG } from "../config/gameConfig.js";
import { FieldManager } from "./FieldManager.js";
import { StructureManager } from "./StructureManager.js";
import { EntityManager } from "./EntityManager.js";
import { TutorialManager } from "./TutorialManager.js";
import { DayNightManager } from "./DayNightManager.js";

export class GameManager {
  constructor(scene, camera, renderer) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;

    this.state = {
      coins: GAME_CONFIG.INITIAL_COINS,
      selectedCategory: null, // "plants" | "animals"
      selectedItem: null, // corn, tomato, chicken...
      buildMode: null, // "garden" | "pen"
    };

    this.clock = new THREE.Clock();
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.updatables = [];

    // --- Managers ---
    this.field = new FieldManager(scene);
    this.structures = new StructureManager(scene, (fx) =>
      this.addUpdatable(fx)
    );
    this.entities = new EntityManager(scene, (obj) => this.addUpdatable(obj));

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

    this.ui.updateCoins(this.state.coins);

    // --- Scene click handling ---
    this._setupSceneClick();

        // --- Tutorial ---
    this.tutorial = new TutorialManager(this.ui, this);

    this.dayNight = new DayNightManager(scene, this.ui);
    this.ui.ready.then(() => {
      this.ui.onDayNightToggle(() => {
        this.dayNight.toggleDayNight();
      });
          this.tutorial.start();
    });

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

  // ========================
  // 🧭 Category selection
  // ========================
  _onCategorySelect(category) {
    this.state.selectedCategory = category;
    this.state.selectedItem = null;
    console.log(`[UI] Selected category: ${category}`);
  }

  _onItemSelect(item) {
    this.state.selectedItem = item;
    console.log(`[UI] Selected item: ${item}`);
  }

  // ========================
  // 🏗️ Build Mode
  // ========================
  _startBuildMode(type) {
    this.state.buildMode = type;
    this.ui.showHint("Tap an empty area to place it");

    console.log(`🏗️ Build mode started: ${type}`);
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
      const point = new THREE.Vector3();
      this.raycaster.ray.intersectPlane(plane, point);

      if (!point) return;
      this._handleClick(point);
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

    console.log(`🏗️ Building structure: ${mode} on field ${field.id}`);

    if (mode === "garden") {
      field.structure = this.structures.createGardenPlot(field);
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

    // Empty cell and selected item → plant/spawn
    if (!cell.content && this.state.selectedItem) {
      this.entities.plantOrSpawn(
        cell,
        this.state.selectedItem,
        this.state,
        this.ui
      );
      return;
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
    this.entities.tick(delta);
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
}
