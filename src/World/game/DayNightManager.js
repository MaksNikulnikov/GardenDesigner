import * as THREE from "three";
import { GAME_CONFIG } from "../config/gameConfig.js";
import { createLights } from "../components/lights.js";

/**
 * Handles smooth color transitions for sky and sunlight
 * based on in-game time.
 */
export class DayNightManager {
  constructor(scene, ui) {
    this.scene = scene;
    this.ui = ui;

    const cfg = GAME_CONFIG;
    this.dayDuration = cfg.DAY_DURATION ?? 120;
    this.timeOfDay = 8 / 24;
    this.isDay = true;

    const { group, ambient, hemi, directional } = createLights();
    this.scene.add(group);

    this.ambient = ambient;
    this.hemi = hemi;
    this.directional = directional;
  }

  tick(delta) {
    const cfg = GAME_CONFIG.DAY_NIGHT;
    const lightCfg = GAME_CONFIG.LIGHT;

    this.timeOfDay = (this.timeOfDay + delta / GAME_CONFIG.DAY_DURATION) % 1;
    const hours = this.timeOfDay * 24;

    const dayColor = new THREE.Color(lightCfg.SUN_COLOR_DAY);
    const nightColor = new THREE.Color(lightCfg.SUN_COLOR_NIGHT);
    const daySky = new THREE.Color(cfg.SKY_DAY);
    const nightSky = new THREE.Color(cfg.SKY_NIGHT);

    let t = 0;

    // --- Sun color transition ---
    if (hours >= cfg.SUNSET_START && hours < cfg.SUNSET_END) {
      t = (hours - cfg.SUNSET_START) / (cfg.SUNSET_END - cfg.SUNSET_START);
      this.directional.color.copy(dayColor).lerp(nightColor, t);
    } else if (hours >= cfg.SUNRISE_START && hours < cfg.SUNRISE_END) {
      t = (hours - cfg.SUNRISE_START) / (cfg.SUNRISE_END - cfg.SUNRISE_START);
      this.directional.color.copy(nightColor).lerp(dayColor, t);
    } else if (hours >= cfg.SUNSET_END || hours < cfg.SUNRISE_START) {
      this.directional.color.copy(nightColor);
    } else {
      this.directional.color.copy(dayColor);
    }

    // --- Sky color transition ---
    if (hours >= cfg.SUNSET_START && hours < cfg.SUNSET_END) {
      this.scene.background = nightSky.clone().lerp(daySky, 1 - t);
    } else if (hours >= cfg.SUNRISE_START && hours < cfg.SUNRISE_END) {
      this.scene.background = daySky.clone().lerp(nightSky, 1 - t);
    } else if (hours >= cfg.SUNRISE_END && hours < cfg.SUNSET_START) {
      this.scene.background = daySky;
    } else {
      this.scene.background = nightSky;
    }

    // --- UI clock ---
    const timeStr = this._formatTime(hours);
    this.ui.updateClock(timeStr);

    const nowIsDay =
      hours >= cfg.SUNRISE_END && hours < cfg.SUNSET_START;
    if (this.isDay !== nowIsDay) {
      this.isDay = nowIsDay;
      this.ui.updateDayNight(this.isDay);
    }
  }

  toggleDayNight() {
    this.timeOfDay = (this.timeOfDay + 0.5) % 1;
    const hours = this.timeOfDay * 24;
    const cfg = GAME_CONFIG.DAY_NIGHT;
    const nowIsDay = hours >= cfg.SUNRISE_END && hours < cfg.SUNSET_START;
    this.isDay = nowIsDay;
    this.ui.updateDayNight(this.isDay);
    this.ui.updateClock(this._formatTime(hours));
  }

  _formatTime(hours) {
    const h = Math.floor(hours);
    const m = Math.floor((hours % 1) * 60);
    const suffix = h >= 12 ? "p.m." : "a.m.";
    const displayH = ((h + 11) % 12) + 1;
    return `${displayH}:${m.toString().padStart(2, "0")} ${suffix}`;
  }
}
