import { DEFAULT_CATEGORIES } from "../data";
import { monthKey } from "../utils/format";
import { currentMonthKey, previousMonthKey } from "../insights";

const twoDecimals = (value) => Math.round(value * 100) / 100;

function summarise(transactions, budget, period, income = 0, categories = DEFAULT_CATEGORIES) {
  const key =
    period === "last_month"
      ? previousMonthKey(currentMonthKey())
      : period === "all"
        ? null
        : currentMonthKey();

  const items =
    key === null
      ? transactions
      : transactions.filter((t) => monthKey(t.date) === key);

  const byCategory = Object.fromEntries(categories.map((c) => [c.name, 0]));
  for (const t of items) {
    if (t.category in byCategory) byCategory[t.category] += t.amount;
  }

  const total = items.reduce((sum, t) => sum + t.amount, 0);
  const budgetTotal = Object.values(budget).reduce((sum, v) => sum + v, 0);

  return {
    period: key ?? "all time",
    currency: "EGP",
    monthly_income: income || null,
    total_spent: twoDecimals(total),
    transaction_count: items.length,
    by_category: Object.fromEntries(
      Object.entries(byCategory).map(([name, value]) => [name, twoDecimals(value)])
    ),
    budget_limits: budget,
    budget_total: twoDecimals(budgetTotal),
    available_categories: categories.map((c) => c.name),
    remaining_against_budget:
      budgetTotal > 0 ? twoDecimals(budgetTotal - total) : null,
    remaining_after_income: income > 0 ? twoDecimals(income - total) : null,
  };
}

export function runTool(name, args, state) {
  const { transactions, budget, income, categories } = state;

  if (name === "get_spending_summary") {
    return summarise(transactions, budget, args?.period ?? "this_month", income, categories);
  }

  if (name === "list_transactions") {
    const limit = Math.min(Number(args?.limit ?? 20), 50);
    const filtered = args?.category
      ? transactions.filter((t) => t.category === args.category)
      : transactions;

    return {
      count: filtered.length,
      transactions: [...filtered]
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, limit)
        .map((t) => ({
          title: t.title,
          amount: twoDecimals(t.amount),
          category: t.category,
          date: t.date,
        })),
    };
  }

  return { error: `Unknown tool: ${name}` };
}
