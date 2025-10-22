import * as THREE from "three";
import { gsap } from "gsap";
import { createSmokeEffect } from "../../effects/createSmokeEffect.js";
import { GAME_CONFIG } from "../../config/gameConfig.js";
import { cameraHelper } from "../../helpers/CameraHelper.js";
import { SoundManager, SOUND_KEYS } from "../../audio/SoundManager.js";

export class AnimalEntity {
  constructor(scene, cell, type, factory, addUpdatable, ui, state) {
    this.id = Math.random().toString(36).slice(2);
    this.scene = scene;
    this.cell = cell;
    this.type = type;
    this.factory = factory;
    this.addUpdatable = addUpdatable;
    this.ui = ui;
    this.state = state;

    const config = GAME_CONFIG.ITEMS[type];
    this.config = config;

    const obj = factory({
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

    this.obj = obj;
    this.obj.userData.entityId = this.id;
    this.kind = "animal";
    this.stored = 0;
    this.producing = true;
    this.productionCooldown = 0;
    this.readyToHarvest = false;

    const headPos = obj.position.clone().add(new THREE.Vector3(0, 1.6, 0));
    const { x, y } = cameraHelper.worldToScreen(headPos);
    ui.createAnimalCounter(this.id, type);
    ui.updateAnimalCounter(this.id, 0, x, y);
  }

  tick(delta, state, ui) {
    if (!this.config.productionTime) return;

    if (this.stored >= 1) this.readyToHarvest = true;
    if (this.stored >= (this.config.maxStorage ?? 3)) this.producing = false;

    if (this.producing) {
      this.productionCooldown += delta;

      if (this.productionCooldown >= this.config.productionTime) {
        this.productionCooldown = 0;
        const feedType = this.config.feedType ?? "corn";
        const feedNeeded = this.config.feedPerEgg ?? 2;

        if ((state[feedType] ?? 0) >= feedNeeded) {
          state[feedType] -= feedNeeded;
          const feedUpdate =
            "update" + feedType.charAt(0).toUpperCase() + feedType.slice(1);
          ui[feedUpdate]?.(state[feedType]);

          this.stored++;
          if (this.stored >= (this.config.maxStorage ?? 3))
            this.producing = false;
        } else {
          this.producing = false;
        }
      }
    }

    const headPos = this.obj.position.clone().add(new THREE.Vector3(0, 1.6, 0));
    const { x, y } = cameraHelper.worldToScreen(headPos);
    ui.updateAnimalCounter(this.id, this.stored, x, y);
  }

  harvest(state, ui) {
    if (!this.stored || this.stored <= 0) return;
    SoundManager.instance.playSfx(SOUND_KEYS.HARVEST);

    const reward = this.config.reward;
    if (reward && typeof reward === "object" && reward.type) {
      const total = reward.amount * this.stored;
      state[reward.type] = (state[reward.type] ?? 0) + total;
      const methodName =
        "update" + reward.type.charAt(0).toUpperCase() + reward.type.slice(1);
      ui[methodName]?.(state[reward.type]);
    }

    this.stored = 0;
    this.producing = true;
    this.readyToHarvest = false;

    const headPos = this.obj.position.clone().add(new THREE.Vector3(0, 0.6, 0));
    const { x, y } = cameraHelper.worldToScreen(headPos);
    ui.updateAnimalCounter(this.id, 0, x, y);
  }
}
