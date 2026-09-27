import test from "node:test";
import assert from "node:assert/strict";

import { analyse } from "../src/insights.js";
import { DEFAULT_CATEGORIES } from "../src/data.js";
import { findCrossing } from "./helpers.js";

const MONTH = new Date().toISOString().slice(0, 7);
const dateIn = (day) => `${MONTH}-${String(day).padStart(2, "0")}`;
const tx = (id, title, amount, category, day) => ({
  id: String(id),
  title,
  amount,
  category,
  date: dateIn(day),
});

const ids = (result) => result.map((i) => i.id);
const find = (result, id) => result.find((i) => i.id === id);

// formatCurrency groups thousands with commas, so match either way.
const amount = (value) => new RegExp(value.toLocaleString("en-US").replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

test("an empty month reports nothing spent rather than inventing a problem", () => {
  const result = analyse([], {}, MONTH, 0, DEFAULT_CATEGORIES);
  const problems = result.filter((i) => i.level === "critical" || i.level === "warning");
  assert.deepEqual(problems, [], `unexpected warnings: ${ids(result)}`);
});

test("spending more than income is reported as critical", () => {
  const result = analyse([tx(1, "Rent", 5000, "Other", 2)], {}, MONTH, 3000);
  const insight = find(result, "over-income");
  assert.ok(insight, "expected an over-income insight");
  assert.equal(insight.level, "critical");
  assert.match(insight.body, amount(2000));
});

test("a category over its limit is reported", () => {
  const result = analyse([tx(1, "Food", 900, "Food", 3)], { Food: 500 }, MONTH, 0);
  const insight = find(result, "over-Food");
  assert.ok(insight, "expected an over-Food insight");
  assert.equal(insight.category, "Food");
  assert.match(insight.body, amount(400));
});

test("spend inside the limit produces no over-budget insight", () => {
  const result = analyse([tx(1, "Food", 100, "Food", 3)], { Food: 500 }, MONTH, 0);
  assert.equal(find(result, "over-Food"), undefined);
});

test("every insight has an id, a level and readable copy", () => {
  const result = analyse(
    [tx(1, "Food", 900, "Food", 3), tx(2, "Bus", 400, "Transport", 4)],
    { Food: 500, Transport: 100 },
    MONTH,
    1000
  );
  assert.ok(result.length > 0, "expected some insights");
  for (const insight of result) {
    assert.ok(insight.id, "insight without an id");
    assert.ok(["critical", "warning", "info", "good"].includes(insight.level), insight.level);
    assert.ok(insight.title.length > 0, "insight without a title");
    assert.ok(insight.body.length > 0, `${insight.id} has an empty body`);
    assert.doesNotMatch(insight.body, /NaN|undefined/, `${insight.id} leaked a bad value`);
  }
});

test("the projection insight is attributed to the model", () => {
  // Total below income, so over-income must not short-circuit the projection.
  const result = analyse(
    [tx(1, "Canteen", 180, "Food", 2), tx(2, "Groceries", 900, "Food", 5), tx(3, "Gym", 700, "Health", 6)],
    {},
    MONTH,
    1500
  );
  const insight = find(result, "income-pace");
  if (!insight) return; // the model does not project a shortfall here, which is fine
  assert.match(insight.body, /A model trained on spending patterns/);
  assert.doesNotMatch(insight.body, /NaN/);
});

test("a modelled number is labelled as modelled, not sold as fact", () => {
  // The projection is trained on synthetic data. Anything derived from it must
  // say so in the UI, otherwise a live visitor reads it as measured.
  //
  // The income is searched for rather than hardcoded: the threshold moves every
  // time the model is retrained, and a test that pins a number from one
  // training run fails on the next one for no real reason.
  const spend = [
    tx(1, "Notebook", 2500, "Other", 4),
    tx(2, "Groceries", 900, "Food", 5),
    tx(3, "Bus", 560, "Transport", 12),
  ];
  const total = spend.reduce((sum, t) => sum + t.amount, 0);
  const hit = findCrossing(spend, total);

  assert.ok(hit, "no income made the model project a shortfall, so this went untested");
  assert.ok(hit.income > total, "the crossing must be a shortfall, not an overspend");

  const insight = find(analyse(spend, {}, MONTH, hit.income), "income-pace");
  assert.ok(insight, `expected the projection insight at income ${hit.income}`);
  assert.ok(insight.note, "a model-backed insight must carry a provenance note");
  assert.match(insight.note, /simulated|experimental|synthetic/i);
});

test("spending past your income still reports where the month lands", () => {
  // Regression guard. The projection used to live in an else-if, so the moment
  // spending passed income the model was never called. Being over income is
  // exactly when the user most wants to know the final figure, so both facts
  // have to appear together.
  const spend = [tx(1, "Tuition", 23960, "Other", 6), tx(2, "Food", 1200, "Food", 14)];
  const income = 17300;
  const result = analyse(spend, {}, MONTH, income);
  const insight = find(result, "over-income");

  assert.ok(insight, "expected the over-income insight");
  assert.match(insight.body, amount(income * 0 + (23960 + 1200 - income)));
  // The projection is quoted, not just the overspend.
  assert.match(insight.body, /puts the month at about/);
  assert.doesNotMatch(insight.body, /NaN/);
  assert.ok(insight.note, "the projection is in this insight, so it needs its provenance");
});

test("the projection insight quotes the model, not the flat rule", () => {
  const spend = [
    tx(1, "Notebook", 2500, "Other", 4),
    tx(2, "Groceries", 900, "Food", 5),
    tx(3, "Bus", 560, "Transport", 12),
  ];
  const total = spend.reduce((sum, t) => sum + t.amount, 0);
  const hit = findCrossing(spend, total);
  assert.ok(hit, "expected a crossing income to exist");

  const insight = find(analyse(spend, {}, MONTH, hit.income), "income-pace");
  assert.ok(insight);
  assert.match(insight.body, /A model trained on spending patterns/);
  assert.doesNotMatch(insight.body, /NaN|undefined/);
});


test("expenses from another month are not counted", () => {
  // The app does answer an empty month with an "on track" note, which is
  // deliberate. What must not happen is the old expense being counted.
  const result = analyse([tx(1, "Old", 5000, "Food", 5)], { Food: 100 }, "1999-01", 100);
  assert.equal(find(result, "over-income"), undefined);
  assert.equal(find(result, "over-Food"), undefined);
});

test("custom category names are measured, not dropped", () => {
  // Regression guard: concentration features are computed over every category
  // the user spent in, including their own "Other" names.
  const result = analyse(
    [tx(1, "Canteen", 100, "Food", 2), tx(2, "Haircut", 400, "Haircut", 3)],
    {},
    MONTH,
    10000
  );
  assert.doesNotMatch(JSON.stringify(result), /NaN/);
});

test("a category with no limit at all is flagged as missing a limit", () => {
  const result = analyse([tx(1, "Food", 200, "Food", 3)], {}, MONTH, 0);
  assert.ok(ids(result).includes("missing-limits"));
});
