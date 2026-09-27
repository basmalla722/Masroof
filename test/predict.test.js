import test from "node:test";
import assert from "node:assert/strict";

import { predict, naiveProjection, modelInfo } from "../src/ml/predict.js";

const base = {
  total: 2620,
  elapsed: 15,
  daysInMonth: 30,
  income: 6000,
  txCount: 24,
  topCategoryShare: 0.41,
  nCategories: 5,
};

test("the model is actually loaded, not silently falling back", () => {
  assert.equal(modelInfo.ready, true);
  assert.equal(predict(base).method, "model");
});

test("a projection is never below what has already been spent", () => {
  // The month is not over, so the final total cannot be less than the spend so
  // far, whatever the model says.
  for (const total of [50, 500, 5000, 50000]) {
    const p = predict({ ...base, total, elapsed: 1, daysInMonth: 30 });
    assert.ok(p.projected >= total, `projected ${p.projected} < spent ${total}`);
  }
});

test("projections are finite for every degenerate input", () => {
  for (const input of [undefined, null, {}, { total: NaN }, { elapsed: 0, daysInMonth: 0 }]) {
    const p = predict(input);
    assert.ok(Number.isFinite(p.projected), `projected was ${p.projected}`);
  }
});

test("the early month is projected above the naive rate, not below it", () => {
  // Three quiet days look cheap. The naive rule reads that as a cheap month.
  // The model knows three days carries almost no information.
  const early = { ...base, total: 210, elapsed: 3, txCount: 4, nCategories: 3 };
  assert.ok(
    predict(early).projected > naiveProjection(early),
    "model should not trust three days of data"
  );
});

test("a payday splurge is projected below the naive rate", () => {
  // The naive rule assumes an expensive day repeats for the rest of the month.
  const splurge = { ...base, total: 4100, elapsed: 15, topCategoryShare: 0.45, nCategories: 6 };
  assert.ok(
    predict(splurge).projected < naiveProjection(splurge),
    "model should not extrapolate one bad stretch across the month"
  );
});

test("more spend so far means a higher projection", () => {
  const low = predict({ ...base, total: 1000 }).projected;
  const high = predict({ ...base, total: 3000 }).projected;
  assert.ok(high > low, `expected ${high} > ${low}`);
});

test("the error band narrows as the month progresses", () => {
  const early = predict({ ...base, elapsed: 3 });
  const late = predict({ ...base, elapsed: 27 });
  assert.ok(early.error > late.error, `${early.error} should exceed ${late.error}`);
});

test("the shipped model is more accurate than the rule it replaced", () => {
  // Guards the claim quoted in the README against a silent regression in
  // weights.js or in the feature order.
  assert.equal(modelInfo.training.naive_mae, 1146.7);
  assert.equal(modelInfo.training.mae, 838.9);
  assert.ok(
    modelInfo.training.improvement_pct > 25,
    `improvement fell to ${modelInfo.training.improvement_pct}%`
  );
});

test("the model refuses to predict far outside its training range", () => {
  // Regression guard. With income left at zero, spent_over_income became 3960
  // against a trained maximum of about 4, and log_income sat ten times below
  // anything simulated. The linear model did not fail, it returned 2,610,185.
  const wild = { total: 3960, elapsed: 27, daysInMonth: 30, income: 0, txCount: 3 };
  const p = predict(wild);
  assert.equal(p.method, "naive");
  assert.match(p.reason, /outside the range/);
  assert.ok(p.projected < 100000, `projected ${p.projected} is not a number anyone can use`);
});

test("a thin month is still answered, not refused", () => {
  // Someone who just started has three expenses in the month. That is below what
  // the simulator produces, but it is not absurd, so the model should answer and
  // the guard should not get in the way of a real user.
  const thin = {
    total: 3960,
    elapsed: 27,
    daysInMonth: 30,
    income: 17300,
    txCount: 3,
    topCategoryShare: 0.6,
    nCategories: 2,
  };
  assert.equal(predict(thin).method, "model");
});

test("the fallback rule is safe on its own terms", () => {
  // The fallback is what gets displayed whenever the model declines, so it must
  // not be the thing that produces NaN.
  for (const input of [undefined, null, {}, { total: "x" }, { total: 10 }]) {
    assert.ok(Number.isFinite(naiveProjection(input)), `NaN for ${JSON.stringify(input)}`);
  }
});
