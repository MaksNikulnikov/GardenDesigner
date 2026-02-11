import { expect, test } from "@playwright/test";

test.use({
  viewport: { width: 390, height: 844 },
});

async function waitForGame(page) {
  await page.goto("/?e2e=1");
  await expect(page.locator("#game-ui")).toBeVisible();
  await page.waitForFunction(() => {
    return !!window.__gardenDebug?.getGame?.();
  });
}

test("mobile layout keeps controls readable and CTA sized correctly", async ({ page }) => {
  await waitForGame(page);

  await expect(page.locator("#btn-build")).toBeVisible();
  await expect(page.locator("#btn-plants")).toBeVisible();
  await expect(page.locator("#btn-animals")).toBeVisible();

  const mainBtnBox = await page.locator("#btn-build").boundingBox();
  expect(mainBtnBox).not.toBeNull();
  expect(mainBtnBox.width).toBeGreaterThan(70);
  expect(mainBtnBox.height).toBeGreaterThan(70);

  await page.evaluate(() => {
    const game = window.__gardenDebug?.getGame?.();
    game?.ui?.showCTA("Play now");
    game?.ui?.showSpotlight("#btn-build");
  });

  await expect(page.locator("#cta-button")).toBeVisible();
  await expect(page.locator("#tutorial-overlay")).toHaveClass(/active/);

  const ctaFontPx = await page.evaluate(() => {
    const cta = document.getElementById("cta-button");
    return Number.parseFloat(getComputedStyle(cta).fontSize);
  });
  expect(ctaFontPx).toBeLessThanOrEqual(16);
  expect(ctaFontPx).toBeGreaterThanOrEqual(12);

  const focusRect = await page.locator("#tutorial-focus-ring").boundingBox();
  expect(focusRect).not.toBeNull();
  expect(focusRect.width).toBeGreaterThan(40);
  expect(focusRect.height).toBeGreaterThan(30);
});

