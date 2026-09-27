import { useEffect, useMemo, useState } from "react";
import { useLocalStorage } from "./hooks/useLocalStorage";
import TransactionForm from "./components/TransactionForm";
import TransactionList from "./components/TransactionList";
import Summary from "./components/Summary";
import BudgetPanel from "./components/BudgetPanel";
import InsightsPanel from "./components/InsightsPanel";
import Logo from "./components/Logo";
import Soft from "./hooks/Soft";
import IncomePanel from "./components/IncomePanel";
import { useCategories } from "./context/CategoriesContext";
import { analyse, currentMonthKey } from "./insights";
import { monthKey } from "./utils/format";
import { colorFor } from "./data";

const EMPTY_BUDGET = {};

export default function App() {
  const { categories } = useCategories();
  const [transactions, setTransactions] = useLocalStorage("expenses", []);
  const [theme, setTheme] = useLocalStorage("expense-tracker-theme", "light");
  const [budget, setBudget] = useLocalStorage("expense-tracker-budget", EMPTY_BUDGET);
  const [income, setIncome] = useLocalStorage("expense-tracker-income", 0);
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return transactions
      .filter(
        (t) => filter === "All" || t.category === filter
      )
      .filter((t) => !term || t.title.toLowerCase().includes(term))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, filter, query]);

  const allCategories = useMemo(() => {
    const used = [...new Set(transactions.map((t) => t.category))];
    const extras = used
      .filter((name) => !categories.some((c) => c.name === name))
      .map((name) => ({ name, color: colorFor(name) }));
    return [...categories, ...extras];
  }, [categories, transactions]);

  const monthTransactions = useMemo(
    () => transactions.filter((t) => monthKey(t.date) === currentMonthKey()),
    [transactions]
  );

  const monthSpent = monthTransactions.reduce((sum, t) => sum + t.amount, 0);

  const insights = useMemo(
    () => analyse(transactions, budget, currentMonthKey(), income, allCategories),
    [transactions, budget, income, allCategories]
  );

  function handleSubmit(values) {
    if (editing) {
      setTransactions((current) =>
        current.map((t) => (t.id === editing.id ? { ...t, ...values } : t))
      );
      setEditing(null);
      return;
    }
    setTransactions((current) => [{ id: crypto.randomUUID(), ...values }, ...current]);
  }

  function handleDelete(id) {
    setTransactions((current) => current.filter((t) => t.id !== id));
    if (editing?.id === id) setEditing(null);
  }

  function setBudgetLimit(category, amount) {
    setBudget((current) => ({ ...current, [category]: amount }));
  }

  function deleteBudgetLimit(category) {
    setBudget((current) => {
      const next = { ...current };
      delete next[category];
      return next;
    });
  }

  return (
    <div className="app">
      <div className="topbar rise" style={{ "--i": 0 }}>
        <header className="brand">
          <Logo />
          <div>
            <h1>Masroof</h1>
            <p className="sub">Track what you spend</p>
          </div>
        </header>
        <button
          className="icon-button"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        >
          {theme === "light" ? "🌙 Dark mode" : "☀️ Light mode"}
        </button>
      </div>

      <Soft delay={80}>
        <IncomePanel income={income} spent={monthSpent} onSave={setIncome} />
      </Soft>

      <Soft delay={120}>
        <Summary transactions={transactions} budget={budget} categories={allCategories} />
      </Soft>

      <Soft delay={160} className="columns">
        <div>
          <TransactionForm
            editing={editing}
            onSubmit={handleSubmit}
            onCancel={() => setEditing(null)}
          />
          <BudgetPanel
            budget={budget}
            onSet={setBudgetLimit}
            onDelete={deleteBudgetLimit}
            onClearAll={() => setBudget(EMPTY_BUDGET)}
          />
        </div>

        <TransactionList
          transactions={visible}
          categories={allCategories}
          filter={filter}
          onFilterChange={setFilter}
          query={query}
          onQueryChange={setQuery}
          onEdit={setEditing}
          onDelete={handleDelete}
        />
      </Soft>

      <Soft delay={200}>
        <InsightsPanel insights={insights} />
      </Soft>
    </div>
  );
}
