import { useEffect, useRef, useState } from "react";
import { useCategories } from "../context/CategoriesContext";
import { todayIso } from "../utils/format";

const OTHER = "Other";
const EMPTY = { title: "", amount: "", category: "Food", date: todayIso(), customName: "" };

export default function TransactionForm({ editing, onSubmit, onCancel }) {
  const { categories } = useCategories();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [shaking, setShaking] = useState(false);
  const shakeTimer = useRef(null);

  useEffect(() => () => clearTimeout(shakeTimer.current), []);

  useEffect(() => {
    if (editing) {
      const known = categories.some((c) => c.name === editing.category);
      const isOther = !known || editing.category === OTHER;
      setForm({
        title: editing.title,
        amount: String(editing.amount),
        category: isOther ? OTHER : editing.category,
        date: editing.date,
        customName: isOther && editing.category !== OTHER ? editing.category : "",
      });
    } else {
      setForm(EMPTY);
    }
    setErrors({});
  }, [editing, categories]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function validate() {
    const next = {};
    if (!form.title.trim()) next.title = "Fill this field";
    if (!form.amount || Number(form.amount) <= 0)
      next.amount = "Fill this field — amount must be more than 0";
    if (!form.date) next.date = "Fill this field";
    return next;
  }

  function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setShaking(false);
      clearTimeout(shakeTimer.current);
      requestAnimationFrame(() => setShaking(true));
      shakeTimer.current = setTimeout(() => setShaking(false), 450);
      const firstKey = Object.keys(nextErrors)[0];
      document.getElementById(firstKey)?.focus();
      return;
    }

    const customName = form.customName.trim();
    onSubmit({
      title: form.title.trim(),
      amount: Number(form.amount),
      category: form.category === OTHER ? customName || OTHER : form.category,
      date: form.date,
    });
  }

  const showCustom = form.category === OTHER;
  const errorCount = Object.keys(errors).length;

  return (
    <form
      className={`card form${shaking ? " shake" : ""}`}
      onSubmit={handleSubmit}
      noValidate
    >
      <h2>{editing ? "Edit expense" : "Add an expense"}</h2>

      {errorCount > 0 && (
        <div className="warning over form-error">
          Fill in the highlighted fields.
        </div>
      )}

      <label htmlFor="title">Name</label>
      <input
        id="title"
        name="title"
        value={form.title}
        onChange={handleChange}
        placeholder="Lunch at the faculty canteen"
        aria-invalid={Boolean(errors.title)}
        className={errors.title ? "invalid" : ""}
      />
      {errors.title && <p className="error">{errors.title}</p>}

      <label htmlFor="amount">Amount (EGP)</label>
      <input
        id="amount"
        name="amount"
        type="number"
        step="0.01"
        min="0"
        value={form.amount}
        onChange={handleChange}
        placeholder="45"
        aria-invalid={Boolean(errors.amount)}
        className={errors.amount ? "invalid" : ""}
      />
      {errors.amount && <p className="error">{errors.amount}</p>}

      <label htmlFor="category">Category</label>
      <select
        id="category"
        name="category"
        value={form.category}
        onChange={handleChange}
      >
        {categories.map((category) => (
          <option key={category.name} value={category.name}>
            {category.name}
          </option>
        ))}
        <option value={OTHER}>Other</option>
      </select>

      {showCustom && (
        <div className="custom-category">
          <label htmlFor="customName">
            Or write your own <span className="hint">optional</span>
          </label>
          <input
            id="customName"
            name="customName"
            value={form.customName}
            onChange={handleChange}
            placeholder="Gifts, Courses, Haircut…"
          />
          <p className="hint-text">
            {form.customName.trim()
              ? `Saved as "${form.customName.trim()}".`
              : "Empty means it stays Other."}
          </p>
        </div>
      )}

      <label htmlFor="date">Date</label>
      <input
        id="date"
        name="date"
        type="date"
        value={form.date}
        onChange={handleChange}
        aria-invalid={Boolean(errors.date)}
        className={errors.date ? "invalid" : ""}
      />
      {errors.date && <p className="error">{errors.date}</p>}

      <div className="form-actions">
        <button className="primary" type="submit">
          {editing ? "Save changes" : "Add expense"}
        </button>
        {editing && (
          <button className="secondary" type="button" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
