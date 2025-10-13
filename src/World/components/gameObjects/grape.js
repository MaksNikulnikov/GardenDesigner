import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Group } from "three";

function createGrape() {
  const group = new Group();
  const loader = new GLTFLoader();

  group.stages = {
    stage1: null,
    stage2: null,
    stage3: null,
  };

  group.currentStage = null;

  group.setStage = (index) => {
    if (!group.stages.stage1) return;

    const stages = [group.stages.stage1, group.stages.stage2, group.stages.stage3];
    stages.forEach((s, i) => {
      if (s) s.visible = i === index - 1;
    });

    group.currentStage = index;
  };

  loader.load(
    "/assets/models/grape.glb",
    (gltf) => {
      const stage1 = gltf.scene.getObjectByName("grape_1");
      const stage2 = gltf.scene.getObjectByName("grape_2");
      const stage3 = gltf.scene.getObjectByName("grape_3");

      group.add(stage1, stage2, stage3);

      group.stages.stage1 = stage1;
      group.stages.stage2 = stage2;
      group.stages.stage3 = stage3;

      group.setStage(1);
    },
    undefined,
    (error) => {
      console.error("Error loading grape.glb:", error);
    }
  );

  return group;
}

export { createGrape };
