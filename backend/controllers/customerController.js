const pool = require("../config/database");
const { formatDate } = require("../utils/validators");
const { sendSubscriptionReminderEmail } = require("../utils/emailUtil");
const {
  calculateSubscriptionDates,
  getPlanForSubscription,
  normalizePlanKey,
} = require("../services/subscriptionDateService");
const {
  createCustomerRecord,
  findCustomerDuplicate,
  normalizeEmail,
  normalizePhone,
  normalizePlan,
  validateCustomerPayload,
} = require("../services/customerService");
const erpApiClient = require("../integration/services/erpApiClient");

const sendValidationError = (res, errors) =>
  res.status(400).json({ success: false, message: "Please fix the highlighted fields.", errors });

const formattedCustomerSelect = `
  id, customer_name, company_name, phone, email,
  renewal_date >= CURRENT_DATE AS active,
  subscription_plan, subscription_amount,
  subscription_start_date, subscription_end_date,
  payment_status, payment_method, assigned_employee, notes, channel,
  reminder_sent,
  EXISTS (
    SELECT 1 FROM subscription_history sh
    WHERE sh.customer_id = customers.id AND sh.action_type = 'RENEWED'
  ) AS has_renewed,
  TO_CHAR(start_date, 'DD Mon YYYY') AS start_date,
  TO_CHAR(renewal_date, 'DD Mon YYYY') AS renewal_date,
  TO_CHAR(reminder_sent_date, 'DD Mon YYYY') AS reminder_sent_date
`;

const unwrapErpCustomer = (response) => response?.customer || response?.data?.customer || response;
const unwrapErpCustomers = (response) =>
  response?.customers || response?.data?.customers || (Array.isArray(response) ? response : []);

const toErpPayload = (body) => ({
  customer_name: body.customer_name || body.name,
  company_name: body.company_name || body.company,
  phone: body.phone,
  email: body.email,
  address: body.address,
  subscription_plan: body.subscription_plan,
  notes: body.notes,
});

const createCustomer = async (req, res) => {
  try {
    const data = await erpApiClient.createCustomer(toErpPayload(req.body));
    res.status(201).json({ success: true, customer: unwrapErpCustomer(data) });
  } catch (err) {
    console.error(err.message);
    res.status(err.statusCode || err.status || 502).json({
      success: false,
      message: err.message,
      details: err.details,
    });
  }
};

const getAllCustomers = async (req, res) => {
  try {
    const data = await erpApiClient.getCustomers(req.query);
    res.json(unwrapErpCustomers(data));
  } catch (err) {
    res.status(err.statusCode || 502).json({
      success: false,
      error: err.message,
      details: err.details,
    });
  }
};

const getCustomerById = async (req, res) => {
  try {
    const data = await erpApiClient.getCustomer(req.params.id);
    res.json(unwrapErpCustomer(data));
  } catch (err) {
    res.status(err.statusCode || 502).json({
      success: false,
      message: err.message,
      details: err.details,
    });
  }
};

const updateCustomer = async (req, res) => {
  try {
    const data = await erpApiClient.updateCustomer(req.params.id, toErpPayload(req.body));
    res.json({ success: true, customer: unwrapErpCustomer(data) });
  } catch (err) {
    res.status(err.statusCode || err.status || 502).json({
      success: false,
      message: err.message,
      details: err.details,
    });
  }
};

const updateCustomerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { active } = req.body;
    const nextStatus = active ? "Subscription Active" : "Subscription Expired";

    await erpApiClient.updateCustomerStatus(id, {
      status: nextStatus,
      accountStatus: active ? "ACTIVE" : "INACTIVE",
      isActive: Boolean(active),
    });

    const data = await erpApiClient.getCustomer(id);
    res.json({ success: true, customer: unwrapErpCustomer(data) });
  } catch (err) {
    res.status(err.statusCode || err.status || 502).json({
      success: false,
      message: err.message,
      details: err.details,
    });
  }
};

const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    await erpApiClient.deleteCustomer(id);
    res.json({ success: true });
  } catch (err) {
    res.status(err.statusCode || 502).json({
      success: false,
      message: err.message,
      details: err.details,
    });
  }
};

const renewSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await pool.query("SELECT * FROM customers WHERE id = $1", [id]);

    if (customer.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    const data = customer.rows[0];
    const plan = await getPlanForSubscription(pool, data.subscription_plan);
    const subscriptionDates = calculateSubscriptionDates(plan.durationInDays);

    await pool.query(
      `UPDATE customers
       SET start_date = $1,
           renewal_date = $2,
           subscription_start_date = $3,
           subscription_end_date = $4
       WHERE id = $5`,
      [
        formatDate(subscriptionDates.subscription_start_date),
        formatDate(subscriptionDates.subscription_end_date),
        subscriptionDates.subscription_start_date,
        subscriptionDates.subscription_end_date,
        id,
      ]
    );

    await pool.query(
      `INSERT INTO subscription_history
       (customer_id, customer_name, plan_name, amount, action_type, start_date, end_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [
        id,
        data.customer_name,
        plan.name,
        plan.price,
        "RENEWED",
        formatDate(subscriptionDates.subscription_start_date),
        formatDate(subscriptionDates.subscription_end_date),
      ]
    );

    res.json({ success: true, message: "Subscription renewed" });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

const sendReminder = async (req, res) => {
  try {
    const { id } = req.params;
    const today = new Date().toISOString().split("T")[0];
    const { subject, message, channel = "both" } = req.body || {};

    const current = await pool.query("SELECT * FROM customers WHERE id = $1", [id]);
    if (current.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    const customer = current.rows[0];
    const emailStatus =
      channel === "message"
        ? { sent: false, skipped: true }
        : await sendSubscriptionReminderEmail({
            name: customer.customer_name,
            email: customer.email,
            subject,
            message,
          });

    const messageStatus = channel === "email"
      ? { sent: false, skipped: true }
      : { sent: true, channel: "message", phone: customer.phone || null };

    const result = await pool.query(
      `UPDATE customers
       SET reminder_sent = true, reminder_sent_date = $1
       WHERE id = $2
       RETURNING *,
         renewal_date >= CURRENT_DATE AS active,
         TO_CHAR(start_date, 'DD Mon YYYY') AS start_date,
         TO_CHAR(renewal_date, 'DD Mon YYYY') AS renewal_date,
         TO_CHAR(reminder_sent_date, 'DD Mon YYYY') AS reminder_sent_date`,
      [today, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    res.json({
      success: true,
      message: "Reminder sent successfully",
      customer: result.rows[0],
      delivery: {
        email: emailStatus,
        message: messageStatus,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  createCustomer,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  updateCustomerStatus,
  deleteCustomer,
  renewSubscription,
  sendReminder,
};
