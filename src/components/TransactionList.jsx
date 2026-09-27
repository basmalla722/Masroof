import { DEFAULT_CATEGORIES, findCategory } from "../data";
import { formatCurrency, formatDate } from "../utils/format";

export default function TransactionList({
  transactions,
  categories = DEFAULT_CATEGORIES,
  filter,
  onFilterChange,
  query,
  onQueryChange,
  onEdit,
  onDelete,
}) {
  const fallback = { color: "#8a7d78" };

  return (
    <div className="card">
      <h2>Transactions ({transactions.length})</h2>

      <div className="toolbar">
        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search by name…"
          aria-label="Search transactions"
        />
      </div>

      <div className="chips">
        <button
          className={`chip ${filter === "All" ? "active" : ""}`}
          onClick={() => onFilterChange("All")}
        >
          All
        </button>
        {categories.map((category) => (
          <button
            key={category.name}
            className={`chip ${filter === category.name ? "active" : ""}`}
            onClick={() => onFilterChange(category.name)}
          >
            {category.name}
          </button>
        ))}
      </div>

      {transactions.length === 0 ? (
        <p className="empty">Nothing matches. Try a different filter.</p>
      ) : (
        <ul className="list">
          {transactions.map((transaction) => {
            const category = findCategory(categories, transaction.category) ?? fallback;
            return (
              <li key={transaction.id}>
                <div className="list-main">
                  <span
                    className="badge"
                    style={{ background: `${category.color}22` }}
                  />
                  <span className="list-text">
                    <span className="list-title">{transaction.title}</span>
                    <span className="list-meta">
                      {transaction.category} · {formatDate(transaction.date)}
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
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
