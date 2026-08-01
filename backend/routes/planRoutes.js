// const express = require("express");
// const router = express.Router();
// const planController = require("../controllers/planController");

// // ── Plans Routes ───────────────────────────────────────────────────────────
// router.get("/", planController.getAllPlans);
// router.put("/:id", planController.updatePlan);

// module.exports = router;


const express = require("express");
const router = express.Router();
const planController = require("../controllers/planController");

router.get("/", planController.getAllPlans);
router.post("/", planController.createPlan);
router.put("/:id", planController.updatePlan);
router.delete("/:id", planController.deletePlan);

module.exports = router;