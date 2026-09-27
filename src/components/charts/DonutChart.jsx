import { formatCurrency } from "../../utils/format";

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Donut showing how the month splits across categories.
 * Built from stroke-dasharray on a single circle, no library.
 */
export default function DonutChart({ data, total, centreLabel = "Total" }) {
  if (!data.length || total <= 0) {
    return <p className="empty">Nothing to split up yet.</p>;
  }

  let offset = 0;

  return (
    <div className="donut-wrap">
      <svg className="donut" viewBox="0 0 140 140" role="img" aria-label="Spending split by category">
        <circle className="donut-track" cx="70" cy="70" r={RADIUS} />
        {data.map((item) => {
          const fraction = item.value / total;
          const dash = fraction * CIRCUMFERENCE;
          const segment = (
            <circle
              key={item.name}
              className="donut-seg"
              cx="70"
              cy="70"
              r={RADIUS}
              stroke={item.color}
              strokeDasharray={`${dash} ${CIRCUMFERENCE - dash}`}
              strokeDashoffset={-offset}
            >
              <title>{`${item.name}: ${formatCurrency(item.value)}`}</title>
            </circle>
          );
          offset += dash;
          return segment;
        })}
      </svg>

      <div className="donut-centre">
        <span className="donut-centre-value">{formatCurrency(total)}</span>
        <span className="donut-centre-label">{centreLabel}</span>
      </div>
    </div>
  );
}
