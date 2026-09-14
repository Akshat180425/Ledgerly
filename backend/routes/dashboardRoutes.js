const router = require("express").Router();
const { protect } = require("../middleware/authMiddleware");
const { catchUpRecurring } = require("../middleware/recurringMiddleware");
router.get("/", protect, catchUpRecurring, require("../controllers/dashboardController").getDashboardData);
module.exports = router;
