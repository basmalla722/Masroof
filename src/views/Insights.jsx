import InsightsPanel from "../components/InsightsPanel";
import { useDerived } from "./Dashboard";
import { EmptyState } from "../components/states";
import Soft from "../hooks/Soft";

const LEVELS = [
  { key: "critical", label: "Needs attention" },
  { key: "warning", label: "Worth watching" },
  { key: "info", label: "Good to know" },
  { key: "good", label: "Going well" },
];

export default function Insights() {
  const { insights, spent } = useDerived();

  const grouped = LEVELS.map((level) => ({
    ...level,
    items: insights.filter((insight) => insight.level === level.key),
  })).filter((group) => group.items.length > 0);

  return (
    <>
      {spent === 0 ? (
        <Soft>
          <EmptyState
            title="Nothing to say yet"
            body="These insights are built from your own numbers, so they stay quiet until there is something real to say."
          />
        </Soft>
      ) : insights.length === 0 ? (
        <Soft>
          <EmptyState
            tone="good"
            title="Your spending looks healthy"
            body="No category is over its limit and you are not on track to overshoot. Keep it up."
          />
        </Soft>
      ) : (
        <>
          <Soft>
            <InsightsPanel insights={insights} />
          </Soft>

          <Soft delay={80} className="dash-grid">
            {grouped.map((group) => (
              <section className="card" key={group.key}>
                <h2>
                  {group.label}{" "}
                  <span className="count-pill">{group.items.length}</span>
                </h2>
                <ul className="rule-list">
                  {group.items.map((insight) => (
                    <li key={insight.id}>
                      <span className={`dot dot-${insight.level}`} />
                      <div>
                        <strong>{insight.title}</strong>
                        <p>{insight.body}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </Soft>
        </>
      )}
    </>
  );
}
