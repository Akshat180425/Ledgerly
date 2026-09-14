const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, enum: ["income", "expense"], required: true },
  name: { type: String, required: true, maxlength: 100 },
  amount: { type: Number, required: true, min: 0.01 },
  note: { type: String, default: "", maxlength: 500 },
  frequency: { type: String, enum: ["daily", "weekly", "monthly", "yearly"], required: true },
  startDate: { type: Date, required: true },
  nextDate: { type: Date, required: true },
  endDate: { type: Date, default: null },
  active: { type: Boolean, default: true },
  occurrence: { type: Number, default: 0 },
}, { timestamps: true });
schema.index({ active: 1, nextDate: 1 });
schema.index({ userId: 1 });
module.exports = mongoose.model("Recurring", schema);
