import { useAuth } from "../context/authContext";
export const today = () => { const now = new Date(); return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };
export const currentMonth = () => today().slice(0, 7);
export const dateLabel = (value) => new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(value));
export const monthLabel = (month) => new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(month + "-01T00:00:00Z"));
export const useMoney = () => {
  const { user } = useAuth();
  return (amount = 0, compact = false) => new Intl.NumberFormat(user?.currency === "INR" ? "en-IN" : "en-US", {
    style: "currency", currency: user?.currency || "INR", minimumFractionDigits: compact ? 0 : 2, maximumFractionDigits: compact ? 1 : 2, ...(compact ? { notation: "compact" } : {}),
  }).format(amount);
};
export const expenseCategories = ["Food & dining", "Groceries", "Transport", "Shopping", "Bills & utilities", "Rent", "Health", "Entertainment", "Education", "Travel", "Other"];
export const incomeSources = ["Salary", "Freelance", "Investments", "Business", "Gift", "Other"];
export const chartColors = ["#0c8873", "#e48c57", "#568dc4", "#ac77b9", "#c5a348", "#72877c"];
