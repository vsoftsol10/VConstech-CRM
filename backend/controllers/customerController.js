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
const erpSupabaseCustomerService = require("../services/erpSupabaseCustomerService");

const sendValidationError = (res, errors) =>
  res.status(400).json({ success: false, message: "Please fix the highlighted fields.", errors });

const formattedCustomerSelect = `
  id, lead_id, erp_customer_id, customer_name, company_name, phone, email,
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
  location: body.location,
  subscription_plan: body.subscription_plan,
  notes: body.notes,
});

const isErpCustomerId = (id) => String(id || "").startsWith("ERP-CUST-");
const isNumericCrmId = (id) => /^\d+$/.test(String(id || "").trim());

const getLocalCustomerById = async (id) => {
  if (!isNumericCrmId(id)) return null;
  const result = await pool.query(
    `SELECT ${formattedCustomerSelect}
     FROM customers
     WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

const getLocalCustomers = async () => {
  const result = await pool.query(
    `SELECT ${formattedCustomerSelect}
     FROM customers
     ORDER BY id DESC`
  );
  return result.rows;
};

const updateLocalCustomer = async (id, body) => {
  const existing = await getLocalCustomerById(id);
  if (!existing) return null;

  const { values, errors } = validateCustomerPayload(body);
  if (Object.keys(errors).length > 0) {
    const error = new Error("Please fix the highlighted fields.");
    error.status = 400;
    error.errors = errors;
    throw error;
  }

  const duplicate = await findCustomerDuplicate(pool, {
    email: values.email,
    phone: values.phone,
    excludeId: id,
  });
  if (duplicate) {
    const error = new Error("Customer already exists.");
    error.status = 409;
    error.errors = {
      ...(normalizeEmail(duplicate.email) === values.email
        ? { email: "This email address already exists." }
        : {}),
      ...(normalizePhone(duplicate.phone) === values.phone
        ? { phone: "This phone number already exists." }
        : {}),
    };
    throw error;
  }

  await pool.query(
    `UPDATE customers
     SET customer_name = $1,
         company_name = $2,
         phone = $3,
         email = $4,
         subscription_plan = $5,
         notes = $6
     WHERE id = $7`,
    [
      values.customer_name,
      values.company_name,
      values.phone,
      values.email,
      values.subscription_plan,
      values.notes || null,
      id,
    ]
  );

  return getLocalCustomerById(id);
};

const deleteLocalCustomer = async (id) => {
  if (!isNumericCrmId(id)) return null;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const current = await client.query(
      "SELECT id, lead_id FROM customers WHERE id = $1 FOR UPDATE",
      [id]
    );
    const customer = current.rows[0];
    if (!customer) {
      await client.query("ROLLBACK");
      return null;
    }

    await client.query("DELETE FROM subscription_history WHERE customer_id = $1", [id]);
    await client.query("DELETE FROM crm_erp_customer_mappings WHERE customer_id = $1", [id]);
    await client.query("DELETE FROM crm_erp_status_events WHERE crm_customer_id = $1", [id]);
    await client.query("DELETE FROM customers WHERE id = $1", [id]);

    if (customer.lead_id) {
      await client.query("UPDATE leads SET is_customer = false WHERE id = $1", [customer.lead_id]);
    }

    await client.query("COMMIT");
    return { success: true };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

const createCustomer = async (req, res) => {
  try {
    const erpSupabaseCustomer = erpSupabaseCustomerService.isConfigured()
      ? await erpSupabaseCustomerService.createCustomer(toErpPayload(req.body))
      : null;
    if (erpSupabaseCustomer) {
      return res.status(201).json({ success: true, customer: erpSupabaseCustomer });
    }

    const data = await erpApiClient.createCustomer(toErpPayload(req.body));
    return res.status(201).json({ success: true, customer: unwrapErpCustomer(data) });
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
    const localCustomers = await getLocalCustomers();
    if (localCustomers.length > 0 || req.query.source !== "erp") {
      return res.json(localCustomers);
    }

    const erpSupabaseData = erpSupabaseCustomerService.isConfigured()
      ? await erpSupabaseCustomerService.getCustomers(req.query)
      : null;
    if (erpSupabaseData) {
      return res.json(erpSupabaseData.customers);
    }

    const data = await erpApiClient.getCustomers(req.query);
    return res.json(unwrapErpCustomers(data));
  } catch (err) {
    console.error("Customer source unavailable, using local CRM customers:", err.message);
    try {
      return res.json(await getLocalCustomers());
    } catch (localErr) {
      return res.status(500).json({
        success: false,
        error: localErr.message,
      });
    }
  }
};

const getConvertedLeadCustomers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ${formattedCustomerSelect}
       FROM customers
       WHERE lead_id IS NOT NULL
       ORDER BY id DESC`
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const getCustomerById = async (req, res) => {
  try {
    const localCustomer = await getLocalCustomerById(req.params.id);
    if (localCustomer) {
      return res.json(localCustomer);
    }

    const erpSupabaseCustomer = erpSupabaseCustomerService.isConfigured()
      ? await erpSupabaseCustomerService.getCustomer(req.params.id)
      : null;
    if (erpSupabaseCustomer) {
      return res.json(erpSupabaseCustomer);
    }

    const data = await erpApiClient.getCustomer(req.params.id);
    return res.json(unwrapErpCustomer(data));
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
    const localCustomer = await updateLocalCustomer(req.params.id, req.body);
    if (localCustomer) {
      return res.json({ success: true, customer: localCustomer });
    }

    const erpSupabaseCustomer = erpSupabaseCustomerService.isConfigured()
      ? await erpSupabaseCustomerService.updateCustomer(req.params.id, toErpPayload(req.body))
      : null;
    if (erpSupabaseCustomer) {
      return res.json({ success: true, customer: erpSupabaseCustomer });
    }

    const data = await erpApiClient.updateCustomer(req.params.id, toErpPayload(req.body));
    return res.json({ success: true, customer: unwrapErpCustomer(data) });
  } catch (err) {
    if (err.errors) return sendValidationError(res, err.errors);
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

    const erpSupabaseCustomer = erpSupabaseCustomerService.isConfigured()
      ? await erpSupabaseCustomerService.updateCustomerStatus(id, {
          status: nextStatus,
          accountStatus: active ? "ACTIVE" : "INACTIVE",
          isActive: Boolean(active),
        })
      : null;
    if (erpSupabaseCustomer) {
      return res.json({ success: true, customer: erpSupabaseCustomer });
    }

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
    const localResult = await deleteLocalCustomer(id);
    if (localResult) {
      return res.json(localResult);
    }

    const erpSupabaseResult = erpSupabaseCustomerService.isConfigured()
      ? await erpSupabaseCustomerService.deleteCustomer(id)
      : null;
    if (erpSupabaseResult) {
      return res.json({ success: true });
    }

    await erpApiClient.deleteCustomer(id);
    return res.json({ success: true });
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

    if (isErpCustomerId(id)) {
      const customer = unwrapErpCustomer(await erpApiClient.getCustomer(id));
      if (!customer?.id) {
        return res.status(404).json({ success: false, message: "ERP customer not found" });
      }

      const emailStatus =
        channel === "message"
          ? { sent: false, skipped: true }
          : await sendSubscriptionReminderEmail({
              name: customer.customer_name || customer.name,
              email: customer.email,
              subject,
              message,
            });

      const messageStatus =
        channel === "email"
          ? { sent: false, skipped: true }
          : { sent: true, channel: "message", phone: customer.phone || null };

      return res.json({
        success: true,
        message: "Reminder sent successfully",
        customer: {
          ...customer,
          reminder_sent: true,
          reminder_sent_date: today,
        },
        delivery: {
          email: emailStatus,
          message: messageStatus,
        },
      });
    }

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
  getConvertedLeadCustomers,
  getCustomerById,
  updateCustomer,
  updateCustomerStatus,
  deleteCustomer,
  renewSubscription,
  sendReminder,
};
