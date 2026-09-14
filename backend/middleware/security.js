exports.allowedOrigins = () => (process.env.FRONTEND_URLS || "http://localhost:5173,http://localhost:5174,https://ledgerly-five.vercel.app")
  .split(",").map((origin) => origin.trim().replace(/\/$/, "")).filter(Boolean);
exports.csrfGuard = (req, res, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  // Custom headers require a CORS preflight, including for multipart uploads.
  if (req.get("X-Ledgerly-Request") !== "1" || (req.get("Origin") && !exports.allowedOrigins().includes(req.get("Origin")))) {
    return res.status(403).json({ message: "Request origin could not be verified" });
  }
  next();
};
