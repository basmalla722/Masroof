const formatter = new Intl.NumberFormat("en-EG", {
  style: "currency",
  currency: "EGP",
  maximumFractionDigits: 2,
});

export function formatCurrency(amount) {
  return formatter.format(amount);
}

export function formatDate(isoDate) {
  return new Date(isoDate).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function monthKey(isoDate) {
  return String(isoDate ?? "").slice(0, 7);
}

export function monthLabel(key) {
  return new Date(`${key}-01`).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}
