const { test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const mongoose = require("mongoose");
const request = require("supertest");
const { MongoMemoryServer } = require("mongodb-memory-server");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = crypto.randomBytes(48).toString("hex");
process.env.FRONTEND_URLS = "http://localhost:5173";
const app = require("../app");
const User = require("../models/User");
const Income = require("../models/Income");
const Expense = require("../models/Expense");
const Budget = require("../models/Budget");
const Goal = require("../models/Goal");
const Recurring = require("../models/Recurring");
const { processDueRecurring, occurrenceDate } = require("../services/recurringService");
let db, alice, bob, aliceId;
const today = new Date().toISOString().slice(0, 10), month = today.slice(0, 7);
const headers = { "X-Ledgerly-Request": "1", Origin: "http://localhost:5173" };
const register = (client, email) => client.post("/api/v1/auth/register").set(headers).send({ fullName: "Test User", email, password: "Test-only password 2026!" });
before(async () => {
  db = await MongoMemoryServer.create({ binary: { version: "8.2.6" } });
  await mongoose.connect(db.getUri(), { dbName: "ledgerly_test" });
  await Promise.all([User, Income, Expense, Budget, Goal, Recurring].map((Model) => Model.init()));
});
after(async () => { await mongoose.disconnect(); await db?.stop(); });
beforeEach(async () => {
  await Promise.all([User, Income, Expense, Budget, Goal, Recurring].map((Model) => Model.deleteMany({})));
  alice = request.agent(app); bob = request.agent(app);
  const result = await register(alice, "alice@example.com");
  assert.equal(result.status, 201);
  aliceId = result.body.user._id;
  assert.equal((await register(bob, "bob@example.com")).status, 201);
});
const add = (client, type, amount = 100, label = "Groceries") => client.post("/api/v1/" + type + "/add").set(headers).send({ label, amount, date: today });

test("authentication uses HTTP-only cookies and never exposes password hashes", async () => {
  const result = await alice.post("/api/v1/auth/login").set(headers).send({ email: " ALICE@EXAMPLE.COM ", password: "Test-only password 2026!" });
  assert.equal(result.status, 200);
  assert.equal(result.body.token, undefined);
  assert.equal(result.body.user.password, undefined);
  assert.equal(result.body.user.sessionVersion, undefined);
  assert.equal(result.body.user.currency, "INR");
  assert.match(result.headers["set-cookie"][0], /HttpOnly/);
  assert.match(result.headers["set-cookie"][0], /SameSite=Lax/);
  assert.equal((await alice.get("/api/v1/auth/getUser")).status, 200);
});
test("password validation, invalid credentials, duplicate email and NoSQL payloads are rejected", async () => {
  assert.equal((await request(app).post("/api/v1/auth/register").set(headers).send({ fullName: "A", email: "a@example.com", password: "short" })).status, 400);
  assert.equal((await register(request(app), "ALICE@example.com")).status, 409);
  assert.equal((await request(app).post("/api/v1/auth/login").set(headers).send({ email: "alice@example.com", password: "incorrect" })).status, 401);
  assert.equal((await request(app).post("/api/v1/auth/login").set(headers).send({ email: { $ne: null }, password: "incorrect" })).status, 400);
});
test("all finance routes require authentication", async () => {
  for (const path of ["income/get", "expense/get", "dashboard", "transactions", "budgets", "goals", "recurring"]) assert.equal((await request(app).get("/api/v1/" + path)).status, 401, path);
});
test("CSRF and untrusted origins cannot mutate data", async () => {
  assert.equal((await alice.post("/api/v1/income/add").send({ label: "Salary", amount: 100, date: today })).status, 403);
  assert.equal((await alice.post("/api/v1/income/add").set({ ...headers, Origin: "https://evil.example" }).send({ label: "Salary", amount: 100, date: today })).status, 403);
  const response = await request(app).options("/api/v1/auth/login").set("Origin", "https://evil.example");
  assert.equal(response.headers["access-control-allow-origin"], undefined);
});
test("logout revokes replayed JWTs and deleted accounts cannot authenticate", async () => {
  const login = await alice.post("/api/v1/auth/login").set(headers).send({ email: "alice@example.com", password: "Test-only password 2026!" });
  const cookie = login.headers["set-cookie"][0].split(";")[0];
  assert.equal((await alice.post("/api/v1/auth/logout").set(headers)).status, 204);
  assert.equal((await request(app).get("/api/v1/transactions").set("Cookie", cookie)).status, 401);
  await alice.post("/api/v1/auth/login").set(headers).send({ email: "alice@example.com", password: "Test-only password 2026!" });
  await User.deleteOne({ _id: aliceId });
  assert.equal((await alice.get("/api/v1/transactions")).status, 401);
});
test("expired or incorrectly signed JWTs are rejected", async () => {
  const expired = jwt.sign({ id: aliceId, version: 0 }, process.env.JWT_SECRET, { expiresIn: -1, issuer: "ledgerly", audience: "ledgerly-web" });
  assert.equal((await request(app).get("/api/v1/transactions").set("Cookie", "ledgerly_session=" + expired)).status, 401);
  assert.equal((await request(app).get("/api/v1/transactions").set("Cookie", "ledgerly_session=invalid")).status, 401);
});
test("transactions remain private when listing, editing, deleting, and exporting", async () => {
  const item = await add(alice, "expense", 120, "Private category");
  assert.equal(item.status, 201);
  assert.equal((await bob.get("/api/v1/transactions")).body.total, 0);
  assert.equal((await bob.delete("/api/v1/expense/" + item.body._id).set(headers)).status, 404);
  assert.equal((await bob.put("/api/v1/expense/" + item.body._id).set(headers).send({ label: "Other", amount: 1, date: today })).status, 404);
  assert.ok(!(await bob.get("/api/v1/transactions/export")).text.includes("Private category"));
  assert.equal((await alice.put("/api/v1/expense/" + item.body._id).set(headers).send({ label: "Edited", amount: 150, date: today })).body.amount, 150);
  assert.equal((await alice.delete("/api/v1/expense/" + item.body._id).set(headers)).status, 204);
});
test("invalid amounts, IDs, dates, and filter ranges receive client errors", async () => {
  for (const amount of [-1, 0, "NaN", true, 0.001, 1000000001]) assert.equal((await add(alice, "income", amount)).status, 400, String(amount));
  assert.equal((await alice.post("/api/v1/expense/add").set(headers).send({ label: "Bad", amount: 10, date: "2026-02-30" })).status, 400);
  assert.equal((await alice.delete("/api/v1/income/invalid").set(headers)).status, 400);
  assert.equal((await alice.get("/api/v1/transactions?minAmount=100&maxAmount=1")).status, 400);
  assert.equal((await alice.get("/api/v1/transactions?start=2026-02-02&end=2026-02-01")).status, 400);
  assert.equal((await alice.get("/api/v1/transactions?page=0")).status, 400);
});
test("search, category, type, amount filters, pagination and exports use matching data", async () => {
  await add(alice, "income", 1000, "Salary");
  await add(alice, "expense", 80, "Groceries");
  await add(alice, "expense", 30, "Travel");
  const filtered = await alice.get("/api/v1/transactions?type=expense&minAmount=50&q=grocer");
  assert.equal(filtered.body.total, 1); assert.equal(filtered.body.expense, 80);
  const page = await alice.get("/api/v1/transactions?pageSize=1&page=2&sort=highest");
  assert.equal(page.body.items[0].amount, 80); assert.equal(page.body.total, 3);
  const beyondLastPage = await alice.get("/api/v1/transactions?pageSize=1&page=100&sort=highest");
  assert.equal(beyondLastPage.body.page, 3); assert.equal(beyondLastPage.body.items[0].amount, 30);
  const exported = await alice.get("/api/v1/transactions/export?type=expense&category=groceries");
  assert.match(exported.text, /Groceries/); assert.ok(!exported.text.includes("Salary")); assert.ok(!exported.text.includes("Travel"));
});
test("CSV formula injection is neutralized and Excel export is a valid workbook", async () => {
  await add(alice, "income", 123.45, "=1+1");
  const csv = await alice.get("/api/v1/transactions/export?format=csv");
  assert.match(csv.text, /'=1\+1/);
  const xlsx = await alice.get("/api/v1/transactions/export?format=xlsx").buffer(true).parse((res, callback) => {
    const chunks = []; res.on("data", (chunk) => chunks.push(chunk)); res.on("end", () => callback(null, Buffer.concat(chunks)));
  });
  const workbook = new (require("exceljs").Workbook)();
  await workbook.xlsx.load(xlsx.body);
  assert.equal(workbook.worksheets[0].getCell("D2").value, 123.45);
  assert.equal(workbook.worksheets[0].getCell("C2").type, require("exceljs").ValueType.String);
});
test("monthly budgets normalize categories, warn at the threshold, and detect overspending", async () => {
  const budget = await alice.post("/api/v1/budgets").set(headers).send({ scope: "category", category: "Groceries", amount: 100, month, warningThreshold: 80 });
  assert.equal(budget.status, 201);
  await add(alice, "expense", 79, "groceries");
  assert.equal((await alice.get("/api/v1/budgets?month=" + month)).body[0].status, "on-track");
  const warning = await add(alice, "expense", 1, "GROCERIES");
  assert.equal(warning.body.warnings[0].status, "warning");
  await add(alice, "expense", 25, "Groceries");
  const over = (await alice.get("/api/v1/budgets?month=" + month)).body[0];
  assert.equal(over.status, "exceeded"); assert.equal(over.remaining, -5);
  assert.equal((await bob.get("/api/v1/budgets?month=" + month)).body.length, 0);
  assert.equal((await bob.delete("/api/v1/budgets/" + budget.body._id).set(headers)).status, 404);
  assert.equal((await alice.post("/api/v1/budgets").set(headers).send({ scope: "category", category: "GROCERIES", amount: 50, month })).status, 409);
});
test("savings contributions are atomic, support withdrawals, and enforce account isolation", async () => {
  const goal = await alice.post("/api/v1/goals").set(headers).send({ name: "Emergency", targetAmount: 1000 });
  assert.equal(goal.status, 201);
  const path = "/api/v1/goals/" + goal.body._id + "/contributions";
  await Promise.all([1, 2, 3].map(() => alice.post(path).set(headers).send({ type: "deposit", amount: 0.1 })));
  assert.equal((await alice.get("/api/v1/goals")).body[0].savedAmount, 0.3);
  assert.equal((await alice.post(path).set(headers).send({ type: "withdraw", amount: 0.4 })).status, 400);
  assert.equal((await alice.post(path).set(headers).send({ type: "withdraw", amount: 0.1 })).body.savedAmount, 0.2);
  assert.equal((await bob.post(path).set(headers).send({ type: "deposit", amount: 100 })).status, 404);
  assert.equal((await bob.put("/api/v1/goals/" + goal.body._id).set(headers).send({ name: "Other", targetAmount: 1 })).status, 404);
});
test("monthly and yearly schedules preserve end-of-month and leap-year anchors", () => {
  const monthly = { startDate: new Date("2024-01-31"), frequency: "monthly" };
  assert.equal(occurrenceDate(monthly, 1).toISOString().slice(0, 10), "2024-02-29");
  assert.equal(occurrenceDate(monthly, 2).toISOString().slice(0, 10), "2024-03-31");
  const yearly = { startDate: new Date("2024-02-29"), frequency: "yearly" };
  assert.equal(occurrenceDate(yearly, 1).toISOString().slice(0, 10), "2025-02-28");
  assert.equal(occurrenceDate(yearly, 4).toISOString().slice(0, 10), "2028-02-29");
});
test("recurring catch-up is idempotent across concurrent runs and stops at end date", async () => {
  const rule = await Recurring.create({ userId: aliceId, type: "expense", name: "Rent", amount: 500, frequency: "monthly", startDate: new Date("2024-01-31"), nextDate: new Date("2024-01-31"), endDate: new Date("2024-03-31") });
  await Promise.all([processDueRecurring(aliceId, new Date("2024-04-01")), processDueRecurring(aliceId, new Date("2024-04-01"))]);
  await processDueRecurring(aliceId, new Date("2024-05-01"));
  assert.equal(await Expense.countDocuments({ recurringId: rule._id }), 3);
  assert.equal((await Recurring.findById(rule._id)).active, false);
});
test("paused schedules do not post until resumed and users cannot alter other schedules", async () => {
  const rule = await Recurring.create({ userId: aliceId, type: "income", name: "Salary", amount: 500, frequency: "monthly", startDate: new Date(today), nextDate: new Date(today), active: false });
  await processDueRecurring(aliceId);
  assert.equal(await Income.countDocuments({}), 0);
  assert.equal((await bob.patch("/api/v1/recurring/" + rule.id).set(headers).send({ active: true })).status, 404);
  assert.equal((await alice.patch("/api/v1/recurring/" + rule.id).set(headers).send({ active: true })).status, 200);
  await processDueRecurring(aliceId);
  assert.equal(await Income.countDocuments({ recurringId: rule._id }), 1);
});
test("analytics aggregates duplicate categories and fills empty trend periods", async () => {
  await add(alice, "income", 1000, "Salary"); await add(alice, "expense", 100, "Travel"); await add(alice, "expense", 50, "travel");
  const data = (await alice.get("/api/v1/dashboard?month=" + month)).body;
  assert.equal(data.income, 1000); assert.equal(data.expense, 150); assert.equal(data.net, 850);
  assert.equal(data.categories.length, 1); assert.equal(data.categories[0].amount, 150);
  assert.equal(data.savingsRate, 85); assert.equal(data.trends.length, 6); assert.ok(data.daily.length >= 28);
  assert.equal((await bob.get("/api/v1/dashboard?month=" + month)).body.totalBalance, 0);
});
test("the balance includes all recorded civil dates across the local/UTC midnight boundary", async () => {
  const nextDate = new Date(); nextDate.setUTCDate(nextDate.getUTCDate() + 1);
  await alice.post("/api/v1/income/add").set(headers).send({ label: "Salary", amount: 1000, date: nextDate.toISOString().slice(0, 10) });
  await add(alice, "expense", 100, "Groceries");
  assert.equal((await alice.get("/api/v1/dashboard")).body.totalBalance, 900);
});
test("profile upload is authenticated and validates image bytes", async () => {
  assert.equal((await request(app).post("/api/v1/auth/upload-image").set(headers).attach("image", Buffer.from("not an image"), "photo.png")).status, 401);
  assert.equal((await alice.post("/api/v1/auth/upload-image").set(headers).attach("image", Buffer.from("not an image"), "photo.png")).status, 400);
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jf1kAAAAASUVORK5CYII=", "base64");
  assert.equal((await alice.post("/api/v1/auth/upload-image").set(headers).attach("image", png, "photo.png")).status, 200);
  assert.equal((await alice.get("/api/v1/auth/photo")).headers["content-type"], "image/png");
  assert.equal((await bob.get("/api/v1/auth/photo")).status, 404);
});
test("Google login verifies audience, rejects unverified tokens, and never auto-links existing email", async () => {
  process.env.GOOGLE_CLIENT_ID = "test.apps.googleusercontent.com";
  const original = OAuth2Client.prototype.verifyIdToken;
  let payload = { sub: "google-test-user", email: "google@example.com", email_verified: true, name: "Google User" };
  OAuth2Client.prototype.verifyIdToken = async function (options) {
    assert.equal(options.audience, process.env.GOOGLE_CLIENT_ID);
    if (options.idToken === "bad") throw new Error("Bad signature");
    return { getPayload: () => payload };
  };
  try {
    assert.equal((await request(app).post("/api/v1/auth/google").set(headers).send({ credential: "bad" })).status, 401);
    payload.email_verified = false;
    assert.equal((await request(app).post("/api/v1/auth/google").set(headers).send({ credential: "valid" })).status, 401);
    payload.email_verified = true;
    const response = await request(app).post("/api/v1/auth/google").set(headers).send({ credential: "valid" });
    assert.equal(response.status, 200); assert.equal(response.body.user.googleLinked, true);
    payload = { ...payload, sub: "alice-google", email: "alice@example.com" };
    assert.equal((await request(app).post("/api/v1/auth/google").set(headers).send({ credential: "valid" })).status, 409);
    assert.equal((await alice.post("/api/v1/auth/google/link").set(headers).send({ credential: "valid" })).status, 200);
    assert.equal((await request(app).post("/api/v1/auth/google").set(headers).send({ credential: "valid" })).status, 200);
  } finally { OAuth2Client.prototype.verifyIdToken = original; delete process.env.GOOGLE_CLIENT_ID; }
});
