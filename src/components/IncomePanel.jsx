import { useState } from "react";
import { formatCurrency } from "../utils/format";

export default function IncomePanel({ income, spent, onSave }) {
  const [value, setValue] = useState("");
  const [editing, setEditing] = useState(false);

  const remaining = income - spent;
  const over = remaining < 0;

  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = Math.max(daysInMonth - now.getDate(), 0);
  const dailySafe = daysLeft > 0 ? Math.max(remaining, 0) / daysLeft : 0;

  const ratio = income > 0 ? Math.min((spent / income) * 100, 100) : 0;

  function submit(event) {
    event.preventDefault();
    const amount = Number(value);
    if (!value || Number.isNaN(amount) || amount < 0) return;
    onSave(amount);
    setValue("");
    setEditing(false);
  }

  return (
    <div className="card income">
      <h2>Monthly income</h2>

      {!editing ? (
        <>
          <div className="income-head">
            <span className="income-amount">{formatCurrency(income)}</span>
            <button className="mini" onClick={() => setEditing(true)}>
              Edit
            </button>
          </div>

          <div className="bar-track">
            <div
              className="bar-fill"
              style={{
                width: `${ratio}%`,
                background: over ? "var(--danger)" : "var(--accent)",
              }}
            />
          </div>

          <div className="income-meta">
            <span>
              {formatCurrency(spent)} spent
              {income > 0 && ` · ${Math.round(ratio)}%`}
            </span>
            <span className={over ? "over" : ""}>
              {formatCurrency(Math.abs(remaining))} {over ? "over" : "left"}
            </span>
          </div>

          {income > 0 && daysLeft > 0 && (
            <div className={`warning ${over ? "over" : ""}`}>
              {over
                ? `You have spent more than your income. You are ${formatCurrency(
                    -remaining
                  )} in the red this month.`
                : `${daysLeft} ${
                    daysLeft === 1 ? "day" : "days"
                  } left — that is about ${formatCurrency(
                    Math.round(dailySafe)
                  )} a day you can spend without going over.`}
            </div>
          )}
        </>
      ) : (
        <form className="form" onSubmit={submit} noValidate>
          <label htmlFor="income-amount">Income per month (EGP)</label>
          <input
            id="income-amount"
            type="number"
            min="0"
            step="500"
            autoFocus
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="8000"
          />
          <div className="form-actions">
            <button className="primary" type="submit">
              Save
            </button>
            <button
              className="secondary"
              type="button"
              onClick={() => {
                setEditing(false);
                setValue("");
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
