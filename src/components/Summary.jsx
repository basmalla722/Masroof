import { useMemo } from "react";
import { DEFAULT_CATEGORIES, findCategory } from "../data";
import { formatCurrency } from "../utils/format";

export default function Summary({ transactions, budget, categories = DEFAULT_CATEGORIES }) {
  const { total, byCategory, highest, average, overBudget } = useMemo(() => {
    let runningTotal = 0;
    const totals = Object.fromEntries(categories.map((c) => [c.name, 0]));

    for (const transaction of transactions) {
      runningTotal += transaction.amount;
      if (transaction.category in totals) totals[transaction.category] += transaction.amount;
    }

    const top = transactions.reduce(
      (best, transaction) =>
        transaction.amount > best.amount ? transaction : best,
      { amount: 0 }
    );

    const overspent = categories.filter(
      (c) => budget[c.name] > 0 && totals[c.name] > budget[c.name]
    );

    return {
      total: runningTotal,
      byCategory: totals,
      highest: transactions.length > 0 ? top : null,
      average: transactions.length > 0 ? runningTotal / transactions.length : 0,
      overBudget: overspent,
    };
  }, [transactions, budget, categories]);

  return (
    <div className="card">
      <h2>Summary</h2>

      <div className="stats">
        <div className="stat">
          <span className="stat-label">Total spent</span>
          <span className="stat-value">{formatCurrency(total)}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Transactions</span>
          <span className="stat-value">{transactions.length}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Average</span>
          <span className="stat-value">{formatCurrency(average)}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Largest</span>
          <span className="stat-value">
            {highest ? formatCurrency(highest.amount) : "—"}
          </span>
        </div>
      </div>

      {overBudget.length > 0 && (
        <div className="warning over">
          Over budget in {overBudget.map((c) => c.name).join(", ")}.
        </div>
      )}

      <h3>By category</h3>
      {transactions.length === 0 ? (
        <p className="empty">No data yet.</p>
      ) : (
        <ul className="breakdown">
          {categories.filter((c) => byCategory[c.name] > 0).map((c) => {
            const share = total > 0 ? (byCategory[c.name] / total) * 100 : 0;
            const isOver = budget[c.name] > 0 && byCategory[c.name] > budget[c.name];
            return (
              <li key={c.name} className={isOver ? "over" : ""}>
                <div className="breakdown-head">
                  <span className="breakdown-name">
                    {c.name}
                    {budget[c.name] > 0 && ` · ${formatCurrency(byCategory[c.name])} / ${formatCurrency(budget[c.name])}`}
                  </span>
                  <span>{share.toFixed(0)}%</span>
                </div>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{
                      width: `${share}%`,
                      background: findCategory(categories, c.name)?.color,
                    }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
