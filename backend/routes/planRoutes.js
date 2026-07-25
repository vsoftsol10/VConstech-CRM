const express = require("express");
const router = express.Router();
const planController = require("../controllers/planController");

// ── Plans Routes ───────────────────────────────────────────────────────────
router.get("/", planController.getAllPlans);
router.put("/:id", planController.updatePlan);

module.exports = router;
