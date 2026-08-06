const express = require("express");
const router = express.Router();
const customerController = require("../controllers/customerController");
const subscriptionController = require("../controllers/subscriptionController");

router.post("/", customerController.createCustomer);
router.get("/", customerController.getAllCustomers);
router.get("/converted-leads", customerController.getConvertedLeadCustomers);

router.post("/subscription-history/erp-sync", subscriptionController.syncErpSubscriptionHistory);
router.get("/subscription-history/:customerId", subscriptionController.getSubscriptionHistory);
router.get("/stats/monthly", subscriptionController.getCustomerStats);

router.get("/:id", customerController.getCustomerById);
router.put("/:id", customerController.updateCustomer);
router.patch("/:id/status", customerController.updateCustomerStatus);
router.delete("/:id", customerController.deleteCustomer);

router.post("/:id/renew", customerController.renewSubscription);
router.post("/:id/reminder", customerController.sendReminder);
router.patch("/:id/reminder", customerController.sendReminder);

module.exports = router;
