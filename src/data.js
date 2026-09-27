export const DEFAULT_CATEGORIES = [
  { name: "Food", color: "#e07a5f" },
  { name: "Transport", color: "#4a7c9e" },
  { name: "Study", color: "#8b6bb1" },
  { name: "Health", color: "#5a9e7f" },
  { name: "Entertainment", color: "#d9a441" },
];

export const CATEGORY_PALETTE = [
  "#e07a5f",
  "#4a7c9e",
  "#8b6bb1",
  "#5a9e7f",
  "#d9a441",
  "#c26b8a",
  "#5f8fc2",
  "#7a9e4e",
  "#b56b4e",
  "#6b7bb5",
];

export function colorFor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) % 100003;
  }
  return CATEGORY_PALETTE[hash % CATEGORY_PALETTE.length];
}

export function findCategory(categories, name) {
  return categories.find((category) => category.name === name);
}
