const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const { rateLimit } = require("express-rate-limit");
const mongoose = require("mongoose");
const path = require("node:path");
const { csrfGuard, allowedOrigins } = require("./middleware/security");
const app = express();
app.set("trust proxy", Number(process.env.TRUST_PROXY_HOPS || 1));
app.disable("x-powered-by");
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({
  origin(origin, callback) { callback(null, !origin || allowedOrigins().includes(origin)); },
  credentials: true, methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "X-Ledgerly-Request"], exposedHeaders: ["Content-Disposition"],
}));
app.use(express.json({ limit: "32kb" }));
app.use(cookieParser());
app.use((req, res, next) => {
  if (req.body === undefined) req.body = {};
  if (req.is("application/json") && (req.body === null || typeof req.body !== "object" || Array.isArray(req.body))) {
    return res.status(400).json({ message: "Request body must be a JSON object" });
  }
  next();
});
app.use("/api", (req, res, next) => { res.set("Cache-Control", "no-store"); next(); });
app.use("/api", rateLimit({ windowMs: 60_000, limit: 300, standardHeaders: "draft-8", legacyHeaders: false }));
app.use("/api", csrfGuard);
app.get("/api/v1/health", (req, res) => {
  const ready = mongoose.connection.readyState === 1;
  res.status(ready ? 200 : 503).json({ status: ready ? "ok" : "unavailable" });
});
app.use("/api/v1/auth", require("./routes/authRoutes"));
app.use("/api/v1/income", require("./routes/incomeRoutes"));
app.use("/api/v1/expense", require("./routes/expenseRoutes"));
app.use("/api/v1/dashboard", require("./routes/dashboardRoutes"));
app.use("/api/v1", require("./routes/financeRoutes"));
// Keep existing avatar URLs readable while all new uploads use private MongoDB storage.
app.get("/uploads/:filename", (req, res, next) => {
  const filename = req.params.filename;
  if (filename !== path.basename(filename) || filename.startsWith(".") || !/\.(png|jpe?g)$/i.test(filename)) return res.status(404).end();
  res.type(/\.png$/i.test(filename) ? "image/png" : "image/jpeg");
  res.sendFile(filename, { root: path.join(__dirname, "uploads"), dotfiles: "deny" }, (error) => { if (error) next(error); });
});
app.use((req, res) => res.status(404).json({ message: "Endpoint not found" }));
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  let status = error.status || 500, message = error.message;
  if (error.name === "ValidationError" || error.name === "CastError") { status = 400; message = "Invalid field value"; }
  if (error.code === 11000) { status = 409; message = "This record already exists"; }
  if (error.code === "LIMIT_FILE_SIZE") { status = 413; message = "Image must be smaller than 2 MB"; }
  if (status >= 500) { console.error("API error:", error.name); message = "Unable to complete the request. Please try again."; }
  res.status(status).json({ message });
});
module.exports = app;
