import { useState } from "react";
import { useCategories } from "../context/CategoriesContext";
import { colorFor, findCategory } from "../data";
import { formatCurrency } from "../utils/format";
import Reveal from "./Reveal";

const OTHER = "Other";

export default function BudgetPanel({
  budget,
  onSet,
  onDelete,
  onClearAll,
  categories: categoriesProp,
}) {
  const { categories: defaults } = useCategories();
  const categories = categoriesProp ?? defaults;
  const [category, setCategory] = useState(categories[0]?.name ?? "Food");
  const [customName, setCustomName] = useState("");
  const [value, setValue] = useState("");

  function handleSave(event) {
    event.preventDefault();
    const amount = Number(value);
    if (!value || Number.isNaN(amount) || amount <= 0) return;

    const name = category === OTHER ? customName.trim() || OTHER : category;
    onSet(name, amount);
    setValue("");
    if (category === OTHER) setCustomName("");
  }

  const limits = Object.entries(budget).filter(([, amount]) => amount > 0);

  return (
    <div className="card">
      <h2>Monthly budget</h2>

      <form className="form" onSubmit={handleSave} noValidate>
        <label htmlFor="budget-category">Category</label>
        <select
          id="budget-category"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        >
          {categories.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name}
            </option>
          ))}
          {!categories.some((c) => c.name === "Other") && <option value="Other">Other</option>}
        </select>

        {category === OTHER && (
          <div className="custom-category">
            <label htmlFor="budget-custom">
              Or write your own <span className="hint">optional</span>
            </label>
            <input
              id="budget-custom"
              value={customName}
              onChange={(event) => setCustomName(event.target.value)}
              placeholder="Gifts, Courses, Haircut…"
            />
            <p className="hint-text">
              {customName.trim()
                ? `The limit will be set for "${customName.trim()}".`
                : "Empty means it stays Other."}
            </p>
          </div>
        )}

        <label htmlFor="budget-amount">Limit (EGP)</label>
        <input
          id="budget-amount"
          type="number"
          min="0"
          step="50"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="1000"
        />

        <div className="form-actions">
          <button className="primary" type="submit">
            Set limit
          </button>
          {limits.length > 0 && (
            <button className="secondary" type="button" onClick={onClearAll}>
              Clear all
            </button>
          )}
        </div>
      </form>

      <h3>Current limits</h3>
      {limits.length === 0 ? (
        <p className="empty">No limits set yet.</p>
      ) : (
        <ul className="list">
          {limits.map(([name, amount], index) => {
            const meta = findCategory(categories, name);
            const color = meta?.color ?? colorFor(name);
            return (
              <Reveal as="li" key={name} delay={Math.min(index, 8) * 55}>
                <div className="list-main">
                  <span className="badge" style={{ background: `${color}22` }} />
                  <span className="list-text">
                    <span className="list-title">{name}</span>
                  </span>
                </div>
                <span className="list-amount">{formatCurrency(amount)}</span>
                <button
                  className="icon-x"
                  onClick={() => onDelete(name)}
                  aria-label={`Delete the ${name} limit`}
                  title={`Delete the ${name} limit`}
                >
                  ✕
                </button>
              </Reveal>
            );
          })}
        </ul>
      )}
    </div>
  );
}
