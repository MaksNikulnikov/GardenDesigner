import { GAME_CONFIG } from "../../config/gameConfig.js";
import { SoundManager, SOUND_KEYS } from "../../audio/SoundManager.js";

export class PlantEntity {
  constructor(scene, cell, type, factory, state, ui) {
    this.id = Math.random().toString(36).slice(2);
    this.scene = scene;
    this.cell = cell;
    this.type = type;
    this.factory = factory;
    this.state = state;
    this.ui = ui;

    const config = GAME_CONFIG.ITEMS[type];
    this.config = config;

    const obj = factory();
    obj.position.copy(cell.position);
    this.scene.add(obj);
    cell.content = obj;

    this.obj = obj;
    this.obj.userData.entityId = this.id;
    this.kind = "plant";
    this.stage = 1;
    this.timer = 0;
    this.nextGrowthIndex = 0;
    this.readyToHarvest = false;
    this.harvested = false;
  }

  tick(delta) {
    if (this.harvested || this.readyToHarvest) return;

    this.timer += delta;
    const currentGrowth =
      this.config.growthTime[this.nextGrowthIndex] ??
      this.config.growthTime.at(-1);

    if (this.timer >= currentGrowth) {
      this.stage++;
      this.timer = 0;
      this.nextGrowthIndex++;
      const max = this.config.growthTime.length;
      if (this.stage > max) this.stage = max;
      if (this.obj.setStage) this.obj.setStage(this.stage);

      if (this.nextGrowthIndex >= this.config.growthTime.length) {
        this.readyToHarvest = true;
      }
    }
  }

  harvest(state, ui) {
    if (!this.readyToHarvest) return;
    SoundManager.instance.playSfx(SOUND_KEYS.HARVEST);
    const reward = this.config.reward;

    if (reward && typeof reward === "object" && reward.type) {
      ui.animateResourceFly?.({
        resourceType: reward.type,
        fromWorldPosition: this.obj.position.clone(),
        count: Math.min(reward.amount ?? 1, 4),
      });
      state[reward.type] = (state[reward.type] ?? 0) + reward.amount;
      const methodName =
        "update" + reward.type.charAt(0).toUpperCase() + reward.type.slice(1);
      ui[methodName]?.(state[reward.type]);
    } else {
      const coins = reward || 0;
      state.coins += coins;
      ui.updateCoins(state.coins);
    }

    this.scene.remove(this.obj);
    this.cell.content = null;
    this.harvested = true;
  }
}
