import { expect, test, type Page, type Route } from "@playwright/test";

type Expense = { id: number; group_id: number; description: string; paid_by: string; amount: string; shares: Record<string, string>; created_at: string };
type CapturedCreate = { key: string | undefined; body: unknown; user: string | undefined };

const firstExpense: Expense = {
  id: 10, group_id: 1, description: "Dinner", paid_by: "alice", amount: "30.00",
  shares: { alice: "10.00", bob: "10.00", carol: "10.00" }, created_at: "2026-11-14T10:00:00Z",
};
const headers = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, DELETE, OPTIONS",
  "access-control-allow-headers": "Content-Type, X-User, Idempotency-Key",
};

async function installApi(page: Page, options: { failFirstCreate?: boolean; failRefresh?: boolean; failDeleteRefresh?: boolean; failGroups?: boolean; delayAlice?: boolean; delayGroupsMs?: number; delayCreateMs?: number; emptyGroups?: boolean } = {}) {
  let expenses: Expense[] = [structuredClone(firstExpense)];
  const attempts: CapturedCreate[] = [];
  let groupFailuresRemaining = options.failGroups ? 2 : 0;
  let failNextRefresh = false;
  let nextId = 11;
  async function json(route: Route, data: unknown, status = 200) {
    await route.fulfill({ status, headers, contentType: "application/json", body: JSON.stringify(data) });
  }
  await page.route("**/groups**", async (route) => {
    const req = route.request();
    const path = new URL(req.url()).pathname;
    const user = req.headers()["x-user"];
    if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers });
    if (options.delayAlice && user === "alice" && path === "/groups/1") {
      await new Promise((resolve) => setTimeout(resolve, 800));
    }
    if (path === "/groups") {
      if (options.delayGroupsMs) await new Promise((resolve) => setTimeout(resolve, options.delayGroupsMs));
      if (groupFailuresRemaining > 0) { groupFailuresRemaining -= 1; return json(route, { error: { code: "http_error", message: "Groups are temporarily unavailable." } }, 503); }
      if (options.emptyGroups) return json(route, []);
      return json(route, user === "alice" ? [{ id: 1, name: "Chiang Mai trip" }] : user === "bob" ? [{ id: 1, name: "Chiang Mai trip" }, { id: 2, name: "Office lunch" }] : user === "dan" ? [{ id: 2, name: "Office lunch" }] : [{ id: 1, name: "Chiang Mai trip" }]);
    }
    if (path === "/groups/1") return json(route, { id: 1, name: "Chiang Mai trip", members: ["alice", "bob", "carol"] });
    if (path === "/groups/2") return json(route, { id: 2, name: "Office lunch", members: ["bob", "dan"] });
    if (path.endsWith("/balances")) {
      if (failNextRefresh) { failNextRefresh = false; return json(route, { error: { code: "internal_error", message: "Balances unavailable." } }, 500); }
      return json(route, path.includes("/2/") ? [{ member: "bob", balance: "0.00" }, { member: "dan", balance: "0.00" }] : [{ member: "alice", balance: "20.00" }, { member: "bob", balance: "-10.00" }, { member: "carol", balance: "-10.00" }]);
    }
    if (req.method() === "GET" && path.endsWith("/expenses")) return json(route, path.includes("/2/") ? [] : expenses);
    if (req.method() === "POST" && path.endsWith("/expenses")) {
      const payload = req.postDataJSON();
      attempts.push({ key: req.headers()["idempotency-key"], body: payload, user });
      if (options.delayCreateMs) await new Promise((resolve) => setTimeout(resolve, options.delayCreateMs));
      if (options.failFirstCreate && attempts.length === 1) return route.abort("failed");
      const shares = payload.split.type === "equal" ? { alice: "33.34", bob: "33.33", carol: "33.33" } : payload.split.shares;
      const expense: Expense = { id: nextId++, group_id: 1, description: payload.description, paid_by: payload.paid_by, amount: payload.amount, shares, created_at: "2026-11-15T10:00:00Z" };
      expenses = [expense, ...expenses];
      if (options.failRefresh) failNextRefresh = true;
      return json(route, expense, 201);
    }
    if (req.method() === "DELETE" && /\/expenses\/\d+$/.test(path)) {
      const id = Number(path.split("/").at(-1));
      const expense = expenses.find((item) => item.id === id);
      if (!expense || expense.paid_by !== user) return json(route, { error: { code: "forbidden", message: "Only the payer can delete this expense." } }, 403);
      expenses = expenses.filter((item) => item.id !== id);
      if (options.failDeleteRefresh) failNextRefresh = true;
      return route.fulfill({ status: 204, headers });
    }
    return json(route, { error: { code: "not_found", message: "Not found" } }, 404);
  });
  return { attempts };
}

async function openTrip(page: Page) {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Chiang Mai trip" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Balances" })).toBeVisible();
}

async function fillExpense(page: Page, description = "Lunch") {
  await page.getByLabel("Description").fill(description);
  await page.getByLabel("Amount").fill("100.00");
}

test("shows only the selected user's groups and discards stale group responses", async ({ page }) => {
  await installApi(page, { delayAlice: true });
  const delayedGroupRequest = page.waitForRequest((request) =>
    new URL(request.url()).pathname === "/groups/1" && request.headers()["x-user"] === "alice",
  );
  await page.goto("/");
  await delayedGroupRequest;
  await page.getByLabel("Select user").selectOption("dan");
  await expect(page.getByRole("heading", { name: "Office lunch" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Chiang Mai trip" })).toHaveCount(0);
  await expect(page.getByLabel("Select group").locator("option")).toHaveCount(2);
  await expect(page.getByText("No expenses yet. Add one to get started.")).toBeVisible();
});

test("shows a plain-language API error and retries group loading", async ({ page }) => {
  await installApi(page, { failGroups: true });
  await page.goto("/");
  await expect(page.getByRole("alert").filter({ hasText: "Groups are temporarily unavailable." })).toBeVisible();
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByRole("heading", { name: "Chiang Mai trip" })).toBeVisible();
});

test("shows loading and no-groups states separately", async ({ page }) => {
  await installApi(page, { delayGroupsMs: 350, emptyGroups: true });
  await page.goto("/");
  await expect(page.getByRole("status").filter({ hasText: "Loading groups" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "No groups yet" })).toBeVisible();
  await expect(page.getByText("There are no groups for this user.")).toBeVisible();
});

test("warns before discarding form input on user and group changes", async ({ page }) => {
  await installApi(page);
  await openTrip(page);
  await page.getByLabel("Description").fill("Keep or discard this");
  page.once("dialog", (dialog) => dialog.dismiss());
  await page.getByLabel("Select user").selectOption("bob");
  await expect(page.getByLabel("Select user")).toHaveValue("alice");
  await expect(page.getByLabel("Description")).toHaveValue("Keep or discard this");

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByLabel("Select user").selectOption("bob");
  await expect(page.getByLabel("Select group")).toHaveValue("1");
  await expect(page.getByLabel("Description")).toHaveValue("");
  await page.getByLabel("Description").fill("Discard on group change");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByLabel("Select group").selectOption("2");
  await expect(page.getByRole("heading", { name: "Office lunch" })).toBeVisible();
  await expect(page.getByLabel("Description")).toHaveValue("");
});

test("previews and submits an equal split with decimal strings and request headers", async ({ page }) => {
  const mock = await installApi(page);
  await openTrip(page);
  await fillExpense(page);
  const form = page.locator("form");
  await expect(form.getByText("33.34")).toBeVisible();
  await expect(form.getByText("33.33")).toHaveCount(2);
  await page.getByRole("button", { name: "Add expense" }).click();
  await expect(page.getByText("Expense saved.")).toBeVisible();
  await expect(page.getByText("Lunch", { exact: true })).toBeVisible();
  expect(mock.attempts).toHaveLength(1);
  expect(mock.attempts[0].user).toBe("alice");
  expect(mock.attempts[0].key).toBeTruthy();
  expect(mock.attempts[0].body).toEqual({ description: "Lunch", paid_by: "alice", amount: "100.00", split: { type: "equal", members: ["alice", "bob", "carol"] } });
});

test("exact split shows remaining and over-allocated amounts before allowing submission", async ({ page }) => {
  const mock = await installApi(page);
  await openTrip(page);
  await fillExpense(page, "Exact dinner");
  await page.getByLabel("Amount").fill("10.005");
  await expect(page.getByText("Enter a positive amount with up to two decimal places, within the allowed limit.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Add expense" })).toBeDisabled();
  await page.getByLabel("Amount").fill("100.00");
  await page.getByRole("button", { name: "Exact amounts" }).click();
  await page.getByRole("checkbox", { name: "Carol" }).uncheck();
  await page.getByLabel("Paid by").selectOption("bob");
  await page.getByLabel("Alice share").fill("60.00");
  await page.getByLabel("Bob share").fill("30.00");
  await expect(page.getByText("Remaining", { exact: true })).toBeVisible();
  await expect(page.getByText("10.00 THB", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Add expense" })).toBeDisabled();
  await page.getByLabel("Bob share").fill("50.00");
  await expect(page.getByText("Over by", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Add expense" })).toBeDisabled();
  await page.getByLabel("Bob share").fill("40.00");
  await expect(page.getByRole("button", { name: "Add expense" })).toBeEnabled();
  await page.getByLabel("Bob share").fill("40.005");
  await expect(page.getByText("Enter a positive share for each selected member, with at most two decimal places.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Add expense" })).toBeDisabled();
  await page.getByLabel("Bob share").fill("40.00");
  await page.getByRole("button", { name: "Equally" }).click();
  await page.getByRole("button", { name: "Exact amounts" }).click();
  await expect(page.getByLabel("Alice share")).toHaveValue("60.00");
  await expect(page.getByLabel("Bob share")).toHaveValue("40.00");
  await expect(page.getByRole("checkbox", { name: "Carol" })).not.toBeChecked();
  await page.getByRole("button", { name: "Add expense" }).click();
  await expect(page.getByText("Expense saved.")).toBeVisible();
  expect(mock.attempts[0].body).toEqual({ description: "Exact dinner", paid_by: "bob", amount: "100.00", split: { type: "exact", shares: { alice: "60.00", bob: "40.00" } } });
});

test("keeps the selected design usable on a narrow mobile viewport", async ({ page }) => {
  await installApi(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await openTrip(page);
  await expect(page.getByRole("heading", { name: "Add an expense" })).toBeVisible();
  await expect(page.getByLabel("Description")).toBeVisible();
  const fitsViewport = await page.locator("body").evaluate((body) => body.scrollWidth <= window.innerWidth);
  expect(fitsViewport).toBe(true);
});

test("payer can confirm deletion but another member cannot see the delete action", async ({ page }) => {
  await installApi(page);
  await openTrip(page);
  await page.getByLabel("Select user").selectOption("bob");
  await expect(page.getByText("Dinner", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Delete Dinner" })).toHaveCount(0);
  await page.getByLabel("Select user").selectOption("alice");
  await expect(page.getByRole("button", { name: "Delete Dinner" })).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Delete Dinner" }).click();
  await expect(page.getByText("Expense deleted.")).toBeVisible();
  await expect(page.getByText("Dinner", { exact: true })).toHaveCount(0);
});

test("reports a delete that succeeded when refreshing the list fails", async ({ page }) => {
  await installApi(page, { failDeleteRefresh: true });
  await openTrip(page);
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Delete Dinner" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Expense deleted, but the latest data could not be loaded." })).toBeVisible();
  await expect(page.getByRole("button", { name: "Try refreshing" })).toBeVisible();
  await expect(page.getByText("Dinner", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Try refreshing" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Group data refreshed." })).toBeVisible();
});

test("retries an uncertain create with the original idempotency key and payload", async ({ page }) => {
  const mock = await installApi(page, { failFirstCreate: true, delayCreateMs: 350 });
  await openTrip(page);
  await fillExpense(page, "Retry dinner");
  await page.getByRole("button", { name: "Add expense" }).click();
  await expect(page.getByLabel("Select user")).toBeDisabled();
  await expect(page.getByRole("alert").filter({ hasText: "could not confirm" })).toBeVisible();
  await expect(page.getByLabel("Select user")).toBeEnabled();
  await page.getByLabel("Description").fill("A different expense in progress");
  await page.getByLabel("Amount").fill("42.00");
  await page.getByRole("button", { name: "Retry the same expense" }).click();
  await expect(page.getByText("Expense saved.")).toBeVisible();
  expect(mock.attempts).toHaveLength(2);
  expect(mock.attempts[0]).toEqual(mock.attempts[1]);
  expect(mock.attempts[0].key).toBeTruthy();
  await expect(page.getByLabel("Description")).toHaveValue("A different expense in progress");
  await expect(page.getByLabel("Amount")).toHaveValue("42.00");
});

test("distinguishes successful creation from a later refresh failure", async ({ page }) => {
  const mock = await installApi(page, { failRefresh: true });
  await openTrip(page);
  await fillExpense(page, "Saved before refresh error");
  await page.getByRole("button", { name: "Add expense" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Expense saved, but the latest data could not be loaded." })).toBeVisible();
  await expect(page.getByRole("button", { name: "Try refreshing" })).toBeVisible();
  expect(mock.attempts).toHaveLength(1);
});
