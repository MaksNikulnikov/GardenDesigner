import * as THREE from "three";
import { createObject } from "./ObjectFactory";

export const FACTORIES = {
  // 🌾 Plants (multi-stage)
  corn: () => createObject({ name: "corn", stages: 3 }),
  tomato: () => createObject({ name: "tomato", stages: 3 }),
  strawberry: () => createObject({ name: "strawberry", stages: 3 }),
  grape: () => createObject({ name: "grape", stages: 3 }),

  // 🐄 Animals (single model)
  cow: () => createObject({ name: "cow" }),
  sheep: () => createObject({ name: "sheep" }),
  chicken: () => createObject({ name: "chicken" }),

  // 🪴 Structures
  plot: () =>
    createObject({
      name: "plot",

    }),

  pen: () =>
    createObject({
      name: "pen",

    }),

  // 🪧 Placeholder (used for empty field slots before building)
  placeholder: () =>
    createObject({
      name: "placeholder",

    }),
};
