import * as THREE from "three";
import { gsap } from "gsap";

/**
 * Smoke effect used during building construction.
 * Creates a soft, pulsating cloud that fades in, swirls, and fades out.
 * Consists of two layers (smoke.png + smoke_alpha.png) for extra depth.
 */

// === CONSTANTS ===

// Default visual tuning
const SMOKE_PARTICLE_COUNT = 40;   // number of particles per layer
const SMOKE_SIZE = 8;              // sprite size in world units
const SMOKE_SPREAD = 6;            // overall width of the cloud
const SMOKE_Y_OFFSET = 1;          // how high above the ground
const SMOKE_DURATION = 6;          // total lifespan in seconds

// Swirling animation parameters
const SMOKE_AMP_X = 0.5;           // horizontal sway amplitude (x)
const SMOKE_AMP_Y = 0.25;          // vertical sway amplitude (y)
const SMOKE_AMP_Z = 0.5;           // horizontal sway amplitude (z)
const SMOKE_SPEED = 0.6;           // how fast the smoke moves

// Opacity animation
const SMOKE_FADE_IN = 0.8;         // fade-in duration (sec)
const SMOKE_FADE_OUT = 1.0;        // fade-out duration (sec)
const SMOKE_INNER_OPACITY = 0.6;   // max opacity for inner layer
const SMOKE_OUTER_OPACITY = 0.5;   // max opacity for outer layer

// === MAIN FUNCTION ===

export function createSmokeEffect(
  scene,
  position,
  {
    duration = SMOKE_DURATION,
    count = SMOKE_PARTICLE_COUNT,
    size = SMOKE_SIZE,
    spread = SMOKE_SPREAD,
    yOffset = SMOKE_Y_OFFSET,
  } = {}
) {
  const loader = new THREE.TextureLoader();

  // Load both textures
  const textureMain = loader.load("assets/images/smoke.png");
  const textureAlpha = loader.load("assets/images/smoke_alpha.png");

  // Ensure correct color space for PNGs
  if (textureMain.colorSpace !== undefined)
    textureMain.colorSpace = THREE.SRGBColorSpace;
  if (textureAlpha.colorSpace !== undefined)
    textureAlpha.colorSpace = THREE.SRGBColorSpace;

  // Group for both smoke layers
  const group = new THREE.Group();
  group.position.copy(position);
  group.position.y += yOffset;
  scene.add(group);

  /**
   * Creates one smoke layer with given texture and target opacity.
   */
  const makeLayer = (texture, targetOpacity, seed = 0) => {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const basePositions = [];
    const offsets = [];

    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * spread;
      const y = (Math.random() - 0.5) * (spread * 0.4);
      const z = (Math.random() - 0.5) * spread;
      positions.set([x, y, z], i * 3);
      basePositions.push(new THREE.Vector3(x, y, z));
      offsets.push(Math.random() * Math.PI * 2 + seed);
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      map: texture,
      transparent: true,
      opacity: 0,
      size,
      depthWrite: false,
      blending: THREE.AdditiveBlending, // for glowing look
    });

    const points = new THREE.Points(geometry, material);
    group.add(points);

    // Fade in & fade out animations
    gsap.to(material, { opacity: targetOpacity, duration: SMOKE_FADE_IN, ease: "power2.out" });
    gsap.to(material, {
      opacity: 0,
      duration: SMOKE_FADE_OUT,
      delay: Math.max(0, duration - SMOKE_FADE_OUT),
      ease: "power2.inOut",
    });

    return { geometry, material, basePositions, offsets };
  };

  // Two layers: denser inner and softer outer
  const inner = makeLayer(textureMain, SMOKE_INNER_OPACITY, 0.0);
  const outer = makeLayer(textureAlpha, SMOKE_OUTER_OPACITY, 1.5);

  // === Animation logic per frame ===
  // @ts-ignore
  group.tick = () => {
    const t = performance.now() * 0.001 * SMOKE_SPEED;

    const updateLayer = (layer) => {
      const { geometry, basePositions, offsets } = layer;
      const pos = geometry.attributes.position;
      for (let i = 0; i < basePositions.length; i++) {
        const o = offsets[i];
        const b = basePositions[i];
        const x = b.x + Math.sin(t + o) * SMOKE_AMP_X;
        const y = b.y + Math.sin(t * 1.3 + o) * SMOKE_AMP_Y;
        const z = b.z + Math.cos(t + o) * SMOKE_AMP_Z;
        pos.setXYZ(i, x, y, z);
      }
      pos.needsUpdate = true;
    };

    updateLayer(inner);
    updateLayer(outer);
  };

  // === Cleanup ===
  setTimeout(() => {
    scene.remove(group);
    inner.geometry.dispose();
    inner.material.dispose();
    outer.geometry.dispose();
    outer.material.dispose();
  }, duration * 1000 + 500);

  return group;
}
