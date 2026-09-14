const dayjs = require("dayjs");
dayjs.extend(require("dayjs/plugin/utc"));
const { transactionPipeline, Income } = require("../services/transactionService");
const { getBudgets } = require("../services/budgetService");
const Goal = require("../models/Goal");
const { monthRange, round } = require("../utils/validation");
exports.getDashboardData = async (req, res) => {
  const { month, start, end } = monthRange(req.query.month);
  const trendStart = dayjs.utc(start).subtract(5, "month").toDate();
  const [all, budgets, goals] = await Promise.all([
    Income.aggregate([...transactionPipeline(req.user.id), { $facet: {
      totals: [{ $group: { _id: "$type", total: { $sum: "$amount" } } }],
      monthly: [{ $match: { date: { $gte: start, $lt: end } } }, { $group: { _id: "$type", total: { $sum: "$amount" }, count: { $sum: 1 } } }],
      categories: [{ $match: { type: "expense", date: { $gte: start, $lt: end } } }, { $group: { _id: { $toLower: "$label" }, name: { $first: "$label" }, amount: { $sum: "$amount" }, count: { $sum: 1 } } }, { $sort: { amount: -1 } }],
      trends: [{ $match: { date: { $gte: trendStart, $lt: end } } }, { $group: { _id: { month: { $dateToString: { format: "%Y-%m", date: "$date" } }, type: "$type" }, amount: { $sum: "$amount" } } }],
      daily: [{ $match: { date: { $gte: start, $lt: end } } }, { $group: { _id: { day: { $dateToString: { format: "%Y-%m-%d", date: "$date" } }, type: "$type" }, amount: { $sum: "$amount" } } }],
      recent: [{ $match: { date: { $gte: start, $lt: end } } }, { $sort: { date: -1, _id: -1 } }, { $limit: 6 }],
    } }]), getBudgets(req.user.id, month), Goal.find({ userId: req.user.id }).sort({ targetDate: 1 }).lean(),
  ]);
  const data = all[0], total = (items, type) => round(items.find((item) => item._id === type)?.total || 0);
  const totalIncome = total(data.totals, "income"), totalExpense = total(data.totals, "expense");
  const income = total(data.monthly, "income"), expense = total(data.monthly, "expense");
  const trends = Array.from({ length: 6 }, (_, i) => {
    const key = dayjs.utc(trendStart).add(i, "month").format("YYYY-MM");
    const value = (type) => round(data.trends.find((item) => item._id.month === key && item._id.type === type)?.amount || 0);
    return { month: key, label: dayjs.utc(key + "-01").format("MMM"), income: value("income"), expense: value("expense") };
  });
  const daily = Array.from({ length: dayjs.utc(start).daysInMonth() }, (_, i) => {
    const key = dayjs.utc(start).add(i, "day").format("YYYY-MM-DD");
    const value = (type) => round(data.daily.find((item) => item._id.day === key && item._id.type === type)?.amount || 0);
    return { date: key, day: i + 1, income: value("income"), expense: value("expense") };
  });
  res.json({ month, totalIncome, totalExpense, totalBalance: round(totalIncome - totalExpense),
    income, expense, net: round(income - expense), savingsRate: income > 0 ? round((income - expense) / income * 100) : null,
    transactionCount: data.monthly.reduce((sum, item) => sum + item.count, 0),
    categories: data.categories.map((item) => ({ ...item, amount: round(item.amount), percent: expense ? round(item.amount / expense * 100) : 0 })),
    trends, daily, recentTransactions: data.recent, budgets,
    goals: goals.map((goal) => ({ ...goal, savedAmount: goal.savedCents / 100, percent: round(goal.savedCents / 100 / goal.targetAmount * 100) })),
  });
};
