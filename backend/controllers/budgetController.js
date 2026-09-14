const Budget = require("../models/Budget");
const { getBudgets } = require("../services/budgetService");
const { text, money, monthRange, id, fail } = require("../utils/validation");
exports.list = async (req, res) => res.json(await getBudgets(req.user.id, req.query.month));
const input = (body) => {
  const month = monthRange(body.month).month;
  const category = body.scope === "overall" ? "All spending" : text(body.category, "Category");
  const warningThreshold = Number(body.warningThreshold ?? 80);
  if (!Number.isInteger(warningThreshold) || warningThreshold < 1 || warningThreshold > 100) fail("Warning threshold must be between 1 and 100");
  if (!["overall", "category"].includes(body.scope)) fail("Choose an overall or category budget");
  return { month, category, categoryKey: body.scope === "overall" ? "*" : category.toLowerCase(), amount: money(body.amount, "Budget"), warningThreshold };
};
exports.add = async (req, res) => res.status(201).json(await Budget.create({ userId: req.user.id, ...input(req.body) }));
exports.update = async (req, res) => {
  const budget = await Budget.findOneAndUpdate({ _id: id(req.params.id), userId: req.user.id }, { $set: input(req.body) }, { new: true, runValidators: true });
  if (!budget) fail("Budget not found", 404);
  res.json(budget);
};
exports.remove = async (req, res) => {
  if (!await Budget.findOneAndDelete({ _id: id(req.params.id), userId: req.user.id })) fail("Budget not found", 404);
  res.status(204).end();
};
