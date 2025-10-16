import * as THREE from "three";
import { gsap } from "gsap";

import { GAME_CONFIG } from "../config/gameConfig.js";
import { createSmokeEffect } from "../effects/createSmokeEffect.js";
import { FACTORIES } from "./factories.js";

export class EntityManager {
  constructor(scene, addUpdatable) {
    this.scene = scene;
    this.addUpdatable = addUpdatable;
    this.entities = [];
  }

  getEntityByCell(cell) {
    return this.entities.find((e) => e.cell === cell);
  }

  plantOrSpawn(cell, type, state, ui) {
    const config = GAME_CONFIG.ITEMS[type];
    if (!config) return;

    if (config.category === "plants") this._plant(cell, type, state, ui);
    else if (config.category === "animals") this._spawnAnimal(cell, type);
  }

  _plant(cell, type, state, ui) {
    const factory = FACTORIES[type];
    const config = GAME_CONFIG.ITEMS[type];
    if (!factory || !config) return;

    if (state.coins < config.cost) {
      console.warn("Not enough coins!");
      return;
    }

    state.coins -= config.cost;
    ui.updateCoins(state.coins);

    const obj = factory();
    obj.position.copy(cell.position);
    this.scene.add(obj);
    cell.content = obj;

    const plant = {
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

  _spawnAnimal(cell, type) {
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

    this.entities.push({ kind: "animal", type, obj, cell });
  }

  harvest(entity, state, ui) {
    const config = GAME_CONFIG.ITEMS[entity.type];
    state.coins += config.reward;
    ui.updateCoins(state.coins);

    this.scene.remove(entity.obj);
    entity.cell.content = null;
    this.entities = this.entities.filter((e) => e !== entity);
  }

  tick(delta) {
    for (const e of this.entities) {
      if (e.kind !== "plant" || e.harvested || e.readyToHarvest) continue;

      const config = GAME_CONFIG.ITEMS[e.type];
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
  }
}
