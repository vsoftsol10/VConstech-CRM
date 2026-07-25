const express = require("express");
const apiKeyAuth = require("../middleware/apiKeyAuth");
const integrationController = require("../controllers/integrationController");

const router = express.Router();

router.use(apiKeyAuth);

router.post("/invitations", integrationController.sendInvitation);
router.get(
  "/registration-invitations/:invitationId",
  integrationController.getRegistrationInvitation
);
router.patch(
  "/registration-invitations/:invitationId/registered",
  integrationController.markInvitationRegistered
);
router.post("/customers", integrationController.createCustomer);
router.get(
  "/customers/:customerId/status",
  integrationController.getCustomerStatus
);
router.patch(
  "/customers/:customerId/status",
  integrationController.updateCustomerStatus
);
router.post(
  "/customer-status-events",
  integrationController.receiveCustomerStatusEvent
);
router.post(
  "/direct-pricing-purchases",
  integrationController.directPricingPurchase
);

module.exports = router;
