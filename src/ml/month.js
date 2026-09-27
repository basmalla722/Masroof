// Turns a month's transactions into the input the projection model expects.
//
// This lives in its own module because two places need it: the insights rules
// and the projection panel. When they computed it separately they could drift,
// and they already had once: the rules derived category concentration from the
// five default categories while training had measured every category including
// the user's own "Other" names, so the model was being fed numbers it had
// never seen. One function, one definition.

import { currentMonthKey } from "./monthKey.js";

// Sums spend per category name. Deliberately not keyed off the default
// category list: a user can type their own "Other" label, and that spend is
// real spend that the model was trained to account for.
export function monthTotals(monthItems) {
  const perName = new Map();
  let total = 0;
  for (const t of monthItems) {
    const amount = Number(t.amount) || 0;
    perName.set(t.category, (perName.get(t.category) || 0) + amount);
    total += amount;
  }
  const topCategorySpend = Math.max(0, ...perName.values());
  return { total, perName, topCategorySpend, distinctCategories: perName.size };
}

// The feature input, plus the calendar context a view needs to explain itself.
export function projectionInput(monthItems, income, month = currentMonthKey(), now = new Date()) {
  const span = new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0).getDate();
  const isCurrent = month === currentMonthKey(now);
  const elapsed = isCurrent ? now.getDate() : span;
  const { total, topCategorySpend, distinctCategories } = monthTotals(monthItems);

  return {
    input: {
      total,
      elapsed,
      daysInMonth: span,
      income,
      txCount: monthItems.length,
      topCategoryShare: total > 0 ? topCategorySpend / total : 0,
      nCategories: distinctCategories,
    },
    total,
    elapsed,
    daysInMonth: span,
    isCurrent,
  };
}
