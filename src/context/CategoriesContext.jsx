import { createContext, useContext, useEffect, useMemo } from "react";
import { DEFAULT_CATEGORIES, findCategory } from "../data";

const STALE_KEY = "expense-tracker-custom-categories";

const CategoriesContext = createContext(null);

export function CategoriesProvider({ children }) {
  useEffect(() => {
    window.localStorage.removeItem(STALE_KEY);
  }, []);

  const value = useMemo(
    () => ({
      categories: DEFAULT_CATEGORIES,
      findCategory: (name) => findCategory(DEFAULT_CATEGORIES, name),
    }),
    []
  );

  return (
    <CategoriesContext.Provider value={value}>{children}</CategoriesContext.Provider>
  );
}

export function useCategories() {
  const context = useContext(CategoriesContext);
  if (!context) {
    throw new Error("useCategories must be used inside <CategoriesProvider>");
  }
  return context;
}
