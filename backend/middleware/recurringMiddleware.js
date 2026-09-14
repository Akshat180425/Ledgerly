const { processDueRecurring } = require("../services/recurringService");
exports.catchUpRecurring = async (req, res, next) => { await processDueRecurring(req.user.id); next(); };
