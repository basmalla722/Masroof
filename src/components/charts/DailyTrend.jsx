import { useId } from "react";
import { formatCurrency, todayIso } from "../../utils/format";

/**
 * Daily cumulative spend across the month, with a dashed pace line
 * so the gap between the plan and the real curve is visible.
 */
export default function DailyTrend({ transactions, days, safeDaily }) {
  const gradientId = useId();
  const today = todayIso();
  const dayNumber = Number(today.slice(8, 10)) || days;
  const perDay = new Array(days + 1).fill(0);

  for (const t of transactions) {
    if (!t.date?.startsWith(today.slice(0, 7))) continue;
    const day = Number(t.date.slice(8, 10));
    if (day >= 1 && day <= days) perDay[day] += Number(t.amount) || 0;
  }

  const running = [];
  let sum = 0;
  for (let day = 1; day <= days; day += 1) {
    sum += perDay[day];
    running.push(sum);
  }

  const visible = running.slice(0, dayNumber);
  const max = Math.max(...visible, safeDaily * dayNumber, 1);

  const width = 100;
  const height = 42;
  const points = visible.map((value, index) => {
    const x = ((index + 1) / dayNumber) * width;
    const y = height - (value / max) * height;
    return [Number(x.toFixed(2)), Number(y.toFixed(2))];
  });

  const line = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x} ${y}`).join(" ");
  const area = points.length
    ? `${line} L${points[points.length - 1][0]} ${height} L${points[0][0]} ${height} Z`
    : "";

  const paceY = height - (Math.min(safeDaily * dayNumber, max) / max) * height;

  return (
    <div className="trend">
      <svg
        className="trend-svg"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={`Cumulative spending so far this month, total ${formatCurrency(
          visible[visible.length - 1] || 0
        )}`}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {safeDaily > 0 && (
          <line
            className="trend-pace"
            x1="0"
            y1={paceY}
            x2={width}
            y2={paceY}
            vectorEffect="non-scaling-stroke"
          />
        )}

        {area && <path d={area} fill={`url(#${gradientId})`} />}
        {line && <path className="trend-line" d={line} vectorEffect="non-scaling-stroke" />}
      </svg>

      <div className="trend-axis">
        <span>1 {today.slice(5, 7)}</span>
        <span>day {dayNumber}</span>
        <span>{days} {today.slice(5, 7)}</span>
      </div>

      {safeDaily > 0 && (
        <p className="hint-text">
          Dashed line is the plan: {formatCurrency(Math.round(safeDaily))} a day.
        </p>
      )}
    </div>
  );
}
