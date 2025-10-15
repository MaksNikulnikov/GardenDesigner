import * as THREE from "three";
import { FACTORIES } from "./factories.js";

/**
 * Handles creation of sub-structures:
 * - GardenPlot: 6 mini-cells (for plants)
 * - AnimalPen: one large zone (for animals)
 */
export class StructureManager {
  constructor(scene) {
    this.scene = scene;
  }

  createGardenPlot(origin) {
    const group = FACTORIES.plot();
    group.position.copy(origin);
    this.scene.add(group);

    const cells = [];

    group.traverse((obj) => {
      // @ts-ignore
      if (obj.isMesh && obj.name.startsWith("plot_cell_")) {
        cells.push({
          id: obj.name,
          position: obj.getWorldPosition(new THREE.Vector3()),
          type: "plants",
          content: null,
          placeholder: obj,
        });
      }
    });

    return { type: "garden", group, cells, origin };
  }

  createAnimalPen(origin) {
    const group = FACTORIES.pen();
    group.position.copy(origin);
    this.scene.add(group);

    return {
      type: "pen",
      group,
      cell: {
        position: group.position.clone(),
        type: "animals",
        content: null,
      },
    };
  }
}
