const erpApiClient = require("../services/erpApiClient");
const {
  syncCustomerStatus,
} = require("../services/customerStatusSyncService");
const {
  handleDirectPricingPurchase,
} = require("../services/directPricingPurchaseService");
const {
  getRegistrationInvitation,
  markInvitationRegistered,
} = require("../services/leadWonIntegrationService");

const sendSuccess = (res, data, statusCode = 200) =>
  res.status(statusCode).json({
    success: true,
    data,
  });

const handleIntegrationError = (res, error) =>
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message,
    code: error.code,
    details: error.details,
  });

const integrationController = {
  sendInvitation: async (req, res) => {
    try {
      const data = await erpApiClient.sendInvitation(req.body);
      sendSuccess(res, data, 201);
    } catch (error) {
      handleIntegrationError(res, error);
    }
  },

  createCustomer: async (req, res) => {
    try {
      const data = await erpApiClient.createCustomer(req.body);
      sendSuccess(res, data, 201);
    } catch (error) {
      handleIntegrationError(res, error);
    }
  },

  getCustomerStatus: async (req, res) => {
    try {
      const data = await erpApiClient.getCustomerStatus(req.params.customerId);
      sendSuccess(res, data);
    } catch (error) {
      handleIntegrationError(res, error);
    }
  },

  updateCustomerStatus: async (req, res) => {
    try {
      const data = await erpApiClient.updateCustomerStatus(
        req.params.customerId,
        req.body
      );
      sendSuccess(res, data);
    } catch (error) {
      handleIntegrationError(res, error);
    }
  },

  receiveCustomerStatusEvent: async (req, res) => {
    try {
      const data = await syncCustomerStatus(req.body);
      sendSuccess(res, data, data.idempotent ? 200 : 201);
    } catch (error) {
      handleIntegrationError(res, error);
    }
  },

  directPricingPurchase: async (req, res) => {
    try {
      const data = await handleDirectPricingPurchase(req.body);
      sendSuccess(res, data, data.created ? 201 : 200);
    } catch (error) {
      handleIntegrationError(res, error);
    }
  },

  getRegistrationInvitation: async (req, res) => {
    try {
      const data = await getRegistrationInvitation(req.params.invitationId);
      sendSuccess(res, data);
    } catch (error) {
      handleIntegrationError(res, error);
    }
  },

  markInvitationRegistered: async (req, res) => {
    try {
      const data = await markInvitationRegistered({
        invitationId: req.params.invitationId,
        erpCustomerId: req.body.erpCustomerId,
        erpUserId: req.body.erpUserId,
        erpClientId: req.body.erpClientId,
      });
      sendSuccess(res, data);
    } catch (error) {
      handleIntegrationError(res, error);
    }
  },
};

module.exports = integrationController;
