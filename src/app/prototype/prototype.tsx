"use client";

import { useState } from "react";

const people = ["Alice", "Bob", "Carol"];

function parseAmount(input: string): number | null {
  if (!/^\d{1,7}(\.\d{0,2})?$/.test(input)) return null;
  const [whole, fraction = ""] = input.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}

function formatAmount(satang: number) {
  return `${Math.floor(Math.abs(satang) / 100).toLocaleString("en-US")}.${String(Math.abs(satang) % 100).padStart(2, "0")}`;
}

export function Prototype() {
  const [mode, setMode] = useState<"equal" | "exact">("equal");
  const [amount, setAmount] = useState("100.00");
  const [shares, setShares] = useState(["33.34", "33.33", "33.33"]);
  const [selected, setSelected] = useState([true, true, true]);
  const [notice, setNotice] = useState("");
  const total = parseAmount(amount);
  const selectedCount = selected.filter(Boolean).length;
  const exactShares = shares.map(parseAmount);
  const exactTotal = exactShares.reduce<number>((sum, value, i) => sum + (selected[i] ? value ?? 0 : 0), 0);
  const remaining = total === null ? null : total - exactTotal;
  const exactValid = selected.every((checked, i) => !checked || (exactShares[i] !== null && (exactShares[i] ?? 0) > 0));
  const canSubmit = total !== null && total > 0 && selectedCount > 0 && (mode === "equal" || (exactValid && remaining === 0));
  let position = 0;
  const preview = selected.map((checked, i) => {
    if (!checked || total === null || !selectedCount) return null;
    if (mode === "exact") return exactShares[i];
    const current = position++;
    return Math.floor(total / selectedCount) + (current < total % selectedCount ? 1 : 0);
  });

  return (
    <main className="demo">
      <div className="demo-banner">DESIGN PREVIEW <span>Sample data · Nothing is saved</span></div>
      <header className="demo-header">
        <div className="demo-header-inner">
          <div className="demo-brand"><span className="demo-logo" aria-hidden="true">s</span><span>splitbill<span className="demo-brand-dot">.</span></span></div>
          <div className="demo-user"><span>Viewing as</span><span className="demo-avatar demo-avatar-a">A</span><select aria-label="Example user" defaultValue="Alice" disabled><option>Alice</option></select></div>
        </div>
      </header>
      <div className="demo-shell">
        <div className="demo-topline"><div><label className="demo-back">Group <select aria-label="Example group" defaultValue="Chiang Mai trip" disabled><option>Chiang Mai trip</option></select></label><h1>Chiang Mai trip</h1><p className="demo-subtitle">A little easier to split, together.</p></div><div className="demo-group-members"><div className="demo-avatar-stack"><span className="demo-avatar demo-avatar-a">A</span><span className="demo-avatar demo-avatar-b">B</span><span className="demo-avatar demo-avatar-c">C</span></div><span>3 members</span></div></div>
        <div className="demo-layout">
          <div className="demo-left">
            <section className="demo-section" aria-labelledby="balances-heading"><div className="demo-section-title"><div><h2 id="balances-heading">Balances</h2><p>Who owes what in this group</p></div><span className="demo-unit">THB</span></div><div className="demo-people">
              <div className="demo-person"><span className="demo-avatar demo-avatar-a">A</span><span className="demo-person-name"><strong>Alice <small>you</small></strong><span>Gets back</span></span><strong className="demo-get">+666.66</strong></div>
              <div className="demo-person"><span className="demo-avatar demo-avatar-b">B</span><span className="demo-person-name"><strong>Bob</strong><span>Owes</span></span><strong>−333.33</strong></div>
              <div className="demo-person"><span className="demo-avatar demo-avatar-c">C</span><span className="demo-person-name"><strong>Carol</strong><span>Owes</span></span><strong>−333.33</strong></div>
            </div></section>
            <section className="demo-section demo-activity" aria-labelledby="expenses-heading"><div className="demo-section-title"><div><h2 id="expenses-heading">Expenses</h2><p>Everything shared in this group</p></div><span className="demo-count">1 expense</span></div><div className="demo-expense"><span className="demo-expense-symbol" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M5 5h14M6 5l1.2 12h9.6L18 5M9 5V3m6 2V3M9 10h6m-5 3h4" strokeLinecap="round" strokeLinejoin="round"/></svg></span><div className="demo-expense-info"><strong>Dinner at the night market</strong><span>Paid by Alice · Split 3 ways</span></div><div className="demo-expense-total"><strong>1,000.00</strong><span>THB</span></div><button className="demo-delete" type="button" onClick={() => setNotice("This is a preview. No expense was deleted.")} aria-label="Delete example expense"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M4 7h16M10 11v5m4-5v5M6 7l1 12h10l1-12M9 7V5h6v2" strokeLinecap="round" strokeLinejoin="round"/></svg></button></div></section>
            <div className="demo-safe"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="m5 12 4 4L19 6" strokeLinecap="round" strokeLinejoin="round"/></svg> Everyone’s balances add up to 0.00</div>
          </div>
          <section className="demo-form-panel" aria-labelledby="add-heading"><div className="demo-form-title"><div><h2 id="add-heading">Add an expense</h2><p>Keep everyone in the loop.</p></div><span className="demo-form-plus" aria-hidden="true">+</span></div>
            <form onSubmit={(event) => { event.preventDefault(); setNotice("This is a design preview. Nothing was saved."); }}>
              <label className="demo-field">Description<input defaultValue="Coffee and pastries" placeholder="What was it for?"/></label>
              <div className="demo-field-grid"><label className="demo-field">Amount<div className="demo-amount"><input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" aria-invalid={total === null || total === 0}/><span>THB</span></div></label><label className="demo-field">Paid by<select defaultValue="Alice"><option>Alice</option><option>Bob</option><option>Carol</option></select></label></div>
              {(total === null || total === 0) && <p className="demo-error" role="alert">Enter a positive amount with up to two decimal places.</p>}
              <fieldset className="demo-split"><legend>Split type</legend><div className="demo-tabs"><button type="button" aria-pressed={mode === "equal"} onClick={() => setMode("equal")}>Equally</button><button type="button" aria-pressed={mode === "exact"} onClick={() => setMode("exact")}>Exact amounts</button></div></fieldset>
              <div className="demo-share-head"><strong>Split between</strong><span>{selectedCount} people</span></div>
              <div className="demo-shares">{people.map((person, i) => <div className="demo-share" key={person}><label><input type="checkbox" checked={selected[i]} onChange={(event) => setSelected((old) => old.map((checked, index) => i === index ? event.target.checked : checked))}/><span className={`demo-avatar demo-avatar-${["a", "b", "c"][i]}`}>{person[0]}</span><span>{person}</span></label>{mode === "exact" && selected[i] ? <input className="demo-exact-input" aria-label={`${person} share`} inputMode="decimal" value={shares[i]} onChange={(event) => setShares((old) => old.map((value, index) => i === index ? event.target.value : value))}/> : <strong>{preview[i] === null ? "—" : formatAmount(preview[i] ?? 0)}</strong>}</div>)}</div>
              {mode === "exact" && remaining !== null && <p className="demo-remaining"><span>{remaining < 0 ? "Over by" : "Remaining"}</span><strong>{formatAmount(remaining)} THB</strong></p>}
              <button className="demo-submit" type="submit" disabled={!canSubmit}>Add expense</button><p className="demo-caption">Preview only. No data will be saved.</p>
            </form>
          </section>
        </div>
      </div>
      {notice && <div className="demo-toast" role="status">{notice}<button type="button" onClick={() => setNotice("")} aria-label="Dismiss notification">×</button></div>}
    </main>
  );
}
