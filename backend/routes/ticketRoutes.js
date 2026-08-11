const express = require("express");
const router = express.Router();
const controller = require("../controllers/ticketController");

router.get("/stats", controller.getTicketStats);
router.get("/department/:department", controller.getTicketsByDepartment);
router.get("/", controller.getAllTickets);
router.get("/:id/history", controller.getTicketHistory);
router.post("/:id/history", controller.createTicketHistory);
router.get("/:id", controller.getTicketById);
router.post("/", controller.createTicket);
router.post("/create", controller.createTicket);
router.put("/:id", controller.updateTicket);
router.put("/:id/status", controller.updateTicketStatus);
router.put("/:id/resolve", controller.resolveTicket);
router.put("/:id/assign", controller.assignTicket);
router.delete("/:id", controller.deleteTicket);

module.exports = router;
