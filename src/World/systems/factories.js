import { createChicken } from "../components/gameObjects/chicken";
import { createCorn } from "../components/gameObjects/corn";
import { createCow } from "../components/gameObjects/cow";
import { createGrape } from "../components/gameObjects/grape";
import { createSheep } from "../components/gameObjects/sheep";
import { createStrawberry } from "../components/gameObjects/strawberry";
import { createTomato } from "../components/gameObjects/tomato";


export const FACTORIES = {
  corn: createCorn,
  tomato: createTomato,
  strawberry: createStrawberry,
  grape: createGrape,
  cow: createCow,
  sheep: createSheep,
  chicken: createChicken,
};
