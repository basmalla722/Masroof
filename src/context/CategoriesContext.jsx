import { createContext, useContext, useMemo } from "react";
import { DEFAULT_CATEGORIES, findCategory } from "../data";

const CategoriesContext = createContext(null);

export function CategoriesProvider({ children }) {
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
  if (!context) throw new Error("useCategories must be used inside <CategoriesProvider>");
  return context;
}
