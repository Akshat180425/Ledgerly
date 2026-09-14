const dayjs = require("dayjs");
dayjs.extend(require("dayjs/plugin/utc"));
const Recurring = require("../models/Recurring");
const Income = require("../models/Income");
const Expense = require("../models/Expense");
const units = { daily: "day", weekly: "week", monthly: "month", yearly: "year" };
const occurrenceDate = (rule, occurrence) => dayjs.utc(rule.startDate).add(occurrence, units[rule.frequency]).startOf("day").toDate();

async function processRule(rule, now) {
  const Model = rule.type === "income" ? Income : Expense;
  let processed = 0;
  while (rule.active && rule.nextDate <= now && processed < 400) {
    if (rule.endDate && rule.nextDate > rule.endDate) {
      await Recurring.updateOne({ _id: rule._id, occurrence: rule.occurrence }, { $set: { active: false } });
      break;
    }
    const occurrenceKey = String(rule._id) + ":" + rule.nextDate.toISOString().slice(0, 10);
    // Insert before advancing the cursor. The unique key makes retries and concurrent runs harmless.
    try {
      await Model.updateOne({ occurrenceKey }, { $setOnInsert: {
        userId: rule.userId, [rule.type === "income" ? "source" : "category"]: rule.name,
        amount: rule.amount, date: rule.nextDate, note: rule.note, recurringId: rule._id, occurrenceKey,
      } }, { upsert: true });
    } catch (error) { if (error.code !== 11000) throw error; }
    const occurrence = rule.occurrence + 1;
    const nextDate = occurrenceDate(rule, occurrence);
    const updated = await Recurring.findOneAndUpdate(
      { _id: rule._id, active: true, occurrence: rule.occurrence },
      { $set: { occurrence, nextDate, active: !rule.endDate || nextDate <= rule.endDate } }, { new: true },
    );
    if (!updated) break;
    rule = updated;
    processed++;
  }
  return processed;
}
async function processDueRecurring(userId, now = new Date()) {
  const query = { active: true, nextDate: { $lte: now } };
  if (userId) query.userId = userId;
  const rules = await Recurring.find(query).sort({ nextDate: 1 }).limit(100);
  let processed = 0;
  for (const rule of rules) processed += await processRule(rule, now);
  return processed;
}
module.exports = { occurrenceDate, processDueRecurring };
