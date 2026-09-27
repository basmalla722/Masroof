import { DEFAULT_CATEGORIES, findCategory } from "../data";
import { formatCurrency, relativeDay } from "../utils/format";
import { NoResults } from "./states";
import Reveal from "./Reveal";

export default function TransactionList({
  transactions,
  categories = DEFAULT_CATEGORIES,
  filter,
  onFilterChange,
  query,
  onQueryChange,
  onEdit,
  onDelete,
  onDeleteAll,
  total,
}) {
  const fallback = { color: "#8a7d78" };
  const count = total ?? transactions.length;

  return (
    <div className="card">
      <div className="card-head">
        <h2>Transactions ({count})</h2>
        {onDeleteAll && count > 0 && (
          <button
            className="mini danger"
            onClick={() => {
              if (window.confirm("Delete every expense? This cannot be undone.")) {
                onDeleteAll();
              }
            }}
          >
            Delete all
          </button>
        )}
      </div>

      <div className="toolbar">
        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search by name or category…"
          aria-label="Search transactions"
        />
      </div>

      <div className="chips">
        <button
          className={`chip ${filter === "all" ? "active" : ""}`}
          onClick={() => onFilterChange("all")}
          aria-pressed={filter === "all"}
        >
          All
        </button>
        {categories.map((category) => (
          <button
            key={category.name}
            className={`chip ${filter === category.name ? "active" : ""}`}
            onClick={() => onFilterChange(category.name)}
            aria-pressed={filter === category.name}
          >
            {category.name}
          </button>
        ))}
      </div>

      {transactions.length === 0 ? (
        query.trim() ? (
          <NoResults query={query.trim()} onClear={() => onQueryChange("")} />
        ) : (
          <p className="empty">Nothing in this category yet.</p>
        )
      ) : (
        <ul className="list">
          {transactions.map((transaction, index) => {
            const category = findCategory(categories, transaction.category) ?? fallback;
            return (
              <Reveal
                as="li"
                key={transaction.id}
                delay={Math.min(index, 8) * 55}
              >
                <div className="list-main">
                  <span
                    className="badge"
                    style={{ background: `${category.color}22` }}
                  />
                  <span className="list-text">
                    <span className="list-title">{transaction.title}</span>
                    <span className="list-meta">
                      {transaction.category} · {relativeDay(transaction.date)}
                    </span>
                  </span>
                </div>
                <div className="list-side">
                  <span className="list-amount">
                    {formatCurrency(transaction.amount)}
                  </span>
                  <button
                    className="mini"
                    onClick={() => onEdit(transaction)}
                    aria-label={`Edit ${transaction.title}`}
                  >
                    Edit
                  </button>
                  <button
                    className="mini danger"
                    onClick={() => onDelete(transaction.id)}
                    aria-label={`Delete ${transaction.title}`}
                  >
                    Delete
                  </button>
                </div>
              </Reveal>
            );
          })}
        </ul>
      )}
    </div>
  );
}
