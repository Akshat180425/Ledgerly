const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const schema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, select: false, required() { return !this.googleId; } },
  googleId: { type: String, unique: true, sparse: true, select: false },
  profileImageUrl: { type: String, default: null },
  profileImage: { type: Buffer, select: false },
  profileImageType: { type: String, select: false },
  currency: { type: String, enum: ["INR", "USD", "EUR", "GBP", "CAD", "AUD"], default: "INR" },
  sessionVersion: { type: Number, default: 0, select: false },
}, { timestamps: true });
schema.pre("save", async function () {
  if (this.isModified("password") && this.password) this.password = await bcrypt.hash(this.password, 12);
});
schema.methods.comparePassword = function (candidate) { return this.password ? bcrypt.compare(candidate, this.password) : Promise.resolve(false); };
module.exports = mongoose.model("User", schema);
