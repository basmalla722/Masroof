// The current month as YYYY-MM. Split out of insights.js so the model modules
// can share it without importing the rules, which import them back.
export function currentMonthKey(now = new Date()) {
  return now.toISOString().slice(0, 7);
}
