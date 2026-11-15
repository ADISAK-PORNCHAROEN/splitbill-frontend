"use client";

import { useState, type FormEvent } from "react";
import "../splitbill.css";
import type { Balance, CreateExpense, Expense, Group, GroupDetail } from "@/lib/api/splitbill";
import { allocateEqual, validateExact } from "@/lib/splitbill/allocation";
import { formatMoney, parseExpenseMoney, parseMoney, toDecimalString } from "@/lib/splitbill/money";

const users = ["alice", "bob", "carol", "dan"];
const displayName = (name: string) => name ? name[0].toUpperCase() + name.slice(1) : "";
const initials = (name: string) => name.slice(0, 1).toUpperCase();
const palette = ["a", "b", "c", "d"];

function Avatar({ name, index = 0 }: { name: string; index?: number }) {
  return <span className={`sb-avatar sb-avatar-${palette[index % palette.length]}`} aria-hidden="true">{initials(name)}</span>;
}

export function WorkspaceHeader({ user, onUserChange, disabled }: { user: string; onUserChange: (user: string) => void; disabled: boolean }) {
  return (
    <header className="sb-header h-[73px] border-b border-[#eeedef] bg-white">
      <div className="sb-header-inner mx-auto flex h-full max-w-[1200px] items-center justify-between px-8 max-[800px]:px-5">
        <div className="sb-brand"><span className="sb-logo" aria-hidden="true">s</span><span>splitbill<span className="sb-brand-dot">.</span></span></div>
        <label className="sb-user"><span>Viewing as</span><Avatar name={user || "?"} /><select aria-label="Select user" value={user} onChange={(event) => onUserChange(event.target.value)} disabled={disabled}>
          {!user && <option value="">Select user</option>}
          {users.map((name) => <option key={name} value={name}>{displayName(name)}</option>)}
        </select></label>
      </div>
    </header>
  );
}

export function GroupPicker({ groups, groupId, onGroupChange, disabled }: { groups: Group[]; groupId: number | null; onGroupChange: (id: number) => void; disabled: boolean }) {
  return <label className="sb-group-picker">Group<select aria-label="Select group" value={groupId ?? ""} onChange={(event) => { if (event.target.value) onGroupChange(Number(event.target.value)); }} disabled={disabled || groups.length === 0}>
    <option value="">Select group</option>
    {groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
  </select></label>;
}

export function GroupHeading({ group }: { group: GroupDetail }) {
  return <div className="sb-topline"><div><h1>{group.name}</h1><p className="sb-subtitle">A little easier to split, together.</p></div><div className="sb-group-members"><div className="sb-avatar-stack">{group.members.map((member, i) => <Avatar key={member} name={member} index={i} />)}</div><span>{group.members.length} {group.members.length === 1 ? "member" : "members"}</span></div></div>;
}

export function BalancePanel({ balances, user }: { balances: Balance[]; user: string }) {
  return <section className="sb-section" aria-labelledby="balances-heading"><div className="sb-section-title"><div><h2 id="balances-heading">Balances</h2><p>Who owes what in this group</p></div><span className="sb-unit">THB</span></div><div className="sb-people">{balances.map((balance, i) => {
    const value = parseMoney(balance.balance);
    return <div className="sb-person" key={balance.member}><Avatar name={balance.member} index={i} /><span className="sb-person-name"><strong>{displayName(balance.member)} {balance.member === user && <small>you</small>}</strong><span>{value === null ? "Balance unavailable" : value > BigInt(0) ? "Gets back" : value < BigInt(0) ? "Owes" : "Settled up"}</span></span><strong className={value !== null && value > BigInt(0) ? "sb-get" : undefined}>{value === null ? "—" : `${value > BigInt(0) ? "+" : ""}${formatMoney(value)}`}</strong></div>;
  })}</div></section>;
}

export function ExpensesPanel({ expenses, user, onDelete, disabled }: { expenses: Expense[]; user: string; onDelete: (expense: Expense) => void; disabled: boolean }) {
  return <section className="sb-section sb-activity" aria-labelledby="expenses-heading"><div className="sb-section-title"><div><h2 id="expenses-heading">Expenses</h2><p>Everything shared in this group</p></div><span className="sb-count">{expenses.length} {expenses.length === 1 ? "expense" : "expenses"}</span></div>{expenses.length === 0 ? <p className="sb-empty">No expenses yet. Add one to get started.</p> : <div className="sb-expenses">{expenses.map((expense) => {
    const value = parseMoney(expense.amount);
    return <div className="sb-expense" key={expense.id}><span className="sb-expense-symbol" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M5 5h14M6 5l1.2 12h9.6L18 5M9 5V3m6 2V3M9 10h6m-5 3h4" strokeLinecap="round" strokeLinejoin="round"/></svg></span><div className="sb-expense-info"><strong>{expense.description}</strong><span>Paid by {displayName(expense.paid_by)} · Split {Object.keys(expense.shares).length} ways</span></div><div className="sb-expense-total"><strong>{value === null ? "—" : formatMoney(value)}</strong><span>THB</span></div>{expense.paid_by === user && <button className="sb-delete" type="button" disabled={disabled} onClick={() => onDelete(expense)} aria-label={`Delete ${expense.description}`}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M4 7h16M10 11v5m4-5v5M6 7l1 12h10l1-12M9 7V5h6v2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>}</div>;
  })}</div>}</section>;
}

type SplitMode = "equal" | "exact";
export function ExpenseForm({ user, members, busy, onDirtyChange, onSubmit }: { user: string; members: string[]; busy: boolean; onDirtyChange: (dirty: boolean) => void; onSubmit: (payload: CreateExpense) => void }) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [payer, setPayer] = useState(members.includes(user) ? user : members[0] ?? "");
  const [mode, setMode] = useState<SplitMode>("equal");
  const [selected, setSelected] = useState<string[]>(members);
  const [exactDraft, setExactDraft] = useState<Record<string, string>>({});
  const [amountTouched, setAmountTouched] = useState(false);
  const total = parseExpenseMoney(amount);
  const participants = members.filter((member) => selected.includes(member));
  const parsedShares = participants.map((member) => ({ member, satang: parseExpenseMoney(exactDraft[member] ?? "") }));
  const sum = parsedShares.reduce((current, share) => current + (share.satang ?? BigInt(0)), BigInt(0));
  const exactValues = parsedShares.flatMap((share) => share.satang === null ? [] : [{ member: share.member, satang: share.satang }]);
  const exactValid = total !== null && exactValues.length === participants.length && validateExact(total, exactValues);
  const preview = total !== null && participants.length ? allocateEqual(total, participants) : [];
  const canSubmit = !busy && description.trim().length > 0 && total !== null && members.includes(payer) && participants.length > 0 && (mode === "equal" || exactValid);
  function dirty() { onDirtyChange(true); }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit || total === null) return;
    const split: CreateExpense["split"] = mode === "equal" ? { type: "equal", members: participants } : { type: "exact", shares: Object.fromEntries(exactValues.map(({ member, satang }) => [member, toDecimalString(satang)])) };
    onSubmit({ description: description.trim(), paid_by: payer, amount: toDecimalString(total), split });
  }
  return <section className="sb-form-panel" aria-labelledby="add-heading"><div className="sb-form-title"><div><h2 id="add-heading">Add an expense</h2><p>Keep everyone in the loop.</p></div><span className="sb-form-plus" aria-hidden="true">+</span></div>
    <form onSubmit={submit} noValidate><label className="sb-field">Description<input name="description" value={description} onChange={(event) => { setDescription(event.target.value); dirty(); }} placeholder="What was it for?" required disabled={busy} /></label>
      <div className="sb-field-grid"><label className="sb-field">Amount<div className="sb-amount"><input name="amount" value={amount} onChange={(event) => { setAmount(event.target.value); setAmountTouched(true); dirty(); }} inputMode="decimal" aria-invalid={amountTouched && total === null} aria-describedby={amountTouched && total === null ? "amount-error" : undefined} required disabled={busy}/><span>THB</span></div></label><label className="sb-field">Paid by<select value={payer} onChange={(event) => { setPayer(event.target.value); dirty(); }} disabled={busy}>{members.map((member) => <option key={member} value={member}>{displayName(member)}</option>)}</select></label></div>
      {amountTouched && total === null && <p className="sb-error" id="amount-error">Enter a positive amount with up to two decimal places, within the allowed limit.</p>}
      <fieldset className="sb-split" disabled={busy}><legend>Split type</legend><div className="sb-tabs"><button type="button" aria-pressed={mode === "equal"} onClick={() => { setMode("equal"); dirty(); }}>Equally</button><button type="button" aria-pressed={mode === "exact"} onClick={() => { setMode("exact"); dirty(); }}>Exact amounts</button></div></fieldset>
      <div className="sb-share-head"><strong>Split between</strong><span>{participants.length} {participants.length === 1 ? "person" : "people"}</span></div>
      <div className="sb-shares">{members.map((member, index) => { const share = preview.find((item) => item.member === member); return <div className="sb-share" key={member}><label><input type="checkbox" checked={selected.includes(member)} onChange={(event) => { setSelected((current) => event.target.checked ? [...current, member] : current.filter((name) => name !== member)); dirty(); }} disabled={busy}/><Avatar name={member} index={index} /><span>{displayName(member)}</span></label>{mode === "exact" && selected.includes(member) ? <input className="sb-exact-input" aria-label={`${displayName(member)} share`} inputMode="decimal" value={exactDraft[member] ?? ""} onChange={(event) => { setExactDraft((current) => ({ ...current, [member]: event.target.value })); dirty(); }} aria-invalid={parseExpenseMoney(exactDraft[member] ?? "") === null} aria-describedby={parseExpenseMoney(exactDraft[member] ?? "") === null ? "share-error" : undefined} disabled={busy}/> : <strong>{mode === "equal" && share ? formatMoney(share.satang) : "—"}</strong>}</div>; })}</div>
      {mode === "exact" && total !== null && <p className="sb-remaining"><span>{sum > total ? "Over by" : "Remaining"}</span><strong>{formatMoney(sum > total ? sum - total : total - sum)} THB</strong></p>}
      {mode === "exact" && participants.some((member) => parseExpenseMoney(exactDraft[member] ?? "") === null) && <p className="sb-error" id="share-error">Enter a positive share for each selected member, with at most two decimal places.</p>}
      <button className="sb-submit" type="submit" disabled={!canSubmit}>{busy ? "Saving…" : "Add expense"}</button>
    </form>
  </section>;
}
