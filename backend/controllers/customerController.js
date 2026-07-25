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

const createCustomer = async (req, res) => {
  try {
    const { values, errors } = validateCustomerPayload(req.body);
    if (Object.keys(errors).length > 0) return sendValidationError(res, errors);

    const duplicate = await findCustomerDuplicate(pool, values);
    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: "Customer already exists.",
        errors: {
          ...(normalizeEmail(duplicate.email) === values.email ? { email: "This email address already exists." } : {}),
          ...(normalizePhone(duplicate.phone) === values.phone ? { phone: "This phone number already exists." } : {}),
        },
      });
    }

    const customer = await createCustomerRecord(pool, values);

    res.status(201).json({ success: true, customer });
  } catch (err) {
    console.error(err.message);
    res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

const getAllCustomers = async (req, res) => {
  try {
    const { search, status, plans, sortBy = "id", sortDir = "desc", page, limit } = req.query;
    const params = [];
    const where = [];

    if (search) {
      params.push(`%${search}%`);
      where.push(`(
        customer_name ILIKE $${params.length}
        OR email ILIKE $${params.length}
        OR phone ILIKE $${params.length}
        OR company_name ILIKE $${params.length}
      )`);
    }

    if (status === "active") where.push("renewal_date >= CURRENT_DATE");
    if (status === "inactive") where.push("(renewal_date IS NULL OR renewal_date < CURRENT_DATE)");

    const planList = String(plans || "")
      .split(",")
      .map((plan) => normalizePlan(plan).toLowerCase())
      .filter(Boolean);
    if (planList.length > 0) {
      params.push(planList);
      where.push(`LOWER(subscription_plan) = ANY($${params.length})`);
    }

    const sortColumns = {
      id: "id",
      name: "customer_name",
      email: "email",
      phone: "phone",
      company: "company_name",
      plan: "subscription_plan",
      start_date: "start_date",
      renewal_date: "renewal_date",
    };
    const orderColumn = sortColumns[sortBy] || "id";
    const orderDir = String(sortDir).toLowerCase() === "asc" ? "ASC" : "DESC";
    let paging = "";

    const parsedLimit = Number(limit);
    const parsedPage = Number(page);
    if (Number.isInteger(parsedLimit) && parsedLimit > 0) {
      params.push(parsedLimit);
      paging += ` LIMIT $${params.length}`;
      if (Number.isInteger(parsedPage) && parsedPage > 0) {
        params.push((parsedPage - 1) * parsedLimit);
        paging += ` OFFSET $${params.length}`;
      }
    }

    const result = await pool.query(
      `SELECT ${formattedCustomerSelect}
       FROM customers
       ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
       ORDER BY ${orderColumn} ${orderDir}
       ${paging}`,
      params
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT ${formattedCustomerSelect}
       FROM customers
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { values, errors } = validateCustomerPayload(req.body);
    if (Object.keys(errors).length > 0) return sendValidationError(res, errors);

    const duplicate = await findCustomerDuplicate(pool, { ...values, excludeId: id });
    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: "Customer already exists.",
        errors: {
          ...(normalizeEmail(duplicate.email) === values.email ? { email: "This email address already exists." } : {}),
          ...(normalizePhone(duplicate.phone) === values.phone ? { phone: "This phone number already exists." } : {}),
        },
      });
    }

    const existing = await pool.query(
      "SELECT subscription_plan, subscription_start_date, subscription_end_date FROM customers WHERE id = $1",
      [id]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    const currentPlan = normalizePlanKey(existing.rows[0].subscription_plan);
    const nextPlan = normalizePlanKey(values.subscription_plan);
    const plan = await getPlanForSubscription(pool, values.subscription_plan);
    const planChanged = currentPlan !== nextPlan;
    const subscriptionDates = planChanged ? calculateSubscriptionDates(plan.durationInDays) : null;

    const result = await pool.query(
      `UPDATE customers
       SET customer_name = $1,
           company_name = $2,
           phone = $3,
           email = $4,
           subscription_plan = $5,
           subscription_amount = $6,
           notes = $7,
           start_date = CASE WHEN $9::boolean THEN $10::date ELSE start_date END,
           renewal_date = CASE WHEN $9::boolean THEN $11::date ELSE renewal_date END,
           subscription_start_date = CASE WHEN $9::boolean THEN $12::timestamptz ELSE subscription_start_date END,
           subscription_end_date = CASE WHEN $9::boolean THEN $13::timestamptz ELSE subscription_end_date END
       WHERE id = $8
       RETURNING *,
         renewal_date >= CURRENT_DATE AS active,
         TO_CHAR(start_date, 'DD Mon YYYY') AS start_date,
         TO_CHAR(renewal_date, 'DD Mon YYYY') AS renewal_date,
         TO_CHAR(reminder_sent_date, 'DD Mon YYYY') AS reminder_sent_date`,
      [
        values.customer_name,
        values.company_name,
        values.phone,
        values.email,
        plan.name,
        plan.price,
        values.notes || null,
        id,
        planChanged,
        subscriptionDates ? formatDate(subscriptionDates.subscription_start_date) : null,
        subscriptionDates ? formatDate(subscriptionDates.subscription_end_date) : null,
        subscriptionDates?.subscription_start_date || null,
        subscriptionDates?.subscription_end_date || null,
      ]
    );

    if (planChanged) {
      await pool.query(
        `INSERT INTO subscription_history
         (customer_id, customer_name, plan_name, amount, action_type, start_date, end_date)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [
          id,
          values.customer_name,
          plan.name,
          plan.price,
          "PLAN_CHANGED",
          formatDate(subscriptionDates.subscription_start_date),
          formatDate(subscriptionDates.subscription_end_date),
        ]
      );
    }

    res.json({ success: true, customer: result.rows[0] });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

const updateCustomerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { active } = req.body;

    const existing = await pool.query("SELECT * FROM customers WHERE id = $1", [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    const customer = existing.rows[0];
    const today = new Date();
    const plan = await getPlanForSubscription(pool, customer.subscription_plan);
    const activeDates = calculateSubscriptionDates(plan.durationInDays, today);
    const inactiveDate = new Date(today);
    inactiveDate.setDate(inactiveDate.getDate() - 1);

    const newRenewalDate = active ? activeDates.subscription_end_date : inactiveDate;
    const actionType = active ? "ACTIVATED" : "DEACTIVATED";

    const updated = await pool.query(
      `UPDATE customers
       SET renewal_date = $1,
           subscription_start_date = CASE WHEN $3::boolean THEN $4::timestamptz ELSE subscription_start_date END,
           subscription_end_date = CASE WHEN $3::boolean THEN $5::timestamptz ELSE $6::timestamptz END
       WHERE id = $2
       RETURNING *,
         renewal_date >= CURRENT_DATE AS active,
         TO_CHAR(start_date, 'DD Mon YYYY') AS start_date,
         TO_CHAR(renewal_date, 'DD Mon YYYY') AS renewal_date,
         TO_CHAR(reminder_sent_date, 'DD Mon YYYY') AS reminder_sent_date`,
      [
        formatDate(newRenewalDate),
        id,
        Boolean(active),
        activeDates.subscription_start_date,
        activeDates.subscription_end_date,
        inactiveDate,
      ]
    );

    await pool.query(
      `INSERT INTO subscription_history
       (customer_id, customer_name, plan_name, amount, action_type, start_date, end_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [
        id,
        customer.customer_name,
        plan.name,
        plan.price,
        actionType,
        formatDate(today),
        formatDate(newRenewalDate),
      ]
    );

    res.json({ success: true, customer: updated.rows[0] });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query("DELETE FROM subscription_history WHERE customer_id = $1", [id]);
    const result = await pool.query("DELETE FROM customers WHERE id = $1 RETURNING id", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
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
