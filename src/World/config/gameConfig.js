export const GAME_CONFIG = {
  INITIAL_COINS: 50,
  OFFSET_Y:{
    PLACEHOLDER: 0.25,
    PEN: 0.5,
    PLOT: 0.5,
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
      reward: 5,
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
      growthTime: [3, 3, 3],
      reward: 6,
      cost: 4,
    },
  },
  STRUCTURES: {
  plot: {
    buildTime: 3,
  },
  pen: {
    buildTime: 4,
  },}
};
