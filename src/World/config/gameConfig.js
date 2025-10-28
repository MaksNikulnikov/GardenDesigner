export const GAME_CONFIG = {
  INITIAL_COINS: 50,

  // ===== LIGHTING SETTINGS =====
  LIGHT: {
    AMBIENT_COLOR: 0xfff8e1,
    AMBIENT_INTENSITY: 0.8,

    HEMI_SKY_COLOR: 0xcbe8ff,
    HEMI_GROUND_COLOR: 0xffe8b2,
    HEMI_INTENSITY: 0.5,

    SUN_COLOR_DAY: 0xfff4cc,
    SUN_COLOR_NIGHT: 0x6b5cff,
    SUN_INTENSITY: 4.8,
    SUN_POSITION: { x: 8, y: 10, z: 6 },
  },
  DAY_DURATION: 240,

  // ===== DAY/NIGHT CYCLE SETTINGS =====
  DAY_NIGHT: {
    SUNSET_START: 20, // 8 p.m.
    SUNSET_END: 21, // 9 p.m.
    SUNRISE_START: 7, // 7 a.m.
    SUNRISE_END: 8, // 8 a.m.

    SKY_DAY: 0x87ceff, // light blue
    SKY_NIGHT: 0x1b003d, // violet-blue
  },
  OFFSET_Y: {
    PLACEHOLDER: 0.25,
    PEN: 0.5,
    GARDEN: 0.5,
  },
  ITEMS: {
    corn: {
      category: "plants",
      displayName: "Corn",
      /**
       * Array of growth stage durations (in seconds).
       * The length of this array determines the number of growth stages
       * and must match the number of stages available in the 3D model.
       */
      growthTime: [3, 3, 0],
      reward: {
        type: "corn",
        amount: 5,
      },
      cost: 2,
    },
    tomato: {
      category: "plants",
      displayName: "Tomato",
      growthTime: [4, 4, 0],
      reward: 8,
      cost: 3,
    },
    strawberry: {
      category: "plants",
      displayName: "Strawberry",
      growthTime: [5, 5, 0],
      reward: 10,
      cost: 4,
    },
    grape: {
      category: "plants",
      displayName: "Grape",
      growthTime: [6, 6, 0],
      reward: 12,
      cost: 5,
    },

    cow: {
      category: "animals",
      displayName: "Cow",
      growthTime: [5, 5, 5],
      reward: 10,
      cost: 6,
    },
    sheep: {
      category: "animals",
      displayName: "Sheep",
      growthTime: [4, 4, 4],
      reward: 8,
      cost: 5,
    },
    chicken: {
      category: "animals",
      displayName: "Chicken",
      productionTime: 6,
      feedType: "corn",
      feedPerEgg: 2,
      maxStorage: 5,
      reward: {
        type: "eggs",
        amount: 1,
      },
      cost: 4,
    },
  },
  STRUCTURES: {
    garden: {
      buildTime: 1.5,
      cost: 12,
      cellLayout: { rows: 3, cols: 2, cellSizeX: 3, cellSizeZ: 3.4 },
    },
    pen: {
      buildTime: 2,
      cost: 15,
      cellLayout: { rows: 3, cols: 2, cellSizeX: 3, cellSizeZ: 3.2 },
    },
  },
};
