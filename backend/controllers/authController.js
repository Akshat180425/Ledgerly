const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const { startSession, cookieOptions } = require("../middleware/authMiddleware");
const { text, fail, escaped } = require("../utils/validation");
const googleClient = new OAuth2Client();
const safeUser = (user) => ({ _id: user._id, fullName: user.fullName, email: user.email, currency: user.currency || "INR", profileImageUrl: user.profileImageUrl, googleLinked: !!user.googleId });
const emailValue = (value) => {
  const email = text(value, "Email", 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail("Enter a valid email address");
  return email;
};
const findEmail = (email) => User.findOne({ email: { $regex: "^" + escaped(email) + "$", $options: "i" } });
exports.registerUser = async (req, res) => {
  const fullName = text(req.body.fullName, "Name"), email = emailValue(req.body.email), password = req.body.password;
  if (typeof password !== "string" || password.length < 10 || Buffer.byteLength(password, "utf8") > 72) fail("Password must have at least 10 characters and at most 72 bytes");
  if (await findEmail(email)) fail("An account with this email already exists", 409);
  const user = await User.create({ fullName, email, password });
  startSession(res, user);
  res.status(201).json({ user: safeUser(user) });
};
exports.loginUser = async (req, res) => {
  const email = emailValue(req.body.email);
  if (typeof req.body.password !== "string" || Buffer.byteLength(req.body.password, "utf8") > 72) fail("Invalid email or password", 401);
  const user = await findEmail(email).select("+password +sessionVersion +googleId");
  if (!user || !(await user.comparePassword(req.body.password))) fail("Invalid email or password", 401);
  startSession(res, user);
  res.json({ user: safeUser(user) });
};
exports.getUserInfo = async (req, res) => {
  res.json(safeUser(await User.findById(req.user.id).select("+googleId")));
};
exports.logout = async (req, res) => {
  await User.updateOne({ _id: req.user.id }, { $inc: { sessionVersion: 1 } });
  res.clearCookie("ledgerly_session", cookieOptions());
  res.status(204).end();
};
async function googlePayload(credential) {
  if (!process.env.GOOGLE_CLIENT_ID) fail("Google sign-in is not configured yet", 503);
  if (typeof credential !== "string" || credential.length > 10_000) fail("Invalid Google credential", 401);
  try {
    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: process.env.GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email_verified || !payload.email) fail("Google email is not verified", 401);
    return payload;
  } catch { fail("Google sign-in could not be verified. Please try again.", 401); }
}
exports.googleLogin = async (req, res) => {
  const payload = await googlePayload(req.body.credential);
  let user = await User.findOne({ googleId: payload.sub }).select("+sessionVersion +googleId");
  if (!user) {
    const email = emailValue(payload.email);
    if (await findEmail(email)) fail("Sign in with your password first, then connect Google in Settings.", 409);
    user = await User.create({ email, fullName: text(payload.name || email.split("@")[0], "Name"), googleId: payload.sub, profileImageUrl: payload.picture?.startsWith("https://") ? payload.picture : null });
  }
  startSession(res, user);
  res.json({ user: safeUser(user) });
};
exports.linkGoogle = async (req, res) => {
  const payload = await googlePayload(req.body.credential);
  if (payload.email.toLowerCase() !== req.user.email.toLowerCase()) fail("Use the Google account with the same email as your Ledgerly account");
  const user = await User.findByIdAndUpdate(req.user.id, { $set: { googleId: payload.sub } }, { new: true, runValidators: true }).select("+googleId");
  res.json(safeUser(user));
};
exports.updateProfile = async (req, res) => {
  const fullName = text(req.body.fullName, "Name");
  if (!["INR", "USD", "EUR", "GBP", "CAD", "AUD"].includes(req.body.currency)) fail("Unsupported currency");
  const user = await User.findByIdAndUpdate(req.user.id, { fullName, currency: req.body.currency }, { new: true, runValidators: true }).select("+googleId");
  res.json(safeUser(user));
};
exports.uploadPhoto = async (req, res) => {
  if (!req.file) fail("Choose an image");
  const data = req.file.buffer;
  const png = data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const jpeg = data[0] === 255 && data[1] === 216 && data[2] === 255;
  if (!png && !jpeg) fail("Choose a PNG or JPEG image");
  const imageUrl = "/api/v1/auth/photo?v=" + Date.now();
  await User.updateOne({ _id: req.user.id }, { $set: { profileImage: data, profileImageType: png ? "image/png" : "image/jpeg", profileImageUrl: imageUrl } });
  res.json({ imageUrl });
};
exports.getPhoto = async (req, res) => {
  const user = await User.findById(req.user.id).select("+profileImage +profileImageType");
  if (!user?.profileImage) fail("Image not found", 404);
  res.type(user.profileImageType).send(user.profileImage);
};
