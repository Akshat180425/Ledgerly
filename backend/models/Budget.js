const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  month: { type: String, required: true },
  category: { type: String, required: true, maxlength: 100 },
  categoryKey: { type: String, required: true },
  amount: { type: Number, required: true, min: 0.01 },
  warningThreshold: { type: Number, default: 80, min: 1, max: 100 },
}, { timestamps: true });
schema.index({ userId: 1, month: 1, categoryKey: 1 }, { unique: true });
module.exports = mongoose.model("Budget", schema);
