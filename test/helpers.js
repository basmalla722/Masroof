import { predict } from "../src/ml/predict.js";
import { projectionInput } from "../src/ml/month.js";
import { currentMonthKey } from "../src/ml/monthKey.js";

// Finds an income where the model projects the month finishing over income,
// without that being simply an overspend. Searching beats hardcoding: the
// crossing point moves every time the model is retrained, so a test that pins
// one training run's number fails on the next run for no real reason.
export function findCrossing(spend, total, step = 100) {
  const month = currentMonthKey();
  for (let income = Math.ceil(total / step) * step; income <= total * 5; income += step) {
    if (income <= total) continue;
    const { input } = projectionInput(spend, income, month);
    const prediction = predict(input);
    if (prediction.method === "model" && prediction.projected > income) {
      return { income, prediction, input };
    }
  }
  return null;
}
