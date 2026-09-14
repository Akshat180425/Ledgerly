const { Types } = require("mongoose");
const Budget = require("../models/Budget");
const Expense = require("../models/Expense");
const { monthRange, round } = require("../utils/validation");
async function getBudgets(userId, month) {
  const range = monthRange(month);
  const [budgets, spending] = await Promise.all([
    Budget.find({ userId, month: range.month }).sort({ categoryKey: 1 }).lean(),
    Expense.aggregate([
      { $match: { userId: new Types.ObjectId(String(userId)), date: { $gte: range.start, $lt: range.end } } },
      { $group: { _id: { $toLower: { $trim: { input: "$category" } } }, spent: { $sum: "$amount" } } },
    ]),
  ]);
  const total = round(spending.reduce((sum, item) => sum + item.spent, 0));
  return budgets.map((budget) => {
    const spent = round(budget.categoryKey === "*" ? total : spending.find((item) => item._id === budget.categoryKey)?.spent || 0);
    const percent = round(spent / budget.amount * 100);
    return { ...budget, spent, remaining: round(budget.amount - spent), percent, status: percent >= 100 ? "exceeded" : percent >= budget.warningThreshold ? "warning" : "on-track" };
  });
}
module.exports = { getBudgets };
