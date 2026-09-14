require("dotenv").config();
const connectDB = require("./config/db");
const app = require("./app");
const { processDueRecurring } = require("./services/recurringService");
async function start() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) throw new Error("JWT_SECRET must contain at least 32 characters");
  await connectDB();
  await Promise.all(["User", "Income", "Expense", "Budget", "Goal", "Recurring"].map((name) => require("./models/" + name).init()));
  const server = app.listen(process.env.PORT || 8000, "0.0.0.0", () => console.log("Ledgerly API listening on port " + server.address().port));
  const run = () => processDueRecurring().catch(() => console.error("Recurring processing failed; will retry"));
  void run();
  const timer = setInterval(run, 60_000);
  timer.unref();
  const shutdown = () => { clearInterval(timer); server.close(() => process.exit(0)); };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}
start().catch((error) => { console.error(error.message); process.exit(1); });
