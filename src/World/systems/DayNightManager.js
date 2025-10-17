import * as THREE from "three";
import { GAME_CONFIG } from "../config/gameConfig.js";

export class DayNightManager {
  constructor(scene, ui) {
    this.scene = scene;
    this.ui = ui;

    this.dayDuration = GAME_CONFIG.DAY_DURATION ?? 120;
    this.timeOfDay = 8 / 24;
    this.isDay = true;

    this.ambient = new THREE.AmbientLight(0xffffff, 0.7);
    this.directional = new THREE.DirectionalLight(0xffffff, 0.9);
    this.directional.position.set(5, 10, 5);
    scene.add(this.ambient, this.directional);

    this.ui.onDayNightToggle(() => this.toggleDayNight());
  }

  tick(delta) {

    this.timeOfDay = (this.timeOfDay + delta / this.dayDuration) % 1;

    const hours = this.timeOfDay * 24;
    const sunHeight = this._sunCurve(hours);


    const intensity = THREE.MathUtils.clamp((sunHeight + 1) / 2, 0.15, 1);
    this.ambient.intensity = intensity * 0.6;
    this.directional.intensity = intensity * 0.8;
    this.directional.position.set(
      Math.cos(hours / 24 * Math.PI * 2) * 10,
      sunHeight * 10,
      Math.sin(hours / 24 * Math.PI * 2) * 10
    );

    const color = new THREE.Color();
    if (sunHeight > 0) color.setHSL(0.12, 0.4, 0.8);
    else color.setHSL(0.6, 0.4, 0.2);
    this.scene.background = color;

    const timeStr = this._formatTime(hours);
    this.ui.updateClock(timeStr);

    const nowIsDay = hours >= 8 && hours < 20;
    if (this.isDay !== nowIsDay) {
      this.isDay = nowIsDay;
      this.ui.updateDayNight(this.isDay);
    }
  }

  toggleDayNight() {
    this.timeOfDay = (this.timeOfDay + 0.5) % 1;
    const hours = this.timeOfDay * 24;
    const nowIsDay = hours >= 8 && hours < 20;
    this.isDay = nowIsDay;
    this.ui.updateDayNight(this.isDay);
    const timeStr = this._formatTime(hours);
    this.ui.updateClock(timeStr);
  }

  _sunCurve(hours) {
    if (hours < 8 || hours > 20) return -0.4;
    const t = (hours - 8) / 12;
    return Math.sin(t * Math.PI);
  }

  _formatTime(hours) {
    const h = Math.floor(hours);
    const m = Math.floor((hours % 1) * 60);
    const suffix = h >= 12 ? "p.m." : "a.m.";
    const displayH = ((h + 11) % 12) + 1;
    return `${displayH}:${m.toString().padStart(2, "0")} ${suffix}`;
  }
}
