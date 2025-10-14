import * as THREE from "three";
import { FACTORIES } from "./factories.js";
import { GameUI } from "../ui/ui.js";
import { GAME_CONFIG } from "../config/gameConfig.js";
import { FieldManager } from "./FieldManager.js";

export class GameManager {
  constructor(scene, camera, renderer) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;

    this.state = {
      coins: GAME_CONFIG.INITIAL_COINS,
      selectedCategory: null,
      selectedItem: null,
      plantedItems: [],
    };

    this.clock = new THREE.Clock();
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();

    this.field = new FieldManager(scene);

    this.ui = new GameUI({
      onCategorySelect: (category) => this._onCategorySelect(category),
      onItemSelect: (item) => this._onItemSelect(item),
    });

    this._setupSceneClick();
    this.ui.updateCoins(this.state.coins);
  }

  _onCategorySelect(category) {
    this.state.selectedCategory = category;
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

      const intersectionPoint = new THREE.Vector3();
      this.raycaster.ray.intersectPlane(plane, intersectionPoint);

      if (!intersectionPoint) return;

      this._handleClickOnGround(intersectionPoint);
    });
  }

  _handleClickOnGround(point) {
    const slot = this.field.getSlotFromWorldPosition(point);
    console.log("slot", slot);
    if (!slot) return;

    if (slot.content) {
      const planted = this.state.plantedItems.find((p) => p.slot === slot);
      if (planted && planted.readyToHarvest && !planted.harvested) {
        this._harvest(slot, GAME_CONFIG.ITEMS[planted.type]);
        planted.harvested = true;
      }
      return;
    }

    if (!this.state.selectedItem) return;
    const type = this.state.selectedItem;
    const factory = FACTORIES[type];
    const config = GAME_CONFIG.ITEMS[type];

    if (!factory || !config) return;
    if (config.category !== slot.type) return;

    this._plant(slot, type, factory, config);
  }

  _plant(slot, type, factory, config) {
    if (this.state.coins < config.cost) {
      console.warn("Not enough coins to plant!");
      return;
    }

    this.state.coins -= config.cost;
    this.ui.updateCoins(this.state.coins);

    const obj = factory();
    this.field.plant(slot, obj);

    this.state.plantedItems.push({
      slot,
      type,
      obj,
      stage: 1,
      timer: 0,
      nextGrowthIndex: 0,
      readyToHarvest: false,
      harvested: false,
    });
  }

 
  _harvest(slot, config) {
    this.state.coins += config.reward;
    this.ui.updateCoins(this.state.coins);
    this.field.harvest(slot);
    this.state.plantedItems = this.state.plantedItems.filter(
      (item) => item.slot !== slot
    );
  }

  tick(delta) {
    this.state.plantedItems.forEach((item) => {
      if (item.harvested) return;

      const config = GAME_CONFIG.ITEMS[item.type];

      if (item.readyToHarvest) return;

      item.timer += delta;

      const currentGrowthTime =
        config.growthTime[item.nextGrowthIndex] ?? config.growthTime.at(-1);

      if (item.timer >= currentGrowthTime) {
        item.stage++;
        item.timer = 0;
        item.nextGrowthIndex++

        const maxStage = config.growthTime.length;
        if (item.stage > maxStage) item.stage = maxStage;
        if (item.obj.setStage) item.obj.setStage(item.stage);
        if (item.nextGrowthIndex >= config.growthTime.length) {
          item.readyToHarvest = true;
        }
      }
    });
  }
}
