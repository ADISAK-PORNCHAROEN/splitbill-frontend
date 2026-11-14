import { expect, test } from "@playwright/test";

test("the scaffold renders its status on the home page", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Shared expenses, made clear." })).toBeVisible();
  await expect(page.getByText("This starter does not yet connect to the API or store expenses."))
    .toBeVisible();
});
