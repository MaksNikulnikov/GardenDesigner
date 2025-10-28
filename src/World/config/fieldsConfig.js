import * as THREE from "three";
import { GAME_CONFIG } from "./gameConfig";

/**
 * Each placeholder is a large tile (2×3 m) that can host either:
 * - a garden (with 6 small cells for plants)
 * - or an animal pen (for one animal object)
 */
export const FIELDS_CONFIG = [
  {
    id: "ph_1",
    position: new THREE.Vector3(-9, GAME_CONFIG.OFFSET_Y.PLACEHOLDER, -9),
    rotationY: Math.PI / 2,
    size: { x: 6, z: 12 },
    type: null,
  },
  {
    id: "ph_2",
    position: new THREE.Vector3(-9, GAME_CONFIG.OFFSET_Y.PLACEHOLDER, 0),
    rotationY: Math.PI / 2,
    size: { x: 6, z: 12 },

    type: null,
  },
  {
    id: "ph_3",
    position: new THREE.Vector3(-9, GAME_CONFIG.OFFSET_Y.PLACEHOLDER, 9),
    rotationY: Math.PI / 2,
    size: { x: 6, z: 12 },

    type: null,
  },
  {
    id: "ph_2",
    position: new THREE.Vector3(9, GAME_CONFIG.OFFSET_Y.PLACEHOLDER, 0),
    rotationY: Math.PI / 2,
    size: { x: 6, z: 12 },
    type: null,
  },
  {
    id: "ph_3",
    position: new THREE.Vector3(9, GAME_CONFIG.OFFSET_Y.PLACEHOLDER, 9),
    rotationY: Math.PI / 2,
    size: { x: 6, z: 12 },
    type: null,
  },
];
