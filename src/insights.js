import { DEFAULT_CATEGORIES } from "./data";
import { formatCurrency, monthKey } from "./utils/format";

const SHARE_ALERT = 0.35;
const SAVINGS_CUT = 0.2;

function daysInMonth(key) {
  return new Date(Number(key.slice(0, 4)), Number(key.slice(5, 7)), 0).getDate();
}

export function currentMonthKey() {
  return new Date().toISOString().slice(0, 7);
}

export function analyse(
  transactions,
  budget,
  month = currentMonthKey(),
  income = 0,
  categories = DEFAULT_CATEGORIES
) {
  const insights = [];
  const limitOf = (name) => budget[name] ?? 0;

  const monthItems = transactions.filter((t) => monthKey(t.date) === month);
  const total = monthItems.reduce((sum, t) => sum + t.amount, 0);

  const byCategory = Object.fromEntries(categories.map((c) => [c.name, 0]));
  for (const t of monthItems) {
    if (t.category in byCategory) byCategory[t.category] += t.amount;
  }

  if (income > 0) {
    if (total > income) {
      insights.push({
        id: "over-income",
        level: "critical",
        title: "You spent more than you earn",
        body: `Your income is ${formatCurrency(
          income
        )} and your expenses this month are ${formatCurrency(
          total
        )} - a shortfall of ${formatCurrency(total - income)}.`,
      });
    } else if (month === currentMonthKey()) {
      const limit = daysInMonth(month);
      const elapsed = new Date().getDate();
      const projected = (total / elapsed) * limit;
      if (projected > income) {
        insights.push({
          id: "income-pace",
          level: "warning",
          title: "At this pace you will finish the month in the red",
          body: `You have ${formatCurrency(
            income - total
          )} left of ${formatCurrency(
            income
          )}, but you are spending about ${formatCurrency(
            Math.round(total / elapsed)
          )} a day. Projected month total: ${formatCurrency(
            Math.round(projected)
          )}.`,
        });
      }
    }
  }

  const overspent = categories.filter(
    (c) => limitOf(c.name) > 0 && byCategory[c.name] > limitOf(c.name)
  );

  for (const c of overspent) {
    const over = byCategory[c.name] - limitOf(c.name);
    insights.push({
      id: `over-${c.name}`,
      level: "critical",
      title: `${c.name} is over budget`,
      category: c.name,
      body: `You have spent ${formatCurrency(byCategory[c.name])} against a limit of ${formatCurrency(
        limitOf(c.name)
      )} - that is ${formatCurrency(over)} over. No other category can absorb it, so the cut has to come from here.`,
    });
  }

  const limit = daysInMonth(month);
  const elapsed = month === currentMonthKey() ? new Date().getDate() : limit;
  const pace = elapsed > 0 ? (total / elapsed) * limit : 0;

  for (const c of categories) {
    if (limitOf(c.name) === 0 || byCategory[c.name] === 0) continue;
    if (byCategory[c.name] <= limitOf(c.name)) continue;
    if (month !== currentMonthKey()) continue;
    const projected = (byCategory[c.name] / elapsed) * limit;
    if (projected > limitOf(c.name) * 1.05) {
      insights.push({
        id: `pace-${c.name}`,
        level: "warning",
        title: `${c.name} is on track to overshoot`,
        body: `At this pace you will reach about ${formatCurrency(
          Math.round(projected)
        )} by the end of the month, against a limit of ${formatCurrency(
          limitOf(c.name)
        )}.`,
      });
    }
  }

  const dominant = categories.filter(
    (c) => total > 0 && byCategory[c.name] / total > SHARE_ALERT
  );

  for (const c of dominant) {
    const share = ((byCategory[c.name] / total) * 100).toFixed(0);
    const saving = Math.round(byCategory[c.name] * SAVINGS_CUT);
    insights.push({
      id: `share-${c.name}`,
      level: "info",
      title: `${c.name} is ${share}% of everything you spend`,
      body: `That is the largest slice of your month. Bringing it down by ${SAVINGS_CUT * 100}% would put about ${formatCurrency(
        saving
      )} back each month.`,
    });
  }

  const missingLimits = categories.filter(
    (c) => limitOf(c.name) === 0 && byCategory[c.name] > 0
  );

  if (missingLimits.length > 0) {
    const names = missingLimits.map((c) => c.name).join(", ");
    insights.push({
      id: "missing-limits",
      level: "info",
      title: "You are spending in categories with no limit",
      body: `${names} ${missingLimits.length === 1 ? "has" : "have"} no budget set, so nothing warns you before it goes too far.`,
    });
  }

  const biggest = monthItems.reduce(
    (best, t) => (t.amount > (best?.amount ?? 0) ? t : best),
    null
  );

  if (biggest && total > 0) {
    const share = Math.round((biggest.amount / total) * 100);
    if (share >= 15) {
      insights.push({
        id: "biggest",
        level: "info",
        title: "Your single largest expense",
        body: `"${biggest.title}" was ${formatCurrency(
          biggest.amount
        )}, which is ${share}% of the month on its own.`,
      });
    }
  }

  const previous = transactions.filter(
    (t) => monthKey(t.date) === previousMonthKey(month)
  );
  const previousTotal = previous.reduce((sum, t) => sum + t.amount, 0);

  if (previousTotal > 0 && total > 0) {
    const change = ((total - previousTotal) / previousTotal) * 100;
    if (Math.abs(change) >= 10) {
      insights.push({
        id: "trend",
        level: change > 0 ? "warning" : "info",
        title:
          change > 0
            ? `You are spending ${Math.round(change)}% more than last month`
            : `You are spending ${Math.abs(Math.round(change))}% less than last month`,
        body: `Last month came to ${formatCurrency(
          previousTotal
        )}, this month so far ${formatCurrency(total)}.`,
      });
    }
  }

  if (insights.length === 0) {
    insights.push({
      id: "on-track",
      level: "good",
      title: "Everything is on track",
      body:
        total > 0
          ? `You have spent ${formatCurrency(
              total
            )} so far and no category has passed its limit.`
          : "No expenses recorded for this month yet. Add one to get a reading.",
    });
  }

  const order = { critical: 0, warning: 1, info: 2, good: 3 };
  return insights.sort((a, b) => order[a.level] - order[b.level]);
}

export function previousMonthKey(key) {
  const date = new Date(Number(key.slice(0, 4)), Number(key.slice(5, 7)) - 1, 1);
  return date.toISOString().slice(0, 7);
}


