import { useMemo } from "react";
import { useData } from "../context/DataContext";
import { useCategories } from "../context/CategoriesContext";
import { analyse, currentMonthKey } from "../insights";
import { colorFor, findCategory } from "../data";
import { daysInMonth, formatCurrency } from "../utils/format";
import DonutChart from "../components/charts/DonutChart";
import DailyTrend from "../components/charts/DailyTrend";
import CategoryBars from "../components/charts/CategoryBars";
import InsightsPanel from "../components/InsightsPanel";
import { EmptyState } from "../components/states";
import Soft from "../hooks/Soft";

export function useDerived() {
  const { transactions, budget, income } = useData();
  const { categories } = useCategories();

  return useMemo(() => {
    const month = currentMonthKey();
    const monthTransactions = transactions.filter((t) => t.date?.startsWith(month));
    const spent = monthTransactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const used = [...new Set(transactions.map((t) => t.category))];
    const allCategories = [
      ...categories,
      ...used
        .filter((name) => !categories.some((c) => c.name === name))
        .map((name) => ({ name, color: colorFor(name) })),
    ];

    const insights = analyse(transactions, budget, month, income, allCategories);

    return { month, monthTransactions, spent, allCategories, insights };
  }, [transactions, budget, income, categories]);
}

export default function Dashboard() {
  const { monthTransactions, spent, allCategories, insights } = useDerived();
  const { budget, income } = useData();

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

  const days = daysInMonth(currentMonthKey());
  const remaining = income - spent;
  const safeDaily = remaining > 0 ? remaining / Math.max(days - new Date().getDate(), 1) : 0;

  if (spent === 0) {
    return (
      <Soft>
        <EmptyState
          title="No expenses this month yet"
          body="Add your first expense and this page fills up with a breakdown, a trend, and warnings before you overspend."
        />
      </Soft>
    );
  }

  return (
    <>
      <Soft className="dash-grid">
        <section className="card">
          <h2>Where the money went</h2>
          <DonutChart data={chartData} total={spent} centreLabel="This month" />
        </section>

        <section className="card">
          <h2>Day by day</h2>
          <DailyTrend transactions={monthTransactions} days={days} safeDaily={safeDaily} />
        </section>
      </Soft>

      <Soft delay={80}>
        <section className="card">
          <h2>Spending by category</h2>
          <CategoryBars
            data={chartData}
            total={spent}
            limitFor={(name) => budget[name] ?? 0}
          />
          {income > 0 && (
            <p className="hint-text">
              {remaining >= 0
                ? `${formatCurrency(remaining)} of your ${formatCurrency(income)} is still unspent.`
                : `You are ${formatCurrency(Math.abs(remaining))} over your income.`}
            </p>
          )}
        </section>
      </Soft>

      <Soft delay={140}>
        <InsightsPanel insights={insights} showHeading={false} />
      </Soft>
    </>
  );
}
