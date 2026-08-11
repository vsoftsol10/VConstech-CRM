const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// ── POST /api/auth/login ────────────────────────────────────────────────────
router.post("/login", authController.login);

// ── POST /api/auth/forgot-password ──────────────────────────────────────────
router.post("/forgot-password", authController.forgotPassword);

// ── POST /api/auth/reset-password/:token ────────────────────────────────────
router.post("/reset-password/:token", authController.resetPassword);

// ── POST /api/auth/change-password ─────────────────────────────────────────
router.post("/change-password", authController.changePassword);

module.exports = router;
