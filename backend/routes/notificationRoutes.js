const express = require("express");
const router = express.Router();
const controller = require("../controllers/notificationController");

router.get("/", controller.getNotifications);
router.get("/count", controller.getNotificationCount);
router.put("/:id/read", controller.markNotificationRead);

module.exports = router;
