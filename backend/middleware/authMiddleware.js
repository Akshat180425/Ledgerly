const jwt = require("jsonwebtoken");
const User = require("../models/User");
const cookieOptions = () => ({ httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/api" });
exports.cookieOptions = cookieOptions;
exports.startSession = (res, user) => {
  const token = jwt.sign({ id: String(user._id), version: user.sessionVersion || 0 }, process.env.JWT_SECRET, {
    algorithm: "HS256", expiresIn: "8h", issuer: "ledgerly", audience: "ledgerly-web",
  });
  res.cookie("ledgerly_session", token, { ...cookieOptions(), maxAge: 8 * 60 * 60 * 1000 });
};
exports.protect = async (req, res, next) => {
  const token = req.cookies?.ledgerly_session;
  if (!token) return res.status(401).json({ message: "Please sign in to continue" });
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"], issuer: "ledgerly", audience: "ledgerly-web" });
  } catch { return res.status(401).json({ message: "Your session expired. Please sign in again." }); }
  const user = await User.findById(decoded.id).select("+sessionVersion");
  if (!user || decoded.version !== (user.sessionVersion || 0)) return res.status(401).json({ message: "Please sign in again" });
  req.user = user;
  next();
};
