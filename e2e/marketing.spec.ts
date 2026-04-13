import { expect, test } from "@playwright/test";

test.setTimeout(120000);

test("marketing and public builder pages render", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("heading", {
      name: /Build your resume, GitHub README, LinkedIn copy, and portfolio kit in one place/i,
    }),
  ).toBeVisible();

  await page.goto("/resume", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /Generate a stronger resume draft/i })).toBeVisible();

  await page.goto("/github-readme", { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("heading", { name: /Build a GitHub profile README that reads like you/i }),
  ).toBeVisible();

  await page.goto("/linkedin", { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("heading", { name: /Rewrite your LinkedIn profile with clearer positioning/i }),
  ).toBeVisible();

  await page.goto("/portfolio-kit", { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("heading", { name: /Shape a portfolio story before you build the site/i }),
  ).toBeVisible();

  await page.goto("/templates", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /Launch with four distinct looks/i })).toBeVisible();
});
