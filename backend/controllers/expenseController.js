const transactions = require("./transactionController");
exports.addExpense = transactions.add("expense");
exports.getAllExpense = transactions.legacyList("expense");
exports.deleteExpense = transactions.remove("expense");
exports.downloadExpenseExcel = transactions.exportData("expense");
