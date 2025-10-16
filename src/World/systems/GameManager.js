import * as THREE from "three";
import { GameUI } from "../ui/ui.js";
import { GAME_CONFIG } from "../config/gameConfig.js";
import { FieldManager } from "./FieldManager.js";
import { StructureManager } from "./StructureManager.js";
import { EntityManager } from "./EntityManager.js";

export class GameManager {
  constructor(scene, camera, renderer) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;

    this.state = {
      coins: GAME_CONFIG.INITIAL_COINS,
      selectedCategory: null, // "plants" | "animals"
      selectedItem: null, // corn, tomato, cow...
    };

    this.clock = new THREE.Clock();
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();

    // --- Managers ---
    this.field = new FieldManager(scene);
    this.structures = new StructureManager(scene, (effect) => this.addUpdatable(effect));
    this.entities = new EntityManager(scene, (obj) => this.addUpdatable(obj));

    // --- Create placeholders ---
    for (const field of this.field.fields) {
      const ph = this.structures.createPlaceholder(field);
      field.placeholder = ph.placeholder;
    }

    // --- UI ---
    this.ui = new GameUI({
      onCategorySelect: (category) => this._onCategorySelect(category),
      onItemSelect: (item) => this._onItemSelect(item),
    });
    this.ui.updateCoins(this.state.coins);

    this.updatables = [];
    this._setupSceneClick();
  }

  addUpdatable(obj) {
    if (obj && typeof obj.tick === "function") {
      this.updatables.push(obj);
    }
  }

  removeUpdatable(obj) {
    this.updatables = this.updatables.filter((o) => o !== obj);
  }

  _onCategorySelect(category) {
    this.state.selectedCategory = category;
    this.state.selectedItem = null;
  }

  _onItemSelect(item) {
    this.state.selectedItem = item;
    console.log(`Selected item: ${item}`);
  }

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
    const cell = this._getClickedCell(point);
    if (cell) {
      this._handleCellClick(cell);
      return;
    }

    const field = this.field.getFieldByPosition(point);
    if (!field) return;

    if (!field.structure) {
      this._buildStructure(field);
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

  _buildStructure(field) {
    const cat = this.state.selectedCategory;
    if (!cat) return console.log("Select category first");

    if (cat === "plants") {
      field.structure = this.structures.createGardenPlot(field);
    } else if (cat === "animals") {
      field.structure = this.structures.createAnimalPen(field);
    }

    this.structures.removePlaceholder(field);
    field.placeholder = null;
  }

  _handleCellClick(cell) {
    const item = this.entities.getEntityByCell(cell);

    if (!cell.content && this.state.selectedItem) {
      this.entities.plantOrSpawn(cell, this.state.selectedItem, this.state, this.ui);
      return;
    }

    if (item && item.readyToHarvest) {
      this.entities.harvest(item, this.state, this.ui);
    }
  }

  tick(delta) {
    this.entities.tick(delta);
    for (const obj of this.updatables) obj.tick?.(delta);
  }
}
