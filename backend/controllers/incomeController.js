const transactions = require("./transactionController");
exports.addIncome = transactions.add("income");
exports.getAllIncome = transactions.legacyList("income");
exports.deleteIncome = transactions.remove("income");
exports.downloadIncomeExcel = transactions.exportData("income");
