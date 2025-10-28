import { AmbientLight, DirectionalLight, HemisphereLight, Group } from "three";
import { GAME_CONFIG } from "../config/gameConfig.js";

/**
 * Lightweight and bright lighting setup for low-poly casual scenes.
 */
function createLights() {
  const group = new Group();
  const config = GAME_CONFIG.LIGHT;

  const ambient = new AmbientLight(config.AMBIENT_COLOR, config.AMBIENT_INTENSITY);
  const hemi = new HemisphereLight(
    config.HEMI_SKY_COLOR,
    config.HEMI_GROUND_COLOR,
    config.HEMI_INTENSITY
  );

  const sun = new DirectionalLight(config.SUN_COLOR_DAY, config.SUN_INTENSITY);
  sun.position.set(config.SUN_POSITION.x, config.SUN_POSITION.y, config.SUN_POSITION.z);
  sun.castShadow = false;

  group.add(ambient, hemi, sun);
  return { group, ambient, hemi, directional: sun };
}

export { createLights };
