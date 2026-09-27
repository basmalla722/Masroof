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

import weights from "./weights.json";
import { projectEndOfMonth, FEATURE_NAMES } from "./features";

const COEFFICIENTS = weights.coefficients || [];
const INTERCEPT = weights.intercept || 0;
const READY = COEFFICIENTS.length === FEATURE_NAMES.length;

export const modelInfo = {
  ready: READY,
  training: weights.training || null,
  note: weights._comment || "",
};

export function naiveProjection({ total, elapsed, daysInMonth }) {
  return (total / Math.max(elapsed, 1)) * Math.max(daysInMonth, 1);
}

function linearPrediction(input) {
  const x = projectEndOfMonth(input);
  let sum = INTERCEPT;
  for (let i = 0; i < COEFFICIENTS.length; i += 1) {
    sum += COEFFICIENTS[i] * x[i];
  }
  return Number.isFinite(sum) ? sum : null;
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
    return { projected: fallback, method: "naive", error: null };
  }

  const projected = linearPrediction(safe);
  if (projected == null) {
    return { projected: fallback, method: "naive", error: null };
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