import { useMemo, useState } from "react";
import { useData } from "../context/DataContext";
import BudgetPanel from "../components/BudgetPanel";
import IncomePanel from "../components/IncomePanel";
import { useDerived } from "./Dashboard";
import CategoryBars from "../components/charts/CategoryBars";
import { EmptyState } from "../components/states";
import { colorFor, findCategory } from "../data";
import { formatCurrency } from "../utils/format";
import Soft from "../hooks/Soft";

export default function Budgets() {
  const { budget, income, setIncome, setBudgetLimit, deleteBudgetLimit, clearBudget } =
    useData();
  const { monthTransactions, spent, allCategories } = useDerived();
  const [spendRatio, setSpendRatio] = useState(50);

  const chartData = useMemo(() => {
    const totals = new Map();
    for (const t of monthTransactions) {
      totals.set(t.category, (totals.get(t.category) || 0) + (Number(t.amount) || 0));
    }
    return [...totals.entries()]
      .map(([name, value]) => ({
        name,
        value,
        color: findCategory(allCategories, name)?.color ?? colorFor(name),
      }))
      .sort((a, b) => b.value - a.value);
  }, [monthTransactions, allCategories]);

  const limits = Object.entries(budget).filter(([, amount]) => amount > 0);
  const budgetTotal = limits.reduce((sum, [, amount]) => sum + amount, 0);
  const usedTotal = limits.reduce((sum, [name, limit]) => {
    const value = chartData.find((item) => item.name === name)?.value ?? 0;
    return sum + Math.min(value, limit);
  }, 0);

  return (
    <>
      <Soft className="dash-grid">
        <IncomePanel income={income} spent={spent} onSave={setIncome} />
        <section className="card">
          <h2>Plan vs reality</h2>
          {limits.length === 0 ? (
            <p className="empty">Set a limit on the left and this fills in.</p>
          ) : (
            <>
              <div className="plan-total">
                <span className="plan-figure">
                  {formatCurrency(spendRatio < 50 ? usedTotal : budgetTotal)}
                </span>
                <span className="plan-label">
                  {spendRatio < 50 ? "actually spent" : "of planned limits"}
                </span>
              </div>
              <input
                className="plan-slider"
                type="range"
                min="0"
                max="100"
                step="50"
                value={spendRatio}
                onChange={(event) => setSpendRatio(Number(event.target.value))}
                aria-label="Show spent or planned"
              />
            </>
          )}
        </section>
      </Soft>

      <Soft delay={80} className="split">
        <BudgetPanel
          budget={budget}
          onSet={setBudgetLimit}
          onDelete={deleteBudgetLimit}
          onClearAll={clearBudget}
          categories={allCategories}
        />

        <div className="stack">
          {chartData.length === 0 ? (
            <EmptyState
              title="No spending to compare"
              body="Once you add expenses, each bar shows how far you are from the limit you set."
            />
          ) : (
            <section className="card">
              <h2>How far you are from each limit</h2>
              <CategoryBars
                data={chartData}
                total={spent}
                limitFor={(name) => budget[name] ?? 0}
              />
            </section>
          )}
        </div>
      </Soft>
    </>
  );
}
