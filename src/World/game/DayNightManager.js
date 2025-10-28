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

    this.ambient = ambient;
    this.hemi = hemi;
    this.directional = directional;
  }

  tick(delta) {
    const config = GAME_CONFIG.DAY_NIGHT;
    const lightConfig = GAME_CONFIG.LIGHT;

    this.timeOfDay = (this.timeOfDay + delta / GAME_CONFIG.DAY_DURATION) % 1;
    const hours = this.timeOfDay * 24;

    const dayColor = new THREE.Color(lightConfig.SUN_COLOR_DAY);
    const nightColor = new THREE.Color(lightConfig.SUN_COLOR_NIGHT);
    const daySky = new THREE.Color(config.SKY_DAY);
    const nightSky = new THREE.Color(config.SKY_NIGHT);

    let time = 0;

    // --- Sun color transition ---
    if (hours >= config.SUNSET_START && hours < config.SUNSET_END) {
      time = (hours - config.SUNSET_START) / (config.SUNSET_END - config.SUNSET_START);
      this.directional.color.copy(dayColor).lerp(nightColor, time);
    } else if (hours >= config.SUNRISE_START && hours < config.SUNRISE_END) {
      time = (hours - config.SUNRISE_START) / (config.SUNRISE_END - config.SUNRISE_START);
      this.directional.color.copy(nightColor).lerp(dayColor, time);
    } else if (hours >= config.SUNSET_END || hours < config.SUNRISE_START) {
      this.directional.color.copy(nightColor);
    } else {
      this.directional.color.copy(dayColor);
    }

    // --- Sky color transition ---
    if (hours >= config.SUNSET_START && hours < config.SUNSET_END) {
      this.scene.background = nightSky.clone().lerp(daySky, 1 - time);
    } else if (hours >= config.SUNRISE_START && hours < config.SUNRISE_END) {
      this.scene.background = daySky.clone().lerp(nightSky, 1 - time);
    } else if (hours >= config.SUNRISE_END && hours < config.SUNSET_START) {
      this.scene.background = daySky;
    } else {
      this.scene.background = nightSky;
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
}
