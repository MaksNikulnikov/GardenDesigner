import { AmbientLight, DirectionalLight, HemisphereLight, Group } from "three";
import { GAME_CONFIG } from "../config/gameConfig.js";

/**
 * Lightweight and bright lighting setup for low-poly casual scenes.
 */
function createLights() {
  const group = new Group();
  const cfg = GAME_CONFIG.LIGHT;

  const ambient = new AmbientLight(cfg.AMBIENT_COLOR, cfg.AMBIENT_INTENSITY);
  const hemi = new HemisphereLight(
    cfg.HEMI_SKY_COLOR,
    cfg.HEMI_GROUND_COLOR,
    cfg.HEMI_INTENSITY
  );

  const sun = new DirectionalLight(cfg.SUN_COLOR_DAY, cfg.SUN_INTENSITY);
  sun.position.set(cfg.SUN_POSITION.x, cfg.SUN_POSITION.y, cfg.SUN_POSITION.z);
  sun.castShadow = false;

  group.add(ambient, hemi, sun);
  return { group, ambient, hemi, directional: sun };
}

export { createLights };
