const ExcelJS = require("exceljs");
const { transactionPipeline, sortOrder, transactionInput, Income, Expense } = require("../services/transactionService");
const { getBudgets } = require("../services/budgetService");
const { fail, id, round } = require("../utils/validation");

exports.list = async (req, res) => {
  const page = Number(req.query.page || 1), pageSize = Number(req.query.pageSize || 20);
  if (!Number.isInteger(page) || page < 1 || page > 100_000 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) fail("Invalid pagination");
  const [data] = await Income.aggregate([...transactionPipeline(req.user.id, req.query), { $facet: {
    items: [{ $sort: sortOrder(req.query.sort) }, { $skip: (page - 1) * pageSize }, { $limit: pageSize }],
    totals: [{ $group: { _id: "$type", total: { $sum: "$amount" }, count: { $sum: 1 } } }],
  } }]);
  const total = data.totals.reduce((sum, row) => sum + row.count, 0);
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, pages);
  if (currentPage !== page && total > 0) {
    data.items = await Income.aggregate([...transactionPipeline(req.user.id, req.query), { $sort: sortOrder(req.query.sort) }, { $skip: (currentPage - 1) * pageSize }, { $limit: pageSize }]);
  }
  res.json({ items: data.items, total, page: currentPage, pageSize, pages,
    income: round(data.totals.find((row) => row._id === "income")?.total || 0),
    expense: round(data.totals.find((row) => row._id === "expense")?.total || 0) });
};
exports.categories = async (req, res) => {
  const rows = await Income.aggregate([...transactionPipeline(req.user.id), { $group: { _id: { type: "$type", key: { $toLower: "$label" } }, label: { $first: "$label" } } }, { $sort: { label: 1 } }]);
  res.json(rows.map((row) => ({ type: row._id.type, label: row.label })));
};
exports.add = (type) => async (req, res) => {
  const Model = type === "income" ? Income : Expense;
  const transaction = await Model.create({ userId: req.user.id, ...transactionInput(req.body, type) });
  const warnings = type === "expense" ? (await getBudgets(req.user.id, transaction.date.toISOString().slice(0, 7))).filter((budget) => budget.status !== "on-track") : [];
  res.status(201).json({ ...transaction.toObject(), type, warnings });
};
exports.update = (type) => async (req, res) => {
  const Model = type === "income" ? Income : Expense;
  const transaction = await Model.findOneAndUpdate({ _id: id(req.params.id), userId: req.user.id }, { $set: transactionInput(req.body, type) }, { new: true, runValidators: true });
  if (!transaction) fail("Transaction not found", 404);
  res.json(transaction);
};
exports.remove = (type) => async (req, res) => {
  const Model = type === "income" ? Income : Expense;
  if (!(await Model.findOneAndDelete({ _id: id(req.params.id), userId: req.user.id }))) fail("Transaction not found", 404);
  res.status(204).end();
};
exports.legacyList = (type) => async (req, res) => {
  const rows = await Income.aggregate([...transactionPipeline(req.user.id, { ...req.query, type }), { $sort: sortOrder(req.query.sort) }, { $limit: 10_001 }]);
  if (rows.length > 10_000) fail("Narrow the date range to fewer than 10,000 transactions");
  res.json(rows);
};
const safeCell = (value) => typeof value === "string" && /^[\s]*[=+\-@\t\r]/.test(value) ? "'" + value : value;
exports.exportData = (forcedType) => async (req, res) => {
  const format = forcedType ? "xlsx" : req.query.format || "csv";
  if (!["csv", "xlsx"].includes(format)) fail("Choose CSV or Excel export");
  const query = { ...req.query, ...(forcedType ? { type: forcedType } : {}) };
  const rows = await Income.aggregate([...transactionPipeline(req.user.id, query), { $sort: sortOrder(query.sort) }, { $limit: 10_001 }]);
  if (rows.length > 10_000) fail("Narrow the date range to export at most 10,000 transactions", 413);
  const headings = ["Date", "Type", "Category or source", "Amount", "Currency", "Note", "Recurring"];
  const values = rows.map((row) => [row.date.toISOString().slice(0, 10), row.type, row.label, row.amount, req.user.currency || "INR", row.note || "", row.recurringId ? "Yes" : "No"].map(safeCell));
  res.attachment("ledgerly-" + (forcedType || "transactions") + "." + format);
  if (format === "csv") {
    const cell = (value) => '"' + String(value).replace(/"/g, '""') + '"';
    res.type("text/csv; charset=utf-8").send("\uFEFF" + [headings, ...values].map((row) => row.map(cell).join(",")).join("\r\n"));
  } else {
    const workbook = new ExcelJS.Workbook(), sheet = workbook.addWorksheet("Transactions");
    sheet.addRow(headings);
    sheet.addRows(values);
    sheet.getRow(1).font = { bold: true };
    sheet.columns.forEach((column, i) => { column.width = [14, 12, 30, 18, 12, 45, 12][i]; });
    sheet.getColumn(4).numFmt = "#,##0.00";
    sheet.views = [{ state: "frozen", ySplit: 1 }];
    res.type("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet").send(Buffer.from(await workbook.xlsx.writeBuffer()));
  }
};
