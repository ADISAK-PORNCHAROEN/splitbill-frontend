import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, SplitbillApi } from "../../src/lib/api/splitbill";

const api = new SplitbillApi("http://localhost:8000/");
afterEach(() => vi.unstubAllGlobals());

describe("SplitBill API boundary", () => {
  it("sends the selected identity and exposes parsed group data", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify([{ id: 1, name: "Trip" }])));
    vi.stubGlobal("fetch", fetcher);
    await expect(api.groups("alice")).resolves.toEqual([{ id: 1, name: "Trip" }]);
    expect(fetcher).toHaveBeenCalledWith("http://localhost:8000/groups", expect.objectContaining({ headers: expect.objectContaining({ "X-User": "alice" }) }));
  });

  it("preserves the create request's money strings and idempotency key", async () => {
    const expense = { id: 1, group_id: 1, description: "Dinner", paid_by: "alice", amount: "1.00", shares: { alice: "1.00" }, created_at: "2026-11-15T00:00:00Z" };
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify(expense), { status: 201 }));
    vi.stubGlobal("fetch", fetcher);
    const payload = { description: "Dinner", paid_by: "alice", amount: "1.00", split: { type: "equal" as const, members: ["alice"] } };
    await expect(api.createExpense("alice", 1, payload, "key-1")).resolves.toEqual(expense);
    expect(fetcher).toHaveBeenCalledWith("http://localhost:8000/groups/1/expenses", expect.objectContaining({ method: "POST", body: JSON.stringify(payload), headers: expect.objectContaining({ "Idempotency-Key": "key-1" }) }));
  });

  it("accepts a delete response without JSON", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
    await expect(api.deleteExpense("alice", 1, 7)).resolves.toBeUndefined();
  });

  it("exposes an API error without assuming an error code", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: { code: "future_code", message: "Please try later" } }), { status: 403 })));
    await expect(api.groups("alice")).rejects.toMatchObject({ kind: "http", status: 403, code: "future_code", message: "Please try later" });
  });

  it("rejects invalid response data rather than trusting JSON types", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify([{ member: "alice", balance: 0.3 }]))));
    await expect(api.balances("alice", 1)).rejects.toBeInstanceOf(ApiError);
    await expect(api.balances("alice", 1)).rejects.toMatchObject({ kind: "contract" });
  });

  it("distinguishes a network failure from an API error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    await expect(api.groups("alice")).rejects.toMatchObject({ kind: "network" });
  });

  it("preserves cancellation and forwards its signal", async () => {
    const controller = new AbortController();
    const aborted = new DOMException("Aborted", "AbortError");
    const fetcher = vi.fn().mockRejectedValue(aborted);
    vi.stubGlobal("fetch", fetcher);
    await expect(api.groups("alice", controller.signal)).rejects.toBe(aborted);
    expect(fetcher).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ signal: controller.signal }));
  });

  it("provides a safe fallback when an error response is not JSON", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("bad gateway", { status: 502 })));
    await expect(api.groups("alice")).rejects.toMatchObject({ kind: "http", status: 502, message: "Something went wrong. Please try again." });
  });
});
