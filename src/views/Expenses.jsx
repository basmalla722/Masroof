import { useMemo, useState } from "react";
import { useData } from "../context/DataContext";
import { useCategories } from "../context/CategoriesContext";
import TransactionForm from "../components/TransactionForm";
import TransactionList from "../components/TransactionList";
import { EmptyState } from "../components/states";
import { colorFor } from "../data";
import Soft from "../hooks/Soft";

export default function Expenses() {
  const { transactions, addTransaction, updateTransaction, deleteTransaction, deleteAllTransactions } =
    useData();
  const { categories } = useCategories();

  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");

  const allCategories = useMemo(() => {
    const used = [...new Set(transactions.map((t) => t.category))];
    return [
      ...categories,
      ...used
        .filter((name) => !categories.some((c) => c.name === name))
        .map((name) => ({ name, color: colorFor(name) })),
    ];
  }, [categories, transactions]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return transactions.filter((t) => {
      if (filter !== "all" && t.category !== filter) return false;
      if (!needle) return true;
      return (
        t.title.toLowerCase().includes(needle) || t.category.toLowerCase().includes(needle)
      );
    });
  }, [transactions, filter, query]);

  function handleSubmit(values) {
    if (editing) {
      updateTransaction(editing.id, values);
      setEditing(null);
      return;
    }
    addTransaction(values);
  }

  function handleDelete(id) {
    deleteTransaction(id);
    if (editing?.id === id) setEditing(null);
  }

  return (
    <>
      <Soft className="split">
        <TransactionForm
          editing={editing}
          onSubmit={handleSubmit}
          onCancel={() => setEditing(null)}
        />

        <div className="stack">
          {transactions.length === 0 ? (
            <EmptyState
              title="Nothing here yet"
              body="Fill in the form and your first expense shows up on the right, sorted by date."
            />
          ) : (
            <TransactionList
              transactions={visible}
              categories={allCategories}
              filter={filter}
              onFilterChange={setFilter}
              query={query}
              onQueryChange={setQuery}
              onEdit={setEditing}
              onDelete={handleDelete}
              onDeleteAll={deleteAllTransactions}
              total={transactions.length}
            />
          )}
        </div>
      </Soft>
    </>
  );
}
