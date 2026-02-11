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

    const config = GAME_CONFIG;
    this.dayDuration = config.DAY_DURATION ?? 120;
    this.timeOfDay = 8 / 24;
    this.isDay = true;

    const { group, ambient, hemi, directional } = createLights();
    this.scene.add(group);
    this.lightGroup = group;

    this.ambient = ambient;
    this.hemi = hemi;
    this.directional = directional;

    const dayNightConfig = GAME_CONFIG.DAY_NIGHT;
    this._sunColorDay = new THREE.Color(GAME_CONFIG.LIGHT.SUN_COLOR_DAY);
    this._sunColorNight = new THREE.Color(GAME_CONFIG.LIGHT.SUN_COLOR_NIGHT);
    this._skyDay = new THREE.Color(dayNightConfig.SKY_DAY);
    this._skyNight = new THREE.Color(dayNightConfig.SKY_NIGHT);
    this._skyColor = this._skyDay.clone();
    this.scene.background = this._skyColor;
  }

  tick(delta) {
    const config = GAME_CONFIG.DAY_NIGHT;
    this.timeOfDay = (this.timeOfDay + delta / this.dayDuration) % 1;
    const hours = this.timeOfDay * 24;

    let time = 0;

    // --- Sun color transition ---
    if (hours >= config.SUNSET_START && hours < config.SUNSET_END) {
      time = (hours - config.SUNSET_START) / (config.SUNSET_END - config.SUNSET_START);
      this.directional.color.copy(this._sunColorDay).lerp(this._sunColorNight, time);
    } else if (hours >= config.SUNRISE_START && hours < config.SUNRISE_END) {
      time = (hours - config.SUNRISE_START) / (config.SUNRISE_END - config.SUNRISE_START);
      this.directional.color.copy(this._sunColorNight).lerp(this._sunColorDay, time);
    } else if (hours >= config.SUNSET_END || hours < config.SUNRISE_START) {
      this.directional.color.copy(this._sunColorNight);
    } else {
      this.directional.color.copy(this._sunColorDay);
    }

    // --- Sky color transition ---
    if (hours >= config.SUNSET_START && hours < config.SUNSET_END) {
      this._skyColor.copy(this._skyNight).lerp(this._skyDay, 1 - time);
    } else if (hours >= config.SUNRISE_START && hours < config.SUNRISE_END) {
      this._skyColor.copy(this._skyDay).lerp(this._skyNight, 1 - time);
    } else if (hours >= config.SUNRISE_END && hours < config.SUNSET_START) {
      this._skyColor.copy(this._skyDay);
    } else {
      this._skyColor.copy(this._skyNight);
    }

    // --- UI clock ---
    const timeString = this._formatTime(hours);
    this.ui.updateClock(timeString);

    const nowIsDay =
      hours >= config.SUNRISE_END && hours < config.SUNSET_START;
    if (this.isDay !== nowIsDay) {
      this.isDay = nowIsDay;
      this.ui.updateDayNight(this.isDay);
    }
  }

  toggleDayNight() {
    this.timeOfDay = (this.timeOfDay + 0.5) % 1;
    const hours = this.timeOfDay * 24;
    const config = GAME_CONFIG.DAY_NIGHT;
    const nowIsDay = hours >= config.SUNRISE_END && hours < config.SUNSET_START;
    this.isDay = nowIsDay;
    this.ui.updateDayNight(this.isDay);
    this.ui.updateClock(this._formatTime(hours));
  }

  _formatTime(hours) {
    const hour = Math.floor(hours);
    const minute = Math.floor((hours % 1) * 60);
    const suffix = hour >= 12 ? "p.m." : "a.m.";
    const displayH = ((hour + 11) % 12) + 1;
    return `${displayH}:${minute.toString().padStart(2, "0")} ${suffix}`;
  }

  dispose() {
    if (this.lightGroup) {
      this.scene.remove(this.lightGroup);
      this.lightGroup = null;
    }
  }
}
