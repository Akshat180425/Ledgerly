const Goal = require("../models/Goal");
const { text, money, date, id, fail, round } = require("../utils/validation");
const present = (goal) => {
  const obj = goal.toObject ? goal.toObject() : goal;
  const savedAmount = obj.savedCents / 100;
  return { ...obj, savedAmount, remaining: Math.max(0, round(obj.targetAmount - savedAmount)), percent: round(savedAmount / obj.targetAmount * 100) };
};
const input = (body) => ({ name: text(body.name, "Goal name"), targetAmount: money(body.targetAmount, "Target"), targetDate: body.targetDate ? date(body.targetDate, "Target date") : null });
exports.list = async (req, res) => res.json((await Goal.find({ userId: req.user.id }).sort({ createdAt: -1 })).map(present));
exports.add = async (req, res) => res.status(201).json(present(await Goal.create({ userId: req.user.id, ...input(req.body) })));
exports.update = async (req, res) => {
  const goal = await Goal.findOneAndUpdate({ _id: id(req.params.id), userId: req.user.id }, { $set: input(req.body) }, { new: true, runValidators: true });
  if (!goal) fail("Goal not found", 404);
  res.json(present(goal));
};
exports.contribute = async (req, res) => {
  const amount = money(req.body.amount);
  if (!["deposit", "withdraw"].includes(req.body.type)) fail("Choose deposit or withdrawal");
  const cents = Math.round(amount * 100) * (req.body.type === "withdraw" ? -1 : 1);
  const filter = { _id: id(req.params.id), userId: req.user.id, savedCents: cents < 0 ? { $gte: -cents } : { $lte: 100_000_000_000 - cents } };
  const note = req.body.note ? text(req.body.note, "Note", 200) : "";
  const goal = await Goal.findOneAndUpdate(filter, {
    $inc: { savedCents: cents },
    $push: { contributions: { $each: [{ amount: cents / 100, note, date: new Date() }], $slice: -100 } },
  }, { new: true, runValidators: true });
  if (!goal) {
    if (!await Goal.exists({ _id: req.params.id, userId: req.user.id })) fail("Goal not found", 404);
    fail("The contribution would put savings below zero or above 1 billion");
  }
  res.json(present(goal));
};
exports.remove = async (req, res) => {
  if (!await Goal.findOneAndDelete({ _id: id(req.params.id), userId: req.user.id })) fail("Goal not found", 404);
  res.status(204).end();
};
