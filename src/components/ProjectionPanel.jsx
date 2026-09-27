import { predict, naiveProjection, modelInfo } from "../ml/predict.js";
import { projectionInput } from "../ml/month.js";
import { currentMonthKey } from "../ml/monthKey.js";
import { formatCurrency } from "../utils/format.js";

// Shows the projection next to the rule it replaced, always, not only when the
// model happens to predict a shortfall. The comparison is the point: a single
// number gives a visitor no way to tell a model from an arbitrary guess, and it
// would leave the most interesting part of this project invisible.
export default function ProjectionPanel({ monthTransactions, income }) {
  const month = currentMonthKey();
  const { input, total, elapsed, daysInMonth, isCurrent } = projectionInput(
    monthTransactions,
    income,
    month
  );

  const training = modelInfo.training;
  const monthsSeen = training ? training.train_rows + training.test_rows : null;
  const projection = predict(input);
  const naive = naiveProjection(input);
  const gap = Math.abs(projection.projected - naive);
  const progress = Math.round((elapsed / Math.max(daysInMonth, 1)) * 100);
  const declined = projection.method !== "model";

  return (
    <section className="card projection-card">
      <div className="projection-head">
        <h2>Where this month is heading</h2>
        <span className="badge">{declined ? "flat-rate rule" : "trained model"}</span>
      </div>

      {declined && (
        <p className="projection-why">
          {income > 0
            ? "The model did not recognise this month, so it is showing the old rule rather than guessing."
            : "Set your income and the model can take over from the flat rule."}
        </p>
      )}

      <div className="projection-figures">
        <div className="projection-figure">
          <span className="plan-figure">{formatCurrency(Math.round(projection.projected))}</span>
          <span className="plan-label">model projection</span>
        </div>
        <div className="projection-figure muted">
          <span className="plan-figure">{formatCurrency(Math.round(naive))}</span>
          <span className="plan-label">old flat-rate rule</span>
        </div>
      </div>

      <p className="projection-why">
        {formatCurrency(Math.round(total))} spent across {monthTransactions.length}{" "}
        {monthTransactions.length === 1 ? "expense" : "expenses"}, {progress}% through the month
        {gap > 1
          ? `, and the two disagree by ${formatCurrency(Math.round(gap))}.`
          : "."}
      </p>

      {projection.error != null && !declined && (
        <p className="projection-why">
          Typical miss across all users: about {formatCurrency(Math.round(projection.error))},
          narrowing as the month goes on. That is an average, not a range for this
          particular month.
        </p>
      )}

      <p className="insight-note">
        Experimental. Trained on {monthsSeen ? monthsSeen.toLocaleString("en-US") : "simulated"}{" "}
        simulated months, not real accounts. Measured {training?.improvement_pct ?? "far"}% more
        accurate than the flat-rate rule on held-out users.
        {!isCurrent && " Showing a month that has already finished."}
      </p>
    </section>
  );
}
