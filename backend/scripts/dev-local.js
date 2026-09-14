const crypto = require("node:crypto");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
process.env.NODE_ENV = "development";
process.env.JWT_SECRET = crypto.randomBytes(48).toString("hex");
process.env.FRONTEND_URLS = process.env.FRONTEND_URLS || "http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173";
async function start() {
  const db = await MongoMemoryServer.create({ binary: { version: "8.2.6" } });
  await mongoose.connect(db.getUri(), { dbName: "ledgerly_local_preview" });
  await Promise.all(["User", "Income", "Expense", "Budget", "Goal", "Recurring"].map((name) => require("../models/" + name).init()));
  const server = require("../app").listen(process.env.PORT || 8000, "127.0.0.1", () => console.log("Isolated Ledgerly API ready on port " + server.address().port));
  const stop = () => server.close(async () => { await mongoose.disconnect(); await db.stop(); process.exit(0); });
  process.on("SIGTERM", stop); process.on("SIGINT", stop);
}
start().catch((error) => { console.error(error.message); process.exit(1); });
