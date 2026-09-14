const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  name: { type: String, required: true, maxlength: 100 },
  targetAmount: { type: Number, required: true, min: 0.01 },
  savedCents: { type: Number, default: 0, min: 0 },
  targetDate: { type: Date, default: null },
  contributions: [{ amount: Number, note: String, date: { type: Date, default: Date.now } }],
}, { timestamps: true });
module.exports = mongoose.model("Goal", schema);
