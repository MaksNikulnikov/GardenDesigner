import { expect, test } from "@playwright/test";

async function waitForGame(page) {
  await page.goto("/?e2e=1");
  await expect(page.locator("#game-ui")).toBeVisible();
  await page.waitForFunction(() => !!window.__gardenDebug?.getGame?.(), null, {
    timeout: 30_000,
  });
  await page.waitForFunction(
    () => {
      const game = window.__gardenDebug?.getGame?.();
      return !!game?.tutorial && !!game?.ui?.$btnBuild;
    },
    null,
    { timeout: 30_000 }
  );
}

async function stageReadmeScene(page, variant) {
  await page.addStyleTag({
    content: `
      #tutorial-overlay,
      .tutorial-overlay,
      .tutorial-dim,
      .tutorial-focus-ring,
      .hint-box,
      .perf-overlay,
      #perf-overlay {
        display: none !important;
        opacity: 0 !important;
      }

      html,
      body,
      #scene-container {
        overflow: hidden !important;
      }
    `,
  });

  await page.evaluate(async ({ menu, camera }) => {
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const waitFor = async (predicate, timeout = 15_000) => {
      const start = performance.now();
      while (performance.now() - start < timeout) {
        if (predicate()) return;
        await wait(50);
      }
      throw new Error("Timed out while staging README screenshot scene");
    };

    const game = window.__gardenDebug.getGame();
    await waitFor(() => !!game?.tutorial && !!game?.ui?.$btnBuild);

    const clearSmoke = () => {
      for (const effect of game.structures?._effects ?? []) {
        game.removeUpdatable?.(effect);
        effect?.dispose?.();
      }
      game.structures?._effects?.clear?.();

      const roots = new Set();
      game.scene.traverse((node) => {
        if (node?.isPoints) roots.add(node.parent ?? node);
      });
      for (const root of roots) {
        game.removeUpdatable?.(root);
        root.dispose?.();
        root.parent?.remove?.(root);
      }
    };

    game.tutorial?.stop?.();
    game.removeUpdatable?.(game.tutorial);
    game.ui?.hideSpotlight?.();
    game.ui?.hideHint?.();
    document.getElementById("tutorial-overlay")?.classList.add("hidden");
    document.querySelectorAll(".btn.disabled").forEach((el) => {
      el.classList.remove("disabled");
      el.setAttribute("aria-disabled", "false");
    });
    game.ui?.removeHighlights?.();

    game.state.coins = 200;
    game.state.corn = 24;
    game.state.eggs = 3;
    game.ui?.updateCoins?.(game.state.coins);
    game.ui?.updateCorn?.(game.state.corn);
    game.ui?.updateEggs?.(game.state.eggs);

    const fields = game.field.fields;
    const build = (type, index) => {
      const field = fields[index];
      game.state.buildMode = type;
      game._buildStructure(field);
      game.state.buildMode = null;
      if (field?.structure?.group) {
        field.structure.group.visible = true;
        field.structure.group.scale.set(1, 1, 1);
      }
      return field;
    };

    const gardenA = build("garden", 1);
    const gardenB = build("garden", 2);
    const penA = build("pen", 3);
    const penB = build("pen", 4);

    await waitFor(() => {
      return [gardenA, gardenB, penA, penB].every(
        (field) => field?.structure?.group?.children?.length > 0
      );
    });

    [gardenA, gardenB, penA, penB].forEach((field) => {
      if (!field?.structure?.group) return;
      field.structure.group.visible = true;
      field.structure.group.scale.set(1, 1, 1);
    });
    clearSmoke();

    const fillGarden = (field, limit) => {
      game._onItemSelect("corn");
      field.structure.cells.slice(0, limit).forEach((cell) => {
        if (!cell.content) game._handleCellClick(cell);
      });
    };
    fillGarden(gardenA, 6);
    fillGarden(gardenB, 4);

    const fillPen = (field, limit) => {
      game._onItemSelect("chicken");
      field.structure.cells.slice(0, limit).forEach((cell) => {
        if (!cell.content) game._handleCellClick(cell);
      });
    };
    fillPen(penA, 3);
    fillPen(penB, 2);

    await waitFor(() => {
      const entities = game.entities.entities;
      return (
        entities.filter((entity) => entity.kind === "plant").length >= 10 &&
        entities.filter((entity) => entity.kind === "animal").length >= 5 &&
        entities.every((entity) => entity.obj?.children?.length > 0)
      );
    });

    for (const entity of game.entities.entities) {
      if (entity.kind === "plant") {
        entity.stage = 3;
        entity.nextGrowthIndex = entity.config?.growthTime?.length ?? 2;
        entity.timer = 0;
        entity.readyToHarvest = true;
        entity.obj?.setStage?.(3);
      }

      if (entity.kind === "animal") {
        entity.stored = 3;
        entity.producing = false;
        entity.readyToHarvest = true;
        entity.tick?.(0, game.state, game.ui);
      }
    }
    clearSmoke();

    game.entities.allowHarvest?.();
    game.clearSelectedItem?.();
    game.ui?.hideAllSubButtons?.();
    game.ui.activeMenu = null;
    game.ui?._toggleMenu?.(menu);

    if (camera) {
      const { position, target, fov } = camera;
      game.camera.position.set(position[0], position[1], position[2]);
      game.camera.fov = fov;
      game.camera.updateProjectionMatrix();
      game.controls.target.set(target[0], target[1], target[2]);
      game.camera.lookAt(game.controls.target);
      game.controls.update();
    }

    document.getElementById("tutorial-overlay")?.classList.add("hidden");
    document
      .querySelectorAll(".tutorial-overlay, .tutorial-dim, .tutorial-focus-ring")
      .forEach((el) => {
        el.style.display = "none";
        el.style.opacity = "0";
      });

    await wait(700);
    clearSmoke();
  }, variant);
}

async function captureReadmeScreenshot(browser, options) {
  const context = await browser.newContext({
    viewport: options.viewport,
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  try {
    await waitForGame(page);
    await stageReadmeScene(page, options);
    await page.screenshot({ path: options.path, fullPage: false });
  } finally {
    await context.close();
  }
}

test.describe("visual captures", () => {
  test.skip(!!process.env.CI, "Screenshots are captured manually, not in CI.");

  test("capture staged README screenshots", async ({ browser }) => {
    await captureReadmeScreenshot(browser, {
      path: "docs/screenshots/desktop-gameplay.png",
      viewport: { width: 1440, height: 900 },
      menu: "plants",
      camera: {
        position: [-8, 38, 37],
        target: [0, 0, 2],
        fov: 36,
      },
    });

    await captureReadmeScreenshot(browser, {
      path: "docs/screenshots/mobile-gameplay.png",
      viewport: { width: 390, height: 844 },
      menu: "animals",
      camera: {
        position: [-4, 34, 32],
        target: [0, 0, 3],
        fov: 39,
      },
    });

    await captureReadmeScreenshot(browser, {
      path: "docs/screenshots/desctop-tutorial.png",
      viewport: { width: 1916, height: 863 },
      menu: "build",
      camera: {
        position: [-5, 34, 34],
        target: [0, 0, 4],
        fov: 33,
      },
    });
  });
});
