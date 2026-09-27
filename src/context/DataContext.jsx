import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { monthKey } from "../utils/format";

const DataContext = createContext(null);

const STORAGE = {
  transactions: "masroof-transactions",
  budget: "masroof-budget",
  income: "masroof-income",
  legacyTransactions: "expenses",
  legacyBudget: "budget",
  legacyIncome: "income",
  legacyTheme: "expense-tracker-theme",
};

function readLegacy() {
  if (typeof window === "undefined") return {};
  try {
    return {
      transactions: JSON.parse(localStorage.getItem(STORAGE.legacyTransactions) || "null"),
      budget: JSON.parse(localStorage.getItem(STORAGE.legacyBudget) || "null"),
      income: JSON.parse(localStorage.getItem(STORAGE.legacyIncome) || "null"),
      theme: localStorage.getItem(STORAGE.legacyTheme),
    };
  } catch {
    return {};
  }
}

const legacy = readLegacy();

export function DataProvider({ children }) {
  const [transactions, setTransactions] = useLocalStorage(
    STORAGE.transactions,
    legacy.transactions ?? []
  );
  const [budget, setBudget] = useLocalStorage(STORAGE.budget, legacy.budget ?? {});
  const [income, setIncome] = useLocalStorage(STORAGE.income, legacy.income ?? 0);

  // One time move from the old keys to the new ones, so nothing is lost
  // and the old keys can be cleared without breaking the next refresh.
  useEffect(() => {
    try {
      if (legacy.transactions) localStorage.setItem(STORAGE.transactions, JSON.stringify(transactions));
      if (legacy.budget) localStorage.setItem(STORAGE.budget, JSON.stringify(budget));
      if (legacy.income) localStorage.setItem(STORAGE.income, JSON.stringify(income));
      if (legacy.theme) localStorage.setItem("masroof-theme", legacy.theme);

      for (const key of [STORAGE.legacyTransactions, STORAGE.legacyBudget, STORAGE.legacyIncome, STORAGE.legacyTheme]) {
        localStorage.removeItem(key);
      }
    } catch {
      /* storage blocked, the app still works in memory */
    }
  }, []);

  const addTransaction = useCallback(
    (values) => {
      const entry = { id: crypto.randomUUID(), ...values };
      setTransactions((current) => [entry, ...current]);
      return entry;
    },
    [setTransactions]
  );

  const updateTransaction = useCallback(
    (id, values) => {
      setTransactions((current) =>
        current.map((entry) => (entry.id === id ? { ...entry, ...values } : entry))
      );
    },
    [setTransactions]
  );

  const deleteTransaction = useCallback(
    (id) => {
      setTransactions((current) => current.filter((entry) => entry.id !== id));
    },
    [setTransactions]
  );

  const deleteAllTransactions = useCallback(() => setTransactions([]), [setTransactions]);

  const setBudgetLimit = useCallback(
    (category, amount) => {
      setBudget((current) => ({ ...current, [category]: amount }));
    },
    [setBudget]
  );

  const deleteBudgetLimit = useCallback(
    (category) => {
      setBudget((current) => {
        const next = { ...current };
        delete next[category];
        return next;
      });
    },
    [setBudget]
  );

  const clearBudget = useCallback(() => setBudget({}), [setBudget]);

  const value = useMemo(() => {
    const thisMonth = monthKey(new Date().toISOString().slice(0, 7));
    const monthTransactions = transactions.filter((t) => monthKey(t.date) === thisMonth);

    return {
      transactions,
      monthTransactions,
      budget,
      income,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      deleteAllTransactions,
      setBudgetLimit,
      deleteBudgetLimit,
      clearBudget,
      setIncome,
    };
  }, [
    transactions,
    budget,
    income,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    deleteAllTransactions,
    setBudgetLimit,
    deleteBudgetLimit,
    clearBudget,
    setIncome,
  ]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used inside <DataProvider>");
  return context;
}
