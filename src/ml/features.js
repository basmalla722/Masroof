// Feature extraction for the projection model.
//
// This MUST stay in the same order as FEATURES in model/train.py. If you change
// one, change the other, and re-run the training script: a silent mismatch here
// produces plausible-looking numbers that are quietly wrong.

export const FEATURE_NAMES = [
  "frac",
  "daily",
  "daily_x_frac",
  "daily_x_frac2",
  "daily_x_remaining_frac",
  "log_daily",
  "tx_per_day",
  "top_category_share",
  "n_categories",
  "log_income",
  "spent_over_income",
  "is_month_end",
];

// Anything that is not a finite number would poison the whole dot product and
// end up rendering as "NaN" in the UI, so every input is coerced at the edge.
function num(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function projectEndOfMonth(input = {}) {
  const span = Math.max(num(input.daysInMonth, 1), 1);
  const past = Math.min(Math.max(num(input.elapsed, 1), 1), span);
  const spent = Math.max(num(input.total, 0), 0);
  const safeIncome = Math.max(num(input.income, 0), 1);
  const frac = past / span;
  const daily = spent / past;

  return [
    frac,
    daily,
    daily * frac,
    daily * frac * frac,
    daily * (1 - frac),
    Math.log1p(daily),
    num(input.txCount, 0) / past,
    Math.min(Math.max(num(input.topCategoryShare, 0), 0), 1),
    num(input.nCategories, 0),
    Math.log1p(safeIncome),
    spent / safeIncome,
    past >= span - 3 ? 1 : 0,
  ];
}
