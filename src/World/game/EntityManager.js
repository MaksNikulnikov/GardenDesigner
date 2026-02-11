import { SoundManager, SOUND_KEYS } from "../audio/SoundManager.js";
import { AnimalEntity } from "../components/entities/AnimalEntity.js";
import { PlantEntity } from "../components/entities/PlantEntity.js";
import { FACTORIES } from "../components/gameObjects/factories.js";
import { GAME_CONFIG } from "../config/gameConfig.js";

export class EntityManager {
  constructor(scene, addUpdatable, removeUpdatable, camera) {
    this.scene = scene;
    this.addUpdatable = addUpdatable;
    this.removeUpdatable = removeUpdatable;
    this.camera = camera;
    this.entities = [];
    this.isHarvestAllowed = false;
  }

  getEntityByCell(cell) {
    return this.entities.find((e) => e.cell === cell);
  }

  plantOrSpawn(cell, type, state, ui) {
    const config = GAME_CONFIG.ITEMS[type];
    if (!config) return;

    if (config.category === "plants" && cell.type === "plants") {
      const entity = new PlantEntity(
        this.scene,
        cell,
        type,
        FACTORIES[type],
        state,
        ui
      );
      SoundManager.instance.playSfx(SOUND_KEYS.PLACE);
      this.entities.push(entity);
    } else if (config.category === "animals" && cell.type === "animals") {
      const entity = new AnimalEntity(
        this.scene,
        cell,
        type,
        FACTORIES[type],
        this.addUpdatable,
        this.removeUpdatable,
        ui,
        state
      );
      SoundManager.instance.playSfx(SOUND_KEYS.PLACE_CHICKEN);
      this.entities.push(entity);
    } else {
      ui.showHint("You can't place anything here.");
      setTimeout(() => ui.hideHint(), 2500);
    }
  }

  areAllCropsReady(type = "corn") {
    const crops = this.entities.filter(
      (entity) => entity.kind === "plant" && entity.type === type
    );
    if (crops.length === 0) return false;
    return crops.every((e) => e.readyToHarvest);
  }

  allowHarvest() {
    this.isHarvestAllowed = true;
  }

  disallowHarvest() {
    this.isHarvestAllowed = false;
  }

  harvest(entity, state, ui) {
    if (!this.isHarvestAllowed || !entity) return;

    entity.harvest(state, ui);
    if (entity.kind === "plant" && entity.harvested) {
      this.entities = this.entities.filter((e) => e !== entity);
      entity.dispose?.();
    }
  }

  tick(delta, state, ui) {
    for (const entity of this.entities) {
      entity.tick?.(delta, state, ui);
    }
  }

  hasActiveGrowth() {
    return this.entities.some((entity) => {
      if (!entity) return false;

      if (entity.kind === "plant") {
        return !entity.readyToHarvest && !entity.harvested;
      }

      if (entity.kind === "animal") {
        const maxStorage = entity.config?.maxStorage ?? 3;
        return !!entity.producing && (entity.stored ?? 0) < maxStorage;
      }

      return false;
    });
  }

  dispose() {
    for (const entity of this.entities) {
      entity.dispose?.();
    }
    this.entities = [];
  }
}
