const { isObjectIdOrHexString } = require("mongoose");
const fail = (message, status = 400) => { const error = new Error(message); error.status = status; throw error; };
const text = (value, name, max = 100) => {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max) fail(name + " is required and must be at most " + max + " characters");
  return value.trim();
};
const money = (value, name = "Amount", allowZero = false) => {
  if (!["string", "number"].includes(typeof value) || String(value).trim() === "") fail(name + " must be a valid amount");
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < (allowZero ? 0 : 0.01) || amount > 1_000_000_000 || Math.abs(amount * 100 - Math.round(amount * 100)) > 0.0001) {
    fail(name + " must be " + (allowZero ? "zero or " : "") + "positive, with at most two decimal places (maximum 1 billion)");
  }
  return Math.round(amount * 100) / 100;
};
const date = (value, name = "Date") => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}(T.*)?$/.test(value)) fail(name + " must be a valid date");
  const day = value.slice(0, 10), result = new Date(day + "T00:00:00.000Z");
  if (Number.isNaN(result.getTime()) || result.toISOString().slice(0, 10) !== day || result.getUTCFullYear() < 2000 || result.getUTCFullYear() > 2100) fail(name + " must be between 2000 and 2100");
  return result;
};
const monthRange = (value = new Date().toISOString().slice(0, 7)) => {
  if (typeof value !== "string" || !/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) fail("Month must use YYYY-MM");
  const start = date(value + "-01", "Month"), end = new Date(start);
  end.setUTCMonth(end.getUTCMonth() + 1);
  return { month: value, start, end };
};
const id = (value) => { if (!isObjectIdOrHexString(value)) fail("Invalid record ID"); return value; };
const round = (value) => Math.round((value + Number.EPSILON) * 100) / 100;
const escaped = (value) => value.replace(/[$.*+?^{}()|[\]\\]/g, "\\$&");
module.exports = { fail, text, money, date, monthRange, id, round, escaped };
