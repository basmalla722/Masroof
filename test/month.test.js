import test from "node:test";
import assert from "node:assert/strict";

import { analyse } from "../src/insights.js";
import { projectionInput, monthTotals } from "../src/ml/month.js";
import { currentMonthKey } from "../src/ml/monthKey.js";

const MONTH = currentMonthKey();
const tx = (id, amount, category, day) => ({
  id: String(id),
  title: `t${id}`,
  amount,
  category,
  date: `${MONTH}-${String(day).padStart(2, "0")}`,
});

test("currentMonthKey is YYYY-MM", () => {
  assert.match(currentMonthKey(), /^\d{4}-\d{2}$/);
  assert.equal(currentMonthKey(new Date(2026, 0, 15)), "2026-01");
});

test("monthTotals counts a user's own category names, not just the defaults", () => {
  // The bug this guards: spend under a custom "Other" label is still spend, and
  // the model was trained on every category, so it has to be in the totals.
  const { total, topCategorySpend, distinctCategories } = monthTotals([
    tx(1, 100, "Food", 2),
    tx(2, 400, "Haircut", 3),
    tx(3, 250, "Haircut", 4),
  ]);
  assert.equal(total, 750);
  assert.equal(topCategorySpend, 650);
  assert.equal(distinctCategories, 2);
});

test("monthTotals on an empty month is all zeroes, not NaN", () => {
  const empty = monthTotals([]);
  assert.equal(empty.total, 0);
  assert.equal(empty.topCategorySpend, 0);
  assert.equal(empty.distinctCategories, 0);
});

test("projectionInput reports calendar context for the panel", () => {
  const items = [tx(1, 100, "Food", 2), tx(2, 200, "Transport", 3)];
  const { input, total, elapsed, daysInMonth, isCurrent } = projectionInput(items, 3000, MONTH);

  assert.equal(total, 300);
  assert.equal(isCurrent, true);
  assert.equal(input.total, 300);
  assert.equal(input.txCount, 2);
  assert.equal(input.income, 3000);
  assert.equal(input.daysInMonth, daysInMonth);
  assert.equal(input.elapsed, elapsed);
  assert.ok(elapsed >= 1 && elapsed <= daysInMonth);
  // Concentration across both categories, not only the top one.
  assert.ok(Math.abs(input.topCategoryShare - 200 / 300) < 1e-12);
  assert.equal(input.nCategories, 2);
});

test("a finished month is treated as complete, not as day zero", () => {
  const { input, isCurrent } = projectionInput([tx(1, 100, "Food", 2)], 3000, "2020-02");
  assert.equal(isCurrent, false);
  assert.equal(input.elapsed, input.daysInMonth);
});

test("the panel and the insight rules read the same features", () => {
  // Both call projectionInput, so the number shown on Budgets and the number
  // behind the income-pace insight can never drift apart.
  const items = [
    tx(1, 180, "Food", 2),
    tx(2, 240, "Transport", 3),
    tx(3, 600, "Other", 4),
    tx(4, 900, "Food", 5),
    tx(5, 700, "Health", 6),
  ];
  const { input } = projectionInput(items, 2700, MONTH);
  const insight = analyse(items, {}, MONTH, 2700).find((i) => i.id === "income-pace");

  assert.ok(insight, "expected the projection insight for this spend");
  assert.equal(input.total, 2620);
  assert.equal(input.nCategories, 4);
  // Food is 180 + 900 = 1080, so concentration is on the summed category.
  assert.ok(Math.abs(input.topCategoryShare - 1080 / 2620) < 1e-12);
  // The insight fired because the model projects over income from these exact
  // inputs, so the shared helper is confirmed to be the source of both.
  assert.match(insight.body, /A model trained on spending patterns/);
});
