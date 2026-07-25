const express = require("express");
const router = express.Router();
const taskController = require("../controllers/taskController");

// ── Task CRUD Routes ───────────────────────────────────────────────────────
router.post("/", taskController.createTask);
router.post("/add", taskController.createTask);
router.get("/", taskController.getAllTasks);
router.get("/:id/updates", taskController.getTaskUpdates);
router.post("/:id/updates", taskController.createTaskUpdate);
router.put("/:id", taskController.updateTask);
router.put("/:id/status", taskController.updateTaskStatus);
router.delete("/:id", taskController.deleteTask);

module.exports = router;
