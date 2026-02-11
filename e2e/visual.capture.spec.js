import { expect, test } from "@playwright/test";

test.describe("visual captures", () => {
  test.skip(!!process.env.CI, "Screenshots are captured manually, not in CI.");

  test("capture desktop and mobile screenshots for README", async ({ browser }) => {
    const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const desktopPage = await desktop.newPage();
    await desktopPage.goto("/?e2e=1");
    await expect(desktopPage.locator("#game-ui")).toBeVisible();
    await desktopPage.waitForTimeout(1200);
    await desktopPage.screenshot({
      path: "docs/screenshots/desktop-gameplay.png",
      fullPage: true,
    });
    await desktop.close();

    const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const mobilePage = await mobile.newPage();
    await mobilePage.goto("/?e2e=1");
    await expect(mobilePage.locator("#game-ui")).toBeVisible();
    await mobilePage.waitForTimeout(1200);
    await mobilePage.screenshot({
      path: "docs/screenshots/mobile-gameplay.png",
      fullPage: true,
    });
    await mobile.close();
  });
});

