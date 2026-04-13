import { expect, test, type Page } from "@playwright/test";

async function assertNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;

    return {
      viewportWidth: window.innerWidth,
      documentWidth: doc.scrollWidth,
      bodyWidth: body.scrollWidth,
    };
  });

  expect(Math.max(dimensions.documentWidth, dimensions.bodyWidth)).toBeLessThanOrEqual(
    dimensions.viewportWidth + 1,
  );
}

test.describe("responsive layouts", () => {
  test.setTimeout(120000);

  test("public routes stay usable at phone width", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    const cases = [
      { path: "/", heading: /Build your resume, GitHub README, LinkedIn copy, and portfolio kit/i },
      { path: "/resume", heading: /Generate a stronger resume draft/i },
      { path: "/github-readme", heading: /Build a GitHub profile README that reads like you/i },
      { path: "/linkedin", heading: /Rewrite your LinkedIn profile with clearer positioning/i },
      { path: "/portfolio-kit", heading: /Shape a portfolio story before you build the site/i },
      { path: "/templates", heading: /Launch with four distinct looks/i },
      { path: "/login", heading: /Save your career assets and keep building/i },
    ];

    for (const item of cases) {
      await page.goto(item.path, { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("heading", { name: item.heading }).first()).toBeVisible();
      await assertNoHorizontalOverflow(page);
    }
  });

  test("phone builder panes switch cleanly without overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto("/resume", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("tab", { name: /^Edit$/ })).toBeVisible();
    await expect(page.getByRole("tab", { name: /^Output$/ })).toBeVisible();
    await expect(page.getByRole("tab", { name: /^Preview$/ })).toBeVisible();
    await page.getByRole("tab", { name: /^Output$/ }).click();
    await expect(page.locator("section.mobile-only:visible").getByText("Generated copy")).toBeVisible();
    await assertNoHorizontalOverflow(page);
    await page.getByRole("tab", { name: /^Preview$/ }).click();
    await expect(page.locator("section.editor-preview:visible").getByText("Draft preview")).toBeVisible();
    await assertNoHorizontalOverflow(page);

    await page.goto("/github-readme", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("tab", { name: /^Edit$/ })).toBeVisible();
    await expect(page.getByRole("tab", { name: /^Output$/ })).toBeVisible();
    await page.getByRole("tab", { name: /^Output$/ }).click();
    await expect(page.getByTestId("generated-output")).toBeVisible();
    await assertNoHorizontalOverflow(page);
  });

  test("tablet layouts avoid overflow on key routes", async ({ page }) => {
    await page.setViewportSize({ width: 834, height: 1112 });

    for (const path of ["/", "/resume", "/github-readme", "/templates", "/login"]) {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await assertNoHorizontalOverflow(page);
    }
  });

  test("workspace entry stays usable on phone when it redirects to login", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/app", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { name: /Save your career assets and keep building/i })).toBeVisible();
    await assertNoHorizontalOverflow(page);
  });
});
