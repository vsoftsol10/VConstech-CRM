const pool = require("../config/database");
const { formatDate } = require("../utils/validators");
const {
  triggerLeadWonInvitation,
} = require("../integration/services/leadWonIntegrationService");
const {
  calculateSubscriptionDates,
  getPlanForSubscription,
} = require("../services/subscriptionDateService");

const formatIntegrationResult = (result) => ({
  skipped: result.skipped,
  reason: result.reason,
  invitationId: result.invitation?.invitationId || result.mapping?.invitation_id,
  invitationUrl: result.invitation?.url || null,
  email: result.invitation?.email || result.mapping?.response_payload?.email || null,
  erpCustomerId: result.mapping?.erp_customer_id || null,
  status: result.invitation?.status || result.mapping?.status,
});

const sendIntegrationFailure = (res, { customer, error }) =>
  res.status(error.statusCode || 502).json({
    success: false,
    message: "Lead was converted to a customer, but invitation email failed.",
    customerId: customer?.id,
    integration: {
      success: false,
      error: error.message,
      code: error.code,
      details: error.details,
    },
  });

// ── POST convert lead to customer ───────────────────────────────────────────
const convertLeadToCustomer = async (req, res) => {
  const client = await pool.connect();
  let lead;
  let customer;
  let alreadyConverted = false;

  try {
    const leadId = req.params.id;

    await client.query("BEGIN");

    const result = await client.query(
      "SELECT * FROM leads WHERE id = $1 FOR UPDATE",
      [leadId]
    );
    

    lead = result.rows[0];
    if (!lead) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Lead not found" });
    }

    const existingCustomer = await client.query(
      "SELECT * FROM customers WHERE lead_id = $1 LIMIT 1",
      [leadId]
    );

    if (lead.is_customer === true || existingCustomer.rows.length > 0) {
      if (existingCustomer.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(409).json({
          success: false,
          message:
            "This lead is already marked as a customer, but no customer record was found.",
        });
      }

      customer = existingCustomer.rows[0];
      alreadyConverted = true;
    } else {
      const plan = await getPlanForSubscription(client, lead.plan);
      const { subscription_start_date, subscription_end_date } =
        calculateSubscriptionDates(plan.durationInDays);

      const customerResult = await client.query(
        `INSERT INTO customers
         (lead_id, customer_name, company_name, phone, email,
          channel, subscription_plan, subscription_amount,
          start_date, renewal_date, subscription_start_date, subscription_end_date, payment_status,
          payment_method, assigned_employee, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
         RETURNING *`,
        [
          lead.id,
          lead.full_name,
          lead.company,
          lead.phone,
          lead.email,
          lead.channel,
          plan.name,
          plan.price,
          formatDate(subscription_start_date),
          formatDate(subscription_end_date),
          subscription_start_date,
          subscription_end_date,
          "pending",
          null,
          null,
          lead.notes || lead.requirements,
        ]
      );

      customer = customerResult.rows[0];

      await client.query(
        `INSERT INTO subscription_history
         (customer_id, customer_name, plan_name, amount, action_type, start_date, end_date)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [
          customer.id,
          lead.full_name,
          plan.name,
          plan.price,
          "NEW",
          formatDate(subscription_start_date),
          formatDate(subscription_end_date),
        ]
      );

      await client.query(
        "UPDATE leads SET is_customer = true WHERE id = $1",
        [leadId]
      );
    }

    await client.query("COMMIT");

    try {
      const integrationResult = await triggerLeadWonInvitation({
        lead,
        customer,
      });

      return res.json({
        success: true,
        message: alreadyConverted
          ? "Lead was already converted. ERP invitation status returned."
          : "Lead converted to customer and ERP invitation created.",
        customerId: customer.id,
        alreadyConverted,
        integration: {
          success: true,
          ...formatIntegrationResult(integrationResult),
        },
      });
    } catch (integrationError) {
      console.error("ERP Invitation Error:", integrationError);
      return sendIntegrationFailure(res, {
        customer,
        error: integrationError,
      });
    }

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Convert Customer Error:", err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

// ── GET subscription history ────────────────────────────────────────────────
const getSubscriptionHistory = async (req, res) => {
  try {
    const { customerId } = req.params;
    if (String(customerId || "").startsWith("ERP-CUST-")) {
      return res.json([]);
    }

    const result = await pool.query(
      `SELECT *
       FROM subscription_history
       WHERE customer_id = $1
       ORDER BY created_at DESC`,
      [customerId]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ── GET customer stats ──────────────────────────────────────────────────────
const getCustomerStats = async (req, res) => {
  try {
    const selectedYear = Number(req.query.year) || new Date().getFullYear();
    const result = await pool.query(`
      SELECT
        TO_CHAR(created_at, 'Mon') AS month,
        EXTRACT(MONTH FROM created_at) AS month_num,
        COUNT(*)::int AS users
      FROM customers
      WHERE EXTRACT(YEAR FROM created_at) = $1
      GROUP BY month, month_num
      ORDER BY month_num
    `, [selectedYear]);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  convertLeadToCustomer,
  getSubscriptionHistory,
  getCustomerStats,
};
