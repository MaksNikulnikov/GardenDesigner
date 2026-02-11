import * as THREE from "three";
import { gsap } from "gsap";
import { createSmokeEffect } from "../../effects/createSmokeEffect.js";
import { GAME_CONFIG } from "../../config/gameConfig.js";
import { cameraHelper } from "../../helpers/CameraHelper.js";
import { SoundManager, SOUND_KEYS } from "../../audio/SoundManager.js";

function disposeObject3D(root) {
  root?.traverse?.((node) => {
    if (!node?.isMesh) return;
    node.geometry?.dispose?.();
    if (Array.isArray(node.material)) {
      node.material.forEach((mat) => mat?.dispose?.());
    } else {
      node.material?.dispose?.();
    }
  });
}

const HEAD_OFFSET = new THREE.Vector3(0, 1.6, 0);
const HARVEST_HEAD_OFFSET = new THREE.Vector3(0, 0.6, 0);
const FLY_OFFSET = new THREE.Vector3(0, 0.8, 0);

export class AnimalEntity {
  constructor(scene, cell, type, factory, addUpdatable, removeUpdatable, ui, state) {
    this.id = Math.random().toString(36).slice(2);
    this.scene = scene;
    this.cell = cell;
    this.type = type;
    this.factory = factory;
    this.addUpdatable = addUpdatable;
    this.removeUpdatable = removeUpdatable;
    this.ui = ui;
    this.state = state;
    this._spawnTween = null;
    this._modelGroup = null;
    this._tmpWorldPos = new THREE.Vector3();
    this._tmpScreenPos = { x: 0, y: 0 };

    const config = GAME_CONFIG.ITEMS[type];
    this.config = config;

    const obj = factory({
      onLoaded: (group) => {
        this.addUpdatable(group);
        this._modelGroup = group;
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
        this._spawnTween = gsap.delayedCall(delay, () => {
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

    ui.createAnimalCounter(this.id, type);
    this._updateCounter(ui, 0, HEAD_OFFSET);
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
          if (this.stored >= (this.config.maxStorage ?? 3)) this.producing = false;
        } else {
          this.producing = false;
        }
      }
    }

    this._updateCounter(ui, this.stored, HEAD_OFFSET);
  }

  harvest(state, ui) {
    if (!this.stored || this.stored <= 0) return;
    SoundManager.instance.playSfx(SOUND_KEYS.HARVEST);

    const reward = this.config.reward;
    if (reward && typeof reward === "object" && reward.type) {
      const total = reward.amount * this.stored;
      const flyStart = this._tmpWorldPos.copy(this.obj.position).add(FLY_OFFSET);
      ui.animateResourceFly?.({
        resourceType: reward.type,
        fromWorldPosition: flyStart,
        count: Math.min(total, 4),
      });
      state[reward.type] = (state[reward.type] ?? 0) + total;
      const methodName =
        "update" + reward.type.charAt(0).toUpperCase() + reward.type.slice(1);
      ui[methodName]?.(state[reward.type]);
    }

    this.stored = 0;
    this.producing = true;
    this.readyToHarvest = false;

    this._updateCounter(ui, 0, HARVEST_HEAD_OFFSET);
  }

  _updateCounter(ui, value, offset) {
    this._tmpWorldPos.copy(this.obj.position).add(offset);
    const screen = cameraHelper.worldToScreen(this._tmpWorldPos, this._tmpScreenPos);
    ui.updateAnimalCounter(this.id, value, screen.x, screen.y);
  }

  dispose() {
    this._spawnTween?.kill?.();
    this._spawnTween = null;

    if (this._modelGroup) {
      gsap.killTweensOf(this._modelGroup.scale);
      gsap.killTweensOf(this._modelGroup.position);
      this.removeUpdatable?.(this._modelGroup);
      this._modelGroup = null;
    }

    this.ui.removeAnimalCounter?.(this.id);

    this.scene.remove(this.obj);
    if (this.cell?.content === this.obj) {
      this.cell.content = null;
    }
    disposeObject3D(this.obj);
  }
}
