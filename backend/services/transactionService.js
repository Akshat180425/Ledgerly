const { Types } = require("mongoose");
const Income = require("../models/Income");
const Expense = require("../models/Expense");
const { fail, money, date, escaped, text } = require("../utils/validation");
const project = (type) => ({ $project: { userId: 1, amount: 1, date: 1, note: 1, icon: 1, recurringId: 1, source: 1, category: 1, label: type === "income" ? "$source" : "$category", type: { $literal: type }, createdAt: 1 } });
function transactionPipeline(userId, query = {}) {
  const user = { userId: new Types.ObjectId(String(userId)) };
  const filter = {};
  if (query.type && query.type !== "all") {
    if (!["income", "expense"].includes(query.type)) fail("Invalid transaction type");
    filter.type = query.type;
  }
  if (query.q) {
    const regex = { $regex: escaped(text(query.q, "Search", 100)), $options: "i" };
    filter.$or = [{ label: regex }, { note: regex }];
  }
  if (query.category) filter.label = { $regex: "^" + escaped(text(query.category, "Category")) + "$", $options: "i" };
  if (query.start || query.end) {
    filter.date = {};
    if (query.start) filter.date.$gte = date(query.start, "Start date");
    if (query.end) { const end = date(query.end, "End date"); end.setUTCDate(end.getUTCDate() + 1); filter.date.$lt = end; }
    if (filter.date.$gte && filter.date.$lt && filter.date.$gte >= filter.date.$lt) fail("Start date must not be after end date");
  }
  if (query.minAmount || query.maxAmount) {
    filter.amount = {};
    if (query.minAmount) filter.amount.$gte = money(query.minAmount, "Minimum amount", true);
    if (query.maxAmount) filter.amount.$lte = money(query.maxAmount, "Maximum amount", true);
    if (filter.amount.$gte > filter.amount.$lte) fail("Minimum amount must not exceed maximum amount");
  }
  return [
    { $match: user }, project("income"),
    { $unionWith: { coll: Expense.collection.name, pipeline: [{ $match: user }, project("expense")] } },
    { $match: filter },
  ];
}
function sortOrder(value = "newest") {
  const sorts = { newest: { date: -1, _id: -1 }, oldest: { date: 1, _id: 1 }, highest: { amount: -1, date: -1, _id: -1 }, lowest: { amount: 1, date: -1, _id: -1 } };
  if (!sorts[value]) fail("Invalid sort order");
  return sorts[value];
}
const transactionInput = (body, type) => ({
  [type === "income" ? "source" : "category"]: text(body[type === "income" ? "source" : "category"] ?? body.label, type === "income" ? "Source" : "Category"),
  amount: money(body.amount), date: date(body.date),
  note: body.note ? text(body.note, "Note", 500) : "",
  icon: typeof body.icon === "string" && body.icon.length <= 500 ? body.icon : "",
});
module.exports = { transactionPipeline, sortOrder, transactionInput, Income, Expense };
