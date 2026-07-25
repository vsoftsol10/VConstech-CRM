const express = require("express");
const router = express.Router();
const upload = require("../config/multer");
const teamController = require("../controllers/teamController");

// ── GET /api/team ──────────────────────────────────────────────────────────
router.get("/", teamController.getAllTeamMembers);
router.get("/roles", teamController.getRoles);
router.get("/departments", teamController.getDepartments);


// ── GET /api/team/:id ──────────────────────────────────────────────────────
router.get("/:id", teamController.getTeamMemberById);

// ── POST /api/team ────────────────────────────────────────────────────────
router.post("/", upload.single("profileImage"), teamController.addTeamMember);

// ── PUT /api/team/:id ─────────────────────────────────────────────────────
router.put("/:id", upload.single("profileImage"), teamController.updateTeamMember);

// ── DELETE /api/team/:id ──────────────────────────────────────────────────
router.delete("/:id", teamController.deleteTeamMember);

module.exports = router;
