export function EmptyState({ title, body, action, tone = "calm" }) {
  return (
    <div className={`state state-${tone}`}>
      <span className="state-mark" aria-hidden="true" />
      <h3>{title}</h3>
      {body && <p>{body}</p>}
      {action}
    </div>
  );
}

export function NoResults({ query, onClear }) {
  return (
    <div className="state state-calm">
      <h3>No expenses match "{query}"</h3>
      <p>Try a shorter word, or clear the search to see everything.</p>
      <button className="mini" onClick={onClear}>
        Clear search
      </button>
    </div>
  );
}

export function ErrorState({ title = "Something went wrong", body, onRetry }) {
  return (
    <div className="state state-error" role="alert">
      <h3>{title}</h3>
      {body && <p>{body}</p>}
      {onRetry && (
        <button className="mini" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function Skeleton({ rows = 3, height = 46 }) {
  return (
    <ul className="skeleton" aria-hidden="true">
      {Array.from({ length: rows }, (_, index) => (
        <li key={index} style={{ height, animationDelay: `${index * 110}ms` }} />
      ))}
    </ul>
  );
}

export default EmptyState;
