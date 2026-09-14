require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const { processDueRecurring } = require("../services/recurringService");
async function run() {
  try {
    await connectDB();
    await Promise.all(["Income", "Expense", "Recurring"].map((name) => require("../models/" + name).init()));
    const count = await processDueRecurring();
    console.log("Recurring occurrences posted: " + count);
  }
  finally { await mongoose.disconnect(); }
}
run().catch((error) => { console.error(error.message); process.exitCode = 1; });
