import { createObject } from "./ObjectFactory";
import { createObjectWithAnimation } from "./createObjectWithAnimation";

export const FACTORIES = {
  // 🌾 Plants (multi-stage)
  corn: () => createObject({ name: "corn", stages: 3 }),
  tomato: () => createObject({ name: "tomato", stages: 3 }),
  strawberry: () => createObject({ name: "strawberry", stages: 3 }),
  grape: () => createObject({ name: "grape", stages: 3 }),

  // 🐄 Animals (single model)
  cow: (opts) => createObjectWithAnimation({ name: "cow", ...(opts ?? {}) }),
  sheep: (opts) => createObjectWithAnimation({ name: "sheep", ...(opts ?? {}) }),
  chicken: (opts) => createObjectWithAnimation({ name: "chicken", ...(opts ?? {}) }),

  // 🪴 Structures
  garden: () => createObject({ name: "garden" }),
  pen: () => createObject({ name: "pen" }),

  // 🪧 Placeholder (used for empty field slots before building)
  placeholder: () => createObject({ name: "placeholder" }),
};
