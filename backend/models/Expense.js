const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  icon: { type: String, maxlength: 500 },
  category: { type: String, required: true, trim: true, maxlength: 100 },
  note: { type: String, default: "", maxlength: 500 },
  amount: { type: Number, required: true, min: 0.01, max: 1_000_000_000 },
  date: { type: Date, default: Date.now, required: true },
  occurrenceKey: { type: String },
  recurringId: { type: mongoose.Schema.Types.ObjectId, ref: "Recurring" },
}, { timestamps: true });
schema.index({ userId: 1, date: -1 });
schema.index({ occurrenceKey: 1 }, { unique: true, partialFilterExpression: { occurrenceKey: { $type: "string" } } });
module.exports = mongoose.model("Expense", schema);
