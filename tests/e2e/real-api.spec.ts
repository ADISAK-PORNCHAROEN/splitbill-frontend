import { expect, test } from "@playwright/test";

const apiOrigin = process.env.SPLITBILL_REAL_API_URL ?? "http://127.0.0.1:8000";
const enabled = process.env.SPLITBILL_REAL_API === "1";

test.skip(!enabled, "Set SPLITBILL_REAL_API=1 to run against an isolated local backend database.");

test("completes equal and exact expenses against the real local API", async ({ page, request }) => {
  test.setTimeout(60_000);
  const apiUrl = new URL(apiOrigin);
  if (apiUrl.hostname !== "127.0.0.1" && apiUrl.hostname !== "localhost") {
    throw new Error("The real API browser test only allows a local API host.");
  }

  const marker = `Codex verification ${crypto.randomUUID()}`;
  const equalDescription = `${marker} equal`;
  const exactDescription = `${marker} exact`;
  const createdIds: number[] = [];
  const api = `${apiOrigin.replace(/\/$/, "")}/groups/1/expenses`;
  const headers = { "X-User": "alice" };

  async function balances() {
    const response = await request.get(`${apiOrigin}/groups/1/balances`, { headers });
    expect(response.status()).toBe(200);
    const data = await response.json() as { member: string; balance: string }[];
    const total = data.reduce((sum, item) => sum + decimalToSatang(item.balance), BigInt(0));
    expect(total).toBe(BigInt(0));
    return data;
  }

  try {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Chiang Mai trip" })).toBeVisible();
    await expect(page.getByText("3 members")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Balances" })).toBeVisible();
    await expect(page.getByLabel("Select group").locator("option")).toHaveCount(2);

    const createEqualRequest = page.waitForRequest((req) => req.method() === "POST" && req.url() === api);
    await page.getByLabel("Description").fill(equalDescription);
    await page.getByLabel("Amount").fill("100.00");
    const beforeEqual = await page.getByRole("button", { name: "Add expense" }).isEnabled();
    expect(beforeEqual).toBe(true);
    await page.getByRole("button", { name: "Add expense" }).click();
    const equalRequest = await createEqualRequest;
    const equalPayload = equalRequest.postDataJSON() as {
      description: string; paid_by: string; amount: string; split: { type: string; members?: string[] };
    };
    const equalResponse = await equalRequest.response();
    expect(equalResponse?.status()).toBe(201);
    const equalExpense = await equalResponse!.json() as { id: number; amount: string; shares: Record<string, string> };
    createdIds.push(equalExpense.id);
    expect(equalPayload.amount).toBe("100.00");
    expect(equalPayload.split).toEqual({ type: "equal", members: ["alice", "bob", "carol"] });
    expect(equalExpense.shares).toEqual({ alice: "33.34", bob: "33.33", carol: "33.33" });
    await expect(page.getByText(equalDescription, { exact: true })).toBeVisible();
    await expect(page.getByRole("status").filter({ hasText: "Expense saved." })).toBeVisible();
    await expect(page.getByText("Gets back").first()).toBeVisible();
    await expect(page.getByText("Owes").first()).toBeVisible();
    const key = equalRequest.headers()["idempotency-key"];
    expect(key).toBeTruthy();

    const replayResponse = await request.post(api, { headers: { ...headers, "Idempotency-Key": key! }, data: equalPayload });
    expect(replayResponse.status()).toBe(200);
    expect((await replayResponse.json()).id).toBe(equalExpense.id);
    await balances();

    await page.getByLabel("Select user").selectOption("bob");
    await expect(page.getByText(equalDescription, { exact: true })).toBeVisible();
    await expect(page.getByLabel("Select group").locator("option")).toHaveCount(3);
    await expect(page.getByRole("button", { name: `Delete ${equalDescription}` })).toHaveCount(0);
    const forbiddenDelete = await request.delete(`${api}/${equalExpense.id}`, { headers: { "X-User": "bob" } });
    expect(forbiddenDelete.status()).toBe(403);

    await page.getByLabel("Select user").selectOption("alice");
    await expect(page.getByRole("button", { name: `Delete ${equalDescription}` })).toBeVisible();

    const inaccessibleGroup = await request.get(`${apiOrigin}/groups/2`, { headers });
    expect(inaccessibleGroup.status()).toBe(404);
    const invalidAmount = await request.post(api, {
      headers: { ...headers, "Idempotency-Key": `${marker}-invalid` },
      data: { description: marker, paid_by: "alice", amount: "10.005", split: { type: "equal", members: ["alice", "bob", "carol"] } },
    });
    expect(invalidAmount.status()).toBe(400);

    await page.getByLabel("Description").fill(exactDescription);
    await page.getByLabel("Amount").fill("100.00");
    await page.getByRole("button", { name: "Exact amounts" }).click();
    await page.getByRole("checkbox", { name: "Carol" }).uncheck();
    await page.getByLabel("Alice share").fill("50.00");
    await page.getByLabel("Bob share").fill("50.00");
    expect(await page.getByRole("button", { name: "Add expense" }).isEnabled()).toBe(true);
    const createExactRequest = page.waitForRequest((req) => req.method() === "POST" && req.url() === api);
    await page.getByRole("button", { name: "Add expense" }).click();
    const exactRequest = await createExactRequest;
    const exactResponse = await exactRequest.response();
    expect(exactResponse?.status()).toBe(201);
    const exactExpense = await exactResponse!.json() as { id: number; shares: Record<string, string> };
    createdIds.push(exactExpense.id);
    expect(exactExpense.shares).toEqual({ alice: "50.00", bob: "50.00" });
    await expect(page.getByText(exactDescription, { exact: true })).toBeVisible();
    const expenseListResponse = await request.get(api, { headers });
    const listedExpenses = await expenseListResponse.json() as { description: string }[];
    expect(listedExpenses.slice(0, 2).map((expense) => expense.description)).toEqual([exactDescription, equalDescription]);
    await balances();

    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: `Delete ${equalDescription}` }).click();
    await expect(page.getByText("Expense deleted.")).toBeVisible();
    await expect(page.getByText(equalDescription, { exact: true })).toHaveCount(0);

    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: `Delete ${exactDescription}` }).click();
    await expect(page.getByText("Expense deleted.")).toBeVisible();
    await expect(page.getByText(exactDescription, { exact: true })).toHaveCount(0);
    await balances();
    await expect(page.getByText("Settled up")).toHaveCount(3);
  } finally {
    for (const id of createdIds.reverse()) {
      const response = await request.delete(`${api}/${id}`, { headers });
      expect([204, 404]).toContain(response.status());
    }
  }
});

function decimalToSatang(value: string): bigint {
  const match = /^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(value);
  if (!match) throw new Error(`Unexpected money value: ${value}`);
  const magnitude = BigInt(match[2]) * BigInt(100) + BigInt((match[3] ?? "").padEnd(2, "0"));
  return match[1] ? -magnitude : magnitude;
}
