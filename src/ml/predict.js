// End-of-month spend projection.
//
// The coefficients come from model/train.py and are a flat list, so inference is
// a dot product. There is no ML library in the browser and there does not need
// to be one: the shipped model is a linear regression, so a dozen multiplies
// and an add is the whole thing.
//
// If the weights ever fail to load, predict() falls back to the naive
// spend-rate rule the app used before the model existed, so the feature keeps
// working either way.

import weights from "./weights.js";
import { projectEndOfMonth, FEATURE_NAMES } from "./features.js";

const COEFFICIENTS = weights.coefficients || [];
const INTERCEPT = weights.intercept || 0;
const READY = COEFFICIENTS.length === FEATURE_NAMES.length;

export const modelInfo = {
  ready: READY,
  training: weights.training || null,
  note: weights._comment || "",
};

export function naiveProjection(raw) {
  // The fallback has to be safe on its own terms, because it is what gets shown
  // whenever the model declines to answer. Coerced here so a missing field
  // cannot turn the fallback into NaN. `raw = {}` only covers undefined, so
  // null is handled separately.
  const { total, elapsed, daysInMonth } = raw || {};
  const spent = Number(total) || 0;
  const past = Math.max(Number(elapsed) || 0, 1);
  const span = Math.max(Number(daysInMonth) || 0, 1);
  return (spent / past) * span;
}

function linearPrediction(input) {
  const x = projectEndOfMonth(input);
  let sum = INTERCEPT;
  for (let i = 0; i < COEFFICIENTS.length; i += 1) {
    sum += COEFFICIENTS[i] * x[i];
  }
  return Number.isFinite(sum) ? sum : null;
}

// How far outside the training range each feature sits, 0 when every feature is
// inside it. A linear model has no idea it is lost outside its training data:
// it keeps returning a confident number, just a wildly wrong one. Shipping the
// training ranges with the weights lets us notice instead of guessing.
function outOfRangeScore(input) {
  const ranges = weights.feature_ranges;
  if (!ranges) return 0;

  const x = projectEndOfMonth(input);
  let worst = 0;
  for (let i = 0; i < x.length; i += 1) {
    const range = ranges[FEATURE_NAMES[i]];
    if (!Array.isArray(range)) continue;
    const [lo, hi] = range;
    const value = x[i];
    // Only wild overshoot counts. Sitting just under the smallest income ever
    // simulated is unusual, not absurd, and the model still extrapolates sanely.
    const over = Math.max(lo - value, value - hi, 0);
    if (over > 0) {
      const scale = Math.max(Math.abs(hi - lo), 1);
      worst = Math.max(worst, over / scale);
    }
  }
  return worst;
}

/**
 * Estimate what the month will finish at.
 *
 * Returns `projected`, which method produced it, and `error` as a rough
 * MAE-based error bar, so the UI can say "about 4,200" instead of implying
 * false precision.
 */
export function predict(input) {
  const safe = input || {};
  const fallback = naiveProjection(safe);

  if (!READY) {
    return { projected: fallback, method: "naive", error: null, reason: "no weights" };
  }

  // Refuse to extrapolate. With income left at zero the income features land
  // hundreds of times outside anything training ever saw, and the model
  // answered with a number in the millions. Quietly wrong is worse than the
  // flat rule it replaced.
  //
  // The bar is deliberately forgiving: reject only when a feature sits more
  // than a full range width outside its training range. A month with three
  // expenses is thinner than the simulator produces, and that is normal for
  // someone who just started using the app, so the model should still answer.
  const ood = outOfRangeScore(safe);
  if (ood > 1) {
    return {
      projected: fallback,
      method: "naive",
      error: null,
      reason: "outside the range this model was trained on",
    };
  }

  const projected = linearPrediction(safe);
  if (projected == null) {
    return { projected: fallback, method: "naive", error: null, reason: "not a number" };
  }

  const mae = modelInfo.training?.mae ?? null;
  const span = Math.max(Number(safe.daysInMonth) || 1, 1);
  const past = Math.max(Number(safe.elapsed) || 1, 1);

  // A projection made on day 2 is far less trustworthy than one made on day 24,
  // so widen the band when little is known so far.
  const knowledge = Math.min(Math.max(past / span, 0.05), 1);

  return {
    projected: Math.max(projected, Number(safe.total) || 0),
    method: "model",
    error: mae == null ? null : mae * (1.6 - knowledge),
  };
}