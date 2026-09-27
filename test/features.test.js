import test from "node:test";
import assert from "node:assert/strict";

import { projectEndOfMonth, FEATURE_NAMES } from "../src/ml/features.js";

test("feature vector has one value per declared feature", () => {
  const x = projectEndOfMonth({
    total: 500,
    elapsed: 10,
    daysInMonth: 30,
    income: 3000,
    txCount: 8,
    topCategoryShare: 0.5,
    nCategories: 3,
  });
  assert.equal(x.length, FEATURE_NAMES.length);
});

test("every feature is finite for a normal input", () => {
  const x = projectEndOfMonth({
    total: 500,
    elapsed: 10,
    daysInMonth: 30,
    income: 3000,
    txCount: 8,
    topCategoryShare: 0.5,
    nCategories: 3,
  });
  for (const [i, v] of x.entries()) {
    assert.ok(Number.isFinite(v), `${FEATURE_NAMES[i]} was ${v}`);
  }
});

test("bad input never produces NaN, because NaN would render in the UI", () => {
  const cases = [
    undefined,
    null,
    {},
    { total: NaN, elapsed: 0, daysInMonth: 30, income: 0 },
    { total: "abc", elapsed: -5, daysInMonth: 0, income: null },
    { total: Infinity, elapsed: Infinity, daysInMonth: Infinity, income: NaN },
  ];
  for (const input of cases) {
    const x = projectEndOfMonth(input);
    for (const [i, v] of x.entries()) {
      assert.ok(Number.isFinite(v), `${FEATURE_NAMES[i]} was ${v} for ${JSON.stringify(input)}`);
    }
  }
});

test("frac is progress through the month", () => {
  const [frac] = projectEndOfMonth({ total: 100, elapsed: 15, daysInMonth: 30, income: 3000 });
  assert.ok(Math.abs(frac - 0.5) < 1e-9);
});

test("elapsed is clamped to the length of the month", () => {
  // A 31-day month viewed on day 40 must not produce a fraction above 1.
  const [frac] = projectEndOfMonth({ total: 100, elapsed: 40, daysInMonth: 31, income: 3000 });
  assert.ok(frac <= 1, `frac was ${frac}`);
});

test("daily rate is spend per elapsed day", () => {
  const [, daily] = projectEndOfMonth({ total: 600, elapsed: 10, daysInMonth: 30, income: 3000 });
  assert.ok(Math.abs(daily - 60) < 1e-9);
});

test("top_category_share is clamped to 0..1", () => {
  const x = projectEndOfMonth({
    total: 100,
    elapsed: 5,
    daysInMonth: 30,
    income: 3000,
    topCategoryShare: 4.2,
  });
  assert.equal(x[7], 1);
});

test("is_month_end only fires in the last three days", () => {
  const at = (day) =>
    projectEndOfMonth({ total: 100, elapsed: day, daysInMonth: 30, income: 3000 })[11];
  assert.equal(at(26), 0);
  assert.equal(at(27), 1);
  assert.equal(at(30), 1);
});
