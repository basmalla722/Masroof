import { formatCurrency } from "../../utils/format";

/**
 * Horizontal bars for spending per category.
 * Rendered as plain SVG so there is no chart library in the bundle.
 */
export default function CategoryBars({ data, total, limitFor }) {
  if (!data.length) {
    return <p className="empty">No spending to chart yet.</p>;
  }

  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <ul className="chart-bars">
      {data.map((item) => {
        const width = (item.value / max) * 100;
        const limit = limitFor?.(item.name) ?? 0;
        const over = limit > 0 && item.value > limit;
        const share = total > 0 ? Math.round((item.value / total) * 100) : 0;

        return (
          <li key={item.name}>
            <div className="chart-bar-head">
              <span className="chart-bar-name">{item.name}</span>
              <span className="chart-bar-value">
                {formatCurrency(item.value)}
                <em>{share}%</em>
              </span>
            </div>
            <div
              className="chart-bar-track"
              role="img"
              aria-label={`${item.name}: ${formatCurrency(item.value)}, ${share} percent of total`}
            >
              <div
                className={`chart-bar-fill${over ? " over" : ""}`}
                style={{
                  width: `${width}%`,
                  background: item.color,
                }}
              />
              {limit > 0 && (
                <div
                  className="chart-bar-limit"
                  style={{ left: `${Math.min((limit / max) * 100, 100)}%` }}
                  title={`Limit ${formatCurrency(limit)}`}
                />
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
