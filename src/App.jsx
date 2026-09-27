import { useEffect, useRef } from "react";
import Header from "./components/Header";
import Summary from "./components/Summary";
import { useCategories } from "./context/CategoriesContext";
import { useData } from "./context/DataContext";
import { usePreferences } from "./context/PreferencesContext";
import useHashRoute from "./hooks/useHashRoute";
import Dashboard, { useDerived } from "./views/Dashboard";
import Expenses from "./views/Expenses";
import Budgets from "./views/Budgets";
import Insights from "./views/Insights";

export default function App() {
  const [route, navigate] = useHashRoute();
  const { theme, toggleTheme, reduced } = usePreferences();
  const { transactions, monthTransactions, budget } = useData();
  const { categories } = useCategories();
  const { allCategories } = useDerived();
  const headRef = useRef(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  }, [route, reduced]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const spent = monthTransactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  return (
    <div className="app">
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <Header
        ref={headRef}
        route={route}
        onNavigate={navigate}
        theme={theme}
        onToggleTheme={toggleTheme}
        onGoTop={() =>
          window.scrollTo({ top: 0, behavior: "smooth" })
        }
      />

      <main id="main" tabIndex={-1}>
        {route === "dashboard" && (
          <Dashboard />
        )}

        {route === "expenses" && <Expenses />}

        {route === "budgets" && <Budgets />}

        {route === "insights" && <Insights />}
      </main>

      {route === "dashboard" && transactions.length > 0 && (
        <section className="card foot-summary">
          <h2>Month at a glance</h2>
          <Summary
            transactions={monthTransactions}
            budget={budget}
            categories={allCategories || categories}
          />
        </section>
      )}
    </div>
  );
}
