import { expect, test } from "@playwright/test";

async function waitForGame(page) {
  await page.goto("/?e2e=1");
  await expect(page.locator("#game-ui")).toBeVisible();
  await page.waitForFunction(() => {
    return !!window.__gardenDebug?.getGame?.();
  });
}

test("bootstraps UI and debug hooks", async ({ page }) => {
  await waitForGame(page);
  await expect(page.locator("#btn-build")).toBeVisible();
  await expect(page.locator("#coin-amount")).toContainText(/\d+/);

  const hasDebug = await page.evaluate(() => !!window.__gardenDebug?.getGame?.());
  expect(hasDebug).toBeTruthy();
});

test("build and plant actions work, and CTA is reachable", async ({ page }) => {
  await waitForGame(page);

  await page.evaluate(async () => {
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const waitFor = async (predicate, timeout = 10_000) => {
      const started = performance.now();
      while (performance.now() - started < timeout) {
        if (predicate()) return;
        await wait(50);
      }
      throw new Error("Condition timeout");
    };

    const game = window.__gardenDebug.getGame();
    await waitFor(() => !!game?.tutorial, 10_000);
    await wait(200);

    // Build garden.
    game._startBuildMode("garden");
    let field = game._getOrPickTutorialField("garden");
    game._buildStructure(field);
    if (field?.structure?.group) field.structure.group.visible = true;
    await waitFor(() => game.field.fields.some((entry) => entry.structure?.type === "garden"), 10_000);

    // Plant 3 corn.
    game._onItemSelect("corn");
    const gardenField = game.field.fields.find((entry) => entry.structure?.type === "garden");
    const plantCells = gardenField.structure.cells.filter((cell) => cell.type === "plants").slice(0, 3);
    plantCells.forEach((cell) => game._handleCellClick(cell));
    await waitFor(
      () => game.entities.entities.filter((entity) => entity.type === "corn").length >= 3,
      10_000
    );

    // Jump to final tutorial step in a deterministic way.
    game.tutorial.activeStep?.complete?.();
    game.tutorial.currentStepIndex = 5;
    game.tutorial._runCurrentStep();
    game.state.eggs = 5;
    game.ui.updateEggs?.(5);
    await waitFor(() => !document.getElementById("cta-button")?.classList.contains("hidden"), 10_000);
  });

  await expect(page.locator("#cta-button")).toBeVisible();
});

test("clicking a chicken counter does not grant eggs when not ready", async ({ page }) => {
  await waitForGame(page);

  const eggsAfterClick = await page.evaluate(async () => {
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const waitFor = async (predicate, timeout = 10_000) => {
      const started = performance.now();
      while (performance.now() - started < timeout) {
        if (predicate()) return;
        await wait(50);
      }
      throw new Error("Condition timeout");
    };

    const game = window.__gardenDebug.getGame();
    await waitFor(() => !!game?.tutorial, 10_000);

    // Stop tutorial to avoid interfering button lock and spotlight logic.
    game.tutorial.stop();
    game.removeUpdatable(game.tutorial);

    game.entities.allowHarvest();
    game.state.eggs = 0;
    game.ui.updateEggs?.(0);

    game._startBuildMode("pen");
    const field = game._getOrPickTutorialField("pen");
    game._buildStructure(field);
    if (field?.structure?.group) field.structure.group.visible = true;

    game._onItemSelect("chicken");
    const penField = game.field.fields.find((entry) => entry.structure?.type === "pen");
    const targetCell = penField.structure.cells.find((cell) => cell.type === "animals" && !cell.content);
    game._handleCellClick(targetCell);

    await waitFor(() => game.entities.entities.some((entry) => entry.type === "chicken"), 10_000);
    const chicken = game.entities.entities.find((entry) => entry.type === "chicken");
    chicken.stored = 0;
    chicken.readyToHarvest = false;

    const counter = document.querySelector(`[data-animal-id="${chicken.id}"]`);
    counter?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await wait(120);

    return game.state.eggs;
  });

  expect(eggsAfterClick).toBe(0);
  await expect(page.locator("#res-eggs")).toHaveText("0");
});
