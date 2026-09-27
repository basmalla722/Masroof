import { useLocalStorage } from "../hooks/useLocalStorage";

const ICONS = {
  critical: "🚨",
  warning: "⚠️",
  info: "💡",
  good: "✅",
};

export default function InsightsPanel({ insights, onApplyLimit }) {
  const [dismissed, setDismissed] = useLocalStorage("expense-tracker-dismissed-insights", []);

  const shown = insights.filter((insight) => !dismissed.includes(insight.id));

  function dismiss(id) {
    setDismissed((current) => (current.includes(id) ? current : [...current, id]));
  }

  function clearAll() {
    setDismissed([]);
  }

  return (
    <div className="card insights">
      <div className="insights-head">
        <h2>What your spending is telling you</h2>
        {shown.length > 0 && (
          <button className="mini danger" onClick={clearAll}>
            Delete all
          </button>
        )}
      </div>

      {shown.length === 0 ? (
        <p className="hint-text">
          {insights.length === 0
            ? "Nothing to report yet. Add a few expenses and set a budget."
            : "All cleared. New insights will show up here."}
        </p>
      ) : (
        shown.map((insight) => (
          <div key={insight.id} className={`insight ${insight.level}`}>
            <div className="insight-head">
              <span className="insight-icon">{ICONS[insight.level]}</span>
              <span className="insight-title">{insight.title}</span>
              <button
                className="icon-x"
                onClick={() => dismiss(insight.id)}
                aria-label={`Delete insight: ${insight.title}`}
                title="Delete this insight"
              >
                ✕
              </button>
            </div>
            <p className="insight-body">{insight.body}</p>
            {insight.level === "critical" && onApplyLimit && insight.category && (
              <button className="mini" onClick={() => onApplyLimit(insight.category)}>
                Adjust limit
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
}
