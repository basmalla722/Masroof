export function monthKey(date) {
  if (!date) return "";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "";
  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}`;
}

export function todayIso() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

export function formatCurrency(value) {
  const amount = Number(value) || 0;
  return `${amount.toLocaleString("en-US", {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })} EGP`;
}

export function formatDate(date) {
  if (!date) return "";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function daysInMonth(key) {
  const [year, month] = String(key).split("-").map(Number);
  if (!year || !month) return 30;
  return new Date(year, month, 0).getDate();
}

export function relativeDay(date) {
  if (!date) return "";
  const today = todayIso();
  if (date === today) return "Today";
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const offset = yesterday.getTimezoneOffset() * 60000;
  if (date === new Date(yesterday.getTime() - offset).toISOString().slice(0, 10)) {
    return "Yesterday";
  }
  return formatDate(date);
}
