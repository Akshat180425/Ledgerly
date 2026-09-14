const Recurring = require("../models/Recurring");
const { processDueRecurring } = require("../services/recurringService");
const { text, money, date, id, fail } = require("../utils/validation");
exports.list = async (req, res) => res.json(await Recurring.find({ userId: req.user.id }).sort({ active: -1, nextDate: 1 }));
exports.add = async (req, res) => {
  const body = req.body;
  if (!["income", "expense"].includes(body.type) || !["daily", "weekly", "monthly", "yearly"].includes(body.frequency)) fail("Choose a transaction type and frequency");
  const startDate = date(body.startDate, "Start date");
  if (startDate < new Date(Date.now() - 366 * 86400000)) fail("Start date must be within the last year or in the future");
  const endDate = body.endDate ? date(body.endDate, "End date") : null;
  if (endDate && endDate < startDate) fail("End date must not be before start date");
  if (await Recurring.countDocuments({ userId: req.user.id }) >= 100) fail("A maximum of 100 recurring schedules is supported");
  const rule = await Recurring.create({ userId: req.user.id, type: body.type, name: text(body.name, "Category or source"), amount: money(body.amount), note: body.note ? text(body.note, "Note", 500) : "", frequency: body.frequency, startDate, nextDate: startDate, endDate });
  await processDueRecurring(req.user.id);
  res.status(201).json(await Recurring.findById(rule._id));
};
exports.update = async (req, res) => {
  const rule = await Recurring.findOne({ _id: id(req.params.id), userId: req.user.id });
  if (!rule) fail("Schedule not found", 404);
  if (req.body.active !== undefined) {
    if (typeof req.body.active !== "boolean") fail("Active must be true or false");
    rule.active = req.body.active;
  }
  if (req.body.name !== undefined) rule.name = text(req.body.name, "Category or source");
  if (req.body.amount !== undefined) rule.amount = money(req.body.amount);
  if (req.body.note !== undefined) rule.note = req.body.note ? text(req.body.note, "Note", 500) : "";
  await rule.save();
  res.json(rule);
};
exports.remove = async (req, res) => {
  if (!await Recurring.findOneAndDelete({ _id: id(req.params.id), userId: req.user.id })) fail("Schedule not found", 404);
  res.status(204).end();
};
