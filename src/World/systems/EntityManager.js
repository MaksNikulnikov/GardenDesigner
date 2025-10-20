import * as THREE from "three";
import { gsap } from "gsap";

import { GAME_CONFIG } from "../config/gameConfig.js";
import { createSmokeEffect } from "../effects/createSmokeEffect.js";
import { FACTORIES } from "./factories.js";

export class EntityManager {
  constructor(scene, addUpdatable, camera) {
    this.scene = scene;
    this.addUpdatable = addUpdatable;
    this.camera = camera;
    this.entities = [];
    this.isHarvestAllowed = false;
  }

  // ───────────────────────────────────────────────
  // Helpers
  // ───────────────────────────────────────────────
  _screenXY(worldPos) {
    if (!this.camera) return { x: -9999, y: -9999 };
    const v = worldPos.clone().project(this.camera);
    return {
      x: (v.x * 0.5 + 0.5) * window.innerWidth,
      y: (-v.y * 0.5 + 0.5) * window.innerHeight,
    };
  }

  getEntityByCell(cell) {
    return this.entities.find((e) => e.cell === cell);
  }

  // ───────────────────────────────────────────────
  // Plant / Animal entry
  // ───────────────────────────────────────────────
  plantOrSpawn(cell, type, state, ui) {
    const config = GAME_CONFIG.ITEMS[type];
    if (!config) return;

    if (config.category === "plants" && cell.type === "plants") {
      this._plant(cell, type, state, ui);
    } else if (config.category === "animals" && cell.type === "animals") {
      this._spawnAnimal(cell, type, ui);
    } else {
      if (cell.type === "plants") {
        ui.showHint("You can grow only plants here!", "plants");
      } else if (cell.type === "animals") {
        ui.showHint("You can raise only animals here!", "animals");
      } else {
        ui.showHint("You can't place anything here.");
      }
      setTimeout(() => ui.hideHint(), 2500);
    }
  }

  // ───────────────────────────────────────────────
  // Plants
  // ───────────────────────────────────────────────
  _plant(cell, type, state, ui) {
    const factory = FACTORIES[type];
    const config = GAME_CONFIG.ITEMS[type];
    if (!factory || !config) return;

    if (state.coins < config.cost) {
      ui.showHint("Oh no! You didn't have enough coins!", "money");
      return;
    }

    state.coins -= config.cost;
    ui.updateCoins(state.coins);

    const obj = factory();
    obj.position.copy(cell.position);
    this.scene.add(obj);
    cell.content = obj;

    const plant = {
      id: Math.random().toString(36).slice(2),
      kind: "plant",
      type,
      obj,
      cell,
      stage: 1,
      timer: 0,
      nextGrowthIndex: 0,
      readyToHarvest: false,
      harvested: false,
    };

    this.entities.push(plant);
  }

  _tickPlant(e, config, delta) {
    if (e.harvested || e.readyToHarvest) return;

    e.timer += delta;
    const currentGrowth =
      config.growthTime[e.nextGrowthIndex] ?? config.growthTime.at(-1);

    if (e.timer >= currentGrowth) {
      e.stage++;
      e.timer = 0;
      e.nextGrowthIndex++;
      const max = config.growthTime.length;
      if (e.stage > max) e.stage = max;
      if (e.obj.setStage) e.obj.setStage(e.stage);

      if (e.nextGrowthIndex >= config.growthTime.length) {
        e.readyToHarvest = true;
      }
    }
  }

  areAllCropsReady(type = "corn") {
    const crops = this.entities.filter(
      (e) => e.kind === "plant" && e.type === type
    );
    if (crops.length === 0) return false;
    return crops.every((e) => e.readyToHarvest);
  }

  // ───────────────────────────────────────────────
  // Animals
  // ───────────────────────────────────────────────
  _spawnAnimal(cell, type, ui) {
    const obj = FACTORIES[type]({
      onLoaded: (group) => {
        this.addUpdatable(group);
        group.rotation.y += THREE.MathUtils.degToRad(
          THREE.MathUtils.randFloat(-180, 180)
        );
        group.scale.set(0.001, 0.001, 0.001);

        const smoke = createSmokeEffect(this.scene, cell.position, {
          duration: 0.8,
          size: 4,
          spread: 2,
        });
        this.addUpdatable(smoke);

        const delay = Math.random() * 0.3;
        gsap.delayedCall(delay, () => {
          gsap.to(group.scale, {
            x: 1,
            y: 1,
            z: 1,
            duration: 0.6,
            ease: "back.out(2)",
          });
          gsap.fromTo(
            group.position,
            { y: group.position.y - 0.5 },
            { y: group.position.y, duration: 0.5, ease: "power2.out" }
          );
        });
      },
    });

    obj.position.copy(cell.position);
    this.scene.add(obj);
    cell.content = obj;

    const animal = {
      id: Math.random().toString(36).slice(2),
      kind: "animal",
      type,
      obj,
      cell,
      stored: 0,
      producing: true,
      productionCooldown: 0,
    };

    this.entities.push(animal);

    const headPos = obj.position.clone().add(new THREE.Vector3(0, 1.6, 0));
    const { x, y } = this._screenXY(headPos);
    ui.createAnimalCounter(animal.id, type);
    ui.updateAnimalCounter(animal.id, 0, x, y);
  }

  _tickAnimal(e, config, delta, state, ui) {
    if (!config.productionTime) return;

    if (e.stored>=1) e.readyToHarvest = true

    if (e.stored >= (config.maxStorage ?? 3)) {
      e.producing = false;
    }

    if (e.producing) {
      e.productionCooldown += delta;

      if (e.productionCooldown >= config.productionTime) {
        e.productionCooldown = 0;

        const feedType = config.feedType ?? "corn";
        const feedNeeded = config.feedPerEgg ?? 2;

        if ((state[feedType] ?? 0) >= feedNeeded) {
          state[feedType] -= feedNeeded;
          const feedUpdate =
            "update" + feedType.charAt(0).toUpperCase() + feedType.slice(1);
          if (ui[feedUpdate]) ui[feedUpdate](state[feedType]);

          e.stored++;
          if (e.stored >= (config.maxStorage ?? 3)) e.producing = false;
        } else {
          e.producing = false;
        }
      }
    }
    const headPos = e.obj.position.clone().add(new THREE.Vector3(0, 1.6, 0));
    const { x, y } = this._screenXY(headPos);
    ui.updateAnimalCounter(e.id, e.stored, x, y);
  }

  // ───────────────────────────────────────────────
  // Harvest
  // ───────────────────────────────────────────────
  allowHarvest() {
    this.isHarvestAllowed = true;
  }

  harvest(entity, state, ui) {
    if (!this.isHarvestAllowed || !entity) return

    const config = GAME_CONFIG.ITEMS[entity.type];
    if (!config) return;

    if (entity.kind === "animal") {
      if (!entity.stored || entity.stored <= 0)     return;

      const reward = config.reward;
      if (reward && typeof reward === "object" && reward.type) {
        const total = reward.amount * entity.stored;
        state[reward.type] = (state[reward.type] ?? 0) + total;

        const methodName =
          "update" + reward.type.charAt(0).toUpperCase() + reward.type.slice(1);
        if (ui[methodName]) {
          ui[methodName](state[reward.type]);
        } else {
          console.warn(`UI method ${methodName} not found`);
        }
      } else {
        console.warn("Invalid reward for animal", reward);
      }

      entity.stored = 0;
      entity.producing = true;

      const headPos = entity.obj.position
        .clone()
        .add(new THREE.Vector3(0, 0.6, 0));
      const { x, y } = this._screenXY(headPos);
      ui.updateAnimalCounter(entity.id, 0, x, y);
      return;
    }

    if (entity.kind === "plant" && entity.readyToHarvest) {

      const reward = config.reward;

      if (reward && typeof reward === "object" && reward.type) {
        state[reward.type] = (state[reward.type] ?? 0) + reward.amount;
        const methodName =
          "update" + reward.type.charAt(0).toUpperCase() + reward.type.slice(1);
        if (ui[methodName]) {
          ui[methodName](state[reward.type]);
        }
      } else {
        const coins = reward || 0;
        state.coins += coins;
        ui.updateCoins(state.coins);
      }

      this.scene.remove(entity.obj);
      entity.cell.content = null;
      this.entities = this.entities.filter((e) => e !== entity);
    }
  }

  // ───────────────────────────────────────────────
  // Tick
  // ───────────────────────────────────────────────
  tick(delta, state, ui) {
    for (const e of this.entities) {
      const config = GAME_CONFIG.ITEMS[e.type];
      if (!config) continue;

      if (e.kind === "plant") {
        this._tickPlant(e, config, delta);
      } else if (e.kind === "animal") {
        this._tickAnimal(e, config, delta, state, ui);
      }
    }
  }
}
