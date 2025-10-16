import * as THREE from "three";
import { FACTORIES } from "./factories.js";
import { GameUI } from "../ui/ui.js";
import { GAME_CONFIG } from "../config/gameConfig.js";
import { FieldManager } from "./FieldManager.js";
import { StructureManager } from "./StructureManager.js";

export class GameManager {
  constructor(scene, camera, renderer) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;

    this.state = {
      coins: GAME_CONFIG.INITIAL_COINS,
      selectedCategory: null, // "plants" | "animals"
      selectedItem: null, // corn, tomato, cow...
      plantedItems: [],
    };

    this.clock = new THREE.Clock();
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();

    this.field = new FieldManager(scene);
    this.structures = new StructureManager(scene, (effect) =>
      this.addUpdatable(effect)
    );

    for (const field of this.field.fields) {
      const ph = this.structures.createPlaceholder(field);
      field.placeholder = ph.placeholder;
    }

    this.ui = new GameUI({
      onCategorySelect: (category) => this._onCategorySelect(category),
      onItemSelect: (item) => this._onItemSelect(item),
    });

    this._setupSceneClick();
    this.ui.updateCoins(this.state.coins);
    this.updatables = [];
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
    const slot = this._getClickedCell(point);
    if (slot) {
      this._handleCellClick(slot);
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
    if (!this.state.selectedCategory) {
      console.log("Select category first (plants or animals)");
      return;
    }

    if (this.state.selectedCategory === "plants") {
      field.structure = this.structures.createGardenPlot(field);
      this.structures.removePlaceholder(field);
      field.placeholder = null;
      console.log(`🌱 Garden plot placed on ${field.id}`);
    } else if (this.state.selectedCategory === "animals") {
      field.structure = this.structures.createAnimalPen(field);
      this.structures.removePlaceholder(field);
      field.placeholder = null;
      console.log(`🐄 Animal pen placed on ${field.id}`);
    }
  }

  _handleCellClick(cell) {
    if (!cell.content && this.state.selectedItem) {
      this._plant(cell);
      return;
    }
    const planted = this.state.plantedItems.find((p) => p.cell === cell);
    if (planted && planted.readyToHarvest && !planted.harvested) {
      this._harvest(planted);
    }
  }

  _plant(cell) {
    const type = this.state.selectedItem;
    const config = GAME_CONFIG.ITEMS[type];
    if (!config) return;

    if (config.category === "plants") {
      this._plantPlant(cell);
    } else if (config.category === "animals") {
      this._spawnAnimal(cell, type);
    }
  }

  _plantPlant(cell) {
    const type = this.state.selectedItem;
    const factory = FACTORIES[type];
    const config = GAME_CONFIG.ITEMS[type];
    if (!factory || !config) return;

    if (this.state.coins < config.cost) {
      console.warn("Not enough coins!");
      return;
    }

    this.state.coins -= config.cost;
    this.ui.updateCoins(this.state.coins);

    const obj = factory();
    obj.position.copy(cell.position);
    this.scene.add(obj);

    cell.content = obj;

    this.state.plantedItems.push({
      cell,
      type,
      obj,
      stage: 1,
      timer: 0,
      nextGrowthIndex: 0,
      readyToHarvest: false,
      harvested: false,
    });

    console.log(`🌱 Planted ${type} at`, cell.position);
  }

  _spawnAnimal(cell, type) {
    const obj = FACTORIES[type]({
      onLoaded: (group) => {
        this.addUpdatable(group);
      },
    });
    obj.position.copy(cell.position);
    this.scene.add(obj);
    cell.content = obj;
    console.log(`🐔 Spawned animal ${type} at`, cell.position);
  }

  _harvest(item) {
    const config = GAME_CONFIG.ITEMS[item.type];

    this.state.coins += config.reward;
    this.ui.updateCoins(this.state.coins);

    this.scene.remove(item.obj);
    item.cell.content = null;

    this.state.plantedItems = this.state.plantedItems.filter((p) => p !== item);

    console.log(
      `💰 Harvested ${config.displayName}, earned ${config.reward} coins`
    );
  }

  tick(delta) {
    this.state.plantedItems.forEach((item) => {
      if (item.harvested || item.readyToHarvest) return;

      const config = GAME_CONFIG.ITEMS[item.type];
      item.timer += delta;

      const currentGrowthTime =
        config.growthTime[item.nextGrowthIndex] ?? config.growthTime.at(-1);

      if (item.timer >= currentGrowthTime) {
        item.stage++;
        item.timer = 0;
        item.nextGrowthIndex++;

        const maxStage = config.growthTime.length;
        if (item.stage > maxStage) item.stage = maxStage;

        if (item.obj.setStage) item.obj.setStage(item.stage);
        console.log(`🌿 ${item.type} grew to stage ${item.stage}`);

        if (item.nextGrowthIndex >= config.growthTime.length) {
          item.readyToHarvest = true;
          console.log(`✅ ${item.type} is ready to harvest`);
        }
      }
    });

    for (const obj of this.updatables) {
      obj.tick?.(delta);
    }
  }
}
