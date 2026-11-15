import { expect, test } from "@playwright/test";

test("the page remains usable when the API is unavailable", async ({ page }) => {
  await page.route("**/groups", (route) => route.abort("failed"));
  await page.goto("/");
  await expect(page.getByLabel("Select user")).toBeVisible();
  await expect(page.getByRole("alert").filter({ hasText: "Unable to connect" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
});
