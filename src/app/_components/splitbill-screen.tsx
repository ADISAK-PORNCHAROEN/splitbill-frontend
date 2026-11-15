"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { ApiError, SplitbillApi, type CreateExpense, type Expense } from "@/lib/api/splitbill";
import { BalancePanel, ExpenseForm, ExpensesPanel, GroupHeading, GroupPicker, WorkspaceHeader } from "./workspace";

type Attempt = { user: string; groupId: number; groupName: string; payload: CreateExpense; key: string; formVersion: number; formRevision: number };
type Operation =
  | { kind: "idle" }
  | { kind: "creating"; attempt: Attempt }
  | { kind: "uncertain"; attempt: Attempt }
  | { kind: "deleting" };
type GroupContext = { user: string; groupId: number };
type Notice = { kind: "success" | "error"; message: string; refresh?: GroupContext };

const api = new SplitbillApi(process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000");

function message(error: unknown) {
  return error instanceof ApiError ? error.message : "Something went wrong. Please try again.";
}

function outcomeUnknown(error: unknown) {
  return !(error instanceof ApiError) || error.kind !== "http" || (error.status !== undefined && (error.status === 408 || error.status >= 500));
}

export function SplitbillScreen() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState("alice");
  const [chosenGroup, setChosenGroup] = useState<number | null>(null);
  const [dirty, setDirty] = useState(false);
  const [formVersion, setFormVersion] = useState(0);
  const [operation, setOperation] = useState<Operation>({ kind: "idle" });
  const [notice, setNotice] = useState<Notice | null>(null);
  const inFlight = useRef(false);
  const formRevision = useRef(0);
  const busy = operation.kind === "creating" || operation.kind === "deleting";

  const groups = useQuery({
    queryKey: ["groups", user], queryFn: ({ signal }) => api.groups(user, signal), retry: false,
  });
  const groupId = groups.data?.some((group) => group.id === chosenGroup)
    ? chosenGroup : groups.data?.[0]?.id ?? null;
  const group = useQuery({
    queryKey: ["group", user, groupId],
    queryFn: ({ signal }) => { if (groupId === null) throw new Error("No group selected"); return api.group(user, groupId, signal); }, enabled: groupId !== null, retry: false,
  });
  const expenses = useQuery({
    queryKey: ["expenses", user, groupId],
    queryFn: ({ signal }) => { if (groupId === null) throw new Error("No group selected"); return api.expenses(user, groupId, signal); }, enabled: groupId !== null, retry: false,
  });
  const balances = useQuery({
    queryKey: ["balances", user, groupId],
    queryFn: ({ signal }) => { if (groupId === null) throw new Error("No group selected"); return api.balances(user, groupId, signal); }, enabled: groupId !== null, retry: false,
  });

  async function refresh(currentUser: string, currentGroup: number) {
    await Promise.all([
      queryClient.cancelQueries({ queryKey: ["expenses", currentUser, currentGroup], exact: true }),
      queryClient.cancelQueries({ queryKey: ["balances", currentUser, currentGroup], exact: true }),
    ]);
    await Promise.all([
      queryClient.fetchQuery({ queryKey: ["expenses", currentUser, currentGroup], queryFn: ({ signal }) => api.expenses(currentUser, currentGroup, signal), staleTime: 0, retry: false }),
      queryClient.fetchQuery({ queryKey: ["balances", currentUser, currentGroup], queryFn: ({ signal }) => api.balances(currentUser, currentGroup, signal), staleTime: 0, retry: false }),
    ]);
  }

  function allowSelectionChange() {
    return !dirty || window.confirm("You have an unsaved expense. Discard it and continue?");
  }

  function changeUser(next: string) {
    if (next === user || busy || inFlight.current || !allowSelectionChange()) return;
    setUser(next);
    setChosenGroup(null);
    setDirty(false);
    setFormVersion((current) => current + 1);
    setNotice(null);
  }

  function changeGroup(next: number) {
    if (next === groupId || busy || inFlight.current || !allowSelectionChange()) return;
    setChosenGroup(next);
    setDirty(false);
    setFormVersion((current) => current + 1);
    setNotice(null);
  }

  async function sendAttempt(attempt: Attempt, retry = false) {
    if (inFlight.current) return;
    inFlight.current = true;
    setOperation({ kind: "creating", attempt });
    setNotice(null);
    try {
      await api.createExpense(attempt.user, attempt.groupId, attempt.payload, attempt.key);
    } catch (error) {
      if (retry || outcomeUnknown(error)) {
        setOperation({ kind: "uncertain", attempt });
        if (retry && error instanceof ApiError && error.kind === "http") {
          setNotice({ kind: "error", message: `Retry failed: ${message(error)} The earlier outcome is still unknown.` });
        }
      } else {
        setOperation({ kind: "idle" });
        setNotice({ kind: "error", message: message(error) });
      }
      inFlight.current = false;
      return;
    }
    if (attempt.user === user && attempt.groupId === groupId && attempt.formVersion === formVersion && attempt.formRevision === formRevision.current) {
      setDirty(false);
      setFormVersion((current) => current + 1);
    }
    try {
      await refresh(attempt.user, attempt.groupId);
      setNotice({ kind: "success", message: attempt.user === user && attempt.groupId === groupId ? "Expense saved." : `Expense saved for ${attempt.groupName} as ${attempt.user}.` });
    } catch {
      setNotice({ kind: "error", message: "Expense saved, but the latest data could not be loaded.", refresh: { user: attempt.user, groupId: attempt.groupId } });
    } finally {
      setOperation({ kind: "idle" });
      inFlight.current = false;
    }
  }

  function createExpense(payload: CreateExpense) {
    if (groupId === null || !group.data || inFlight.current) return;
    if (operation.kind === "uncertain" && !window.confirm("The previous expense may already have been saved. Sending a new expense could create a duplicate. Continue?")) return;
    void sendAttempt({ user, groupId, groupName: group.data.name, payload: structuredClone(payload), key: crypto.randomUUID(), formVersion, formRevision: formRevision.current });
  }

  async function deleteExpense(expense: Expense) {
    if (groupId === null || inFlight.current || expense.paid_by !== user) return;
    if (!window.confirm(`Delete “${expense.description}”? This will remove it from the group balances.`)) return;
    inFlight.current = true;
    const previous: Operation = operation.kind === "uncertain" ? operation : { kind: "idle" };
    setOperation({ kind: "deleting" });
    setNotice(null);
    try {
      await api.deleteExpense(user, groupId, expense.id);
      try {
        await refresh(user, groupId);
        setNotice({ kind: "success", message: "Expense deleted." });
      } catch {
        setNotice({ kind: "error", message: "Expense deleted, but the latest data could not be loaded.", refresh: { user, groupId } });
      }
    } catch (error) {
      setNotice({ kind: "error", message: outcomeUnknown(error) ? "We could not confirm whether the expense was deleted. Refresh the group to check." : message(error), refresh: outcomeUnknown(error) ? { user, groupId } : undefined });
    } finally {
      setOperation(previous);
      inFlight.current = false;
    }
  }

  async function refreshContext(context: GroupContext) {
    if ((context.user !== user || context.groupId !== groupId) && !allowSelectionChange()) return;
    if (context.user !== user || context.groupId !== groupId) {
      setUser(context.user);
      setChosenGroup(context.groupId);
      setDirty(false);
      setFormVersion((current) => current + 1);
    }
    try {
      await refresh(context.user, context.groupId);
      setNotice({ kind: "success", message: "Group data refreshed." });
    } catch {
      setNotice({ kind: "error", message: "Could not refresh group data. Please try again.", refresh: context });
    }
  }

  async function checkAttempt(attempt: Attempt) {
    if ((attempt.user !== user || attempt.groupId !== groupId) && !allowSelectionChange()) return;
    if (attempt.user !== user || attempt.groupId !== groupId) {
      setUser(attempt.user);
      setChosenGroup(attempt.groupId);
      setDirty(false);
      setFormVersion((current) => current + 1);
    }
    try {
      await refresh(attempt.user, attempt.groupId);
      setNotice({ kind: "success", message: "Original group refreshed. The earlier request may still be processing; retry the same expense to confirm." });
    } catch {
      setNotice({ kind: "error", message: "Could not refresh the original group. Please try again." });
    }
  }

  return (
    <main className="sb-app">
      <WorkspaceHeader user={user} onUserChange={changeUser} disabled={busy} />
      <div className="sb-shell">
        {operation.kind === "uncertain" && (
          <div className="sb-error" role="alert">
            <p>We could not confirm whether the expense was saved for {operation.attempt.groupName} as {operation.attempt.user}. Check the list before making a new expense to avoid a duplicate.</p>
            <div className="sb-actions">
              <button type="button" onClick={() => void sendAttempt(operation.attempt, true)}>Retry the same expense</button>
              <button type="button" onClick={() => void checkAttempt(operation.attempt)}>View and refresh original group</button>
            </div>
          </div>
        )}
        {notice && <div className={notice.kind === "error" ? "sb-error" : "sb-notice"} role={notice.kind === "error" ? "alert" : "status"}><span>{notice.message}</span>{notice.refresh && <button type="button" onClick={() => notice.refresh && void refreshContext(notice.refresh)}>Try refreshing</button>}</div>}
        {groups.isPending ? <p role="status">Loading groups…</p> : groups.isError ? (
          <div className="sb-error" role="alert"><p>{message(groups.error)}</p><button type="button" onClick={() => void groups.refetch()}>Try again</button></div>
        ) : groups.data.length === 0 ? <div className="sb-empty"><h1>No groups yet</h1><p>There are no groups for this user.</p></div> : (
          <>
            <GroupPicker groups={groups.data} groupId={groupId} onGroupChange={changeGroup} disabled={busy} />
            {group.isPending ? <p role="status">Loading group…</p> : group.isError ? <div className="sb-error" role="alert"><p>{message(group.error)}</p><button type="button" onClick={() => void group.refetch()}>Try again</button></div> : group.data && (
              <>
                <GroupHeading group={group.data} />
                <div className="sb-layout">
                  <div className="sb-left">
                    {balances.isPending ? <p role="status">Loading balances…</p> : balances.isError ? <div className="sb-error" role="alert"><p>{message(balances.error)}</p><button type="button" onClick={() => void balances.refetch()}>Try again</button></div> : <BalancePanel balances={balances.data ?? []} user={user} />}
                    {expenses.isPending ? <p role="status">Loading expenses…</p> : expenses.isError ? <div className="sb-error" role="alert"><p>{message(expenses.error)}</p><button type="button" onClick={() => void expenses.refetch()}>Try again</button></div> : <ExpensesPanel expenses={expenses.data ?? []} user={user} onDelete={(expense) => void deleteExpense(expense)} disabled={busy} />}
                  </div>
                  <ExpenseForm key={`${user}-${groupId}-${formVersion}`} user={user} members={group.data.members} busy={busy} onDirtyChange={(value) => { if (value) formRevision.current += 1; setDirty(value); }} onSubmit={createExpense} />
                </div>
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}
