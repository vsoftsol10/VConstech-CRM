const { formatDate } = require("../utils/validators");
const {
  calculateSubscriptionDates,
  getPlanForSubscription,
  normalizePlanKey,
} = require("./subscriptionDateService");

const EMAIL_PATTERN = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const PHONE_PATTERN = /^[6-9]\d{9}$/;

const normalizeText = (value) => String(value || "").trim();
const normalizeEmail = (value) => normalizeText(value).toLowerCase();
const normalizePhone = (value) => normalizeText(value).replace(/\D/g, "");
const normalizePlan = (value) => {
  const plan = normalizeText(value);
  return plan.toLowerCase() === "trail" ? "Trial" : plan;
};

const validateCustomerPayload = (body) => {
  const values = {
    customer_name: normalizeText(body.customer_name),
    company_name: normalizeText(body.company_name),
    phone: normalizePhone(body.phone),
    email: normalizeEmail(body.email),
    subscription_plan: normalizePlan(body.subscription_plan),
    notes: normalizeText(body.notes),
  };
  const errors = {};

  if (!values.customer_name) errors.customer_name = "Customer name is required";
  else if (values.customer_name.length < 3) errors.customer_name = "Name must be at least 3 characters";
  if (!values.phone) errors.phone = "Phone is required";
  else if (!PHONE_PATTERN.test(values.phone)) errors.phone = "Enter a valid 10-digit mobile number";
  if (!values.email) errors.email = "Email is required";
  else if (!EMAIL_PATTERN.test(values.email)) errors.email = "Enter a valid email address";
  if (!values.subscription_plan) errors.subscription_plan = "Plan is required";

  return { values, errors };
};

const findCustomerDuplicate = async (db, { email, phone, excludeId = null }) => {
  const params = [email, phone];
  let query = "SELECT id, email, phone FROM customers WHERE (LOWER(email) = $1 OR regexp_replace(phone, '\\D', '', 'g') = $2)";
  if (excludeId) {
    params.push(excludeId);
    query += " AND id <> $3";
  }
  query += " LIMIT 1";
  const result = await db.query(query, params);
  return result.rows[0] || null;
};

const findExistingCustomer = async (db, { email, phone }) => {
  const result = await db.query(
    `SELECT * FROM customers
     WHERE LOWER(email) = $1
        OR regexp_replace(phone, '\\D', '', 'g') = $2
     ORDER BY created_at ASC
     LIMIT 1`,
    [email, phone]
  );
  return result.rows[0] || null;
};

const createCustomerRecord = async (db, values, { paymentStatus = "pending" } = {}) => {
  const plan = await getPlanForSubscription(db, values.subscription_plan);
  const { subscription_start_date, subscription_end_date } =
    calculateSubscriptionDates(plan.durationInDays);

  const result = await db.query(
    `INSERT INTO customers
     (customer_name, company_name, phone, email,
      subscription_plan, subscription_amount,
      start_date, renewal_date, subscription_start_date, subscription_end_date,
      payment_status, subscription_status, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
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
      formatDate(subscription_start_date),
      formatDate(subscription_end_date),
      subscription_start_date,
      subscription_end_date,
      paymentStatus,
      paymentStatus === "Subscription Active" ? "Subscription Active" : null,
      values.notes || null,
    ]
  );

  await db.query(
    `INSERT INTO subscription_history
     (customer_id, customer_name, plan_name, amount, action_type, start_date, end_date)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [
      result.rows[0].id,
      values.customer_name,
      plan.name,
      plan.price,
      "NEW",
      formatDate(subscription_start_date),
      formatDate(subscription_end_date),
    ]
  );

  return result.rows[0];
};

const updateCustomerSubscription = async (db, customer, planName) => {
  const plan = await getPlanForSubscription(db, planName);
  const subscriptionDates = calculateSubscriptionDates(plan.durationInDays);
  const planChanged = normalizePlanKey(customer.subscription_plan) !== normalizePlanKey(plan.name);
  const actionType = planChanged ? "PLAN_CHANGED" : "RENEWED";

  const result = await db.query(
    `UPDATE customers
     SET subscription_plan = $1,
         subscription_amount = $2,
         start_date = $3,
         renewal_date = $4,
         subscription_start_date = $5,
         subscription_end_date = $6,
         subscription_started_at = NOW(),
         payment_status = 'Subscription Active',
         subscription_status = 'Subscription Active'
     WHERE id = $7
     RETURNING *`,
    [
      plan.name,
      plan.price,
      formatDate(subscriptionDates.subscription_start_date),
      formatDate(subscriptionDates.subscription_end_date),
      subscriptionDates.subscription_start_date,
      subscriptionDates.subscription_end_date,
      customer.id,
    ]
  );

  await db.query(
    `INSERT INTO subscription_history
     (customer_id, customer_name, plan_name, amount, action_type, start_date, end_date)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [
      customer.id,
      customer.customer_name,
      plan.name,
      plan.price,
      actionType,
      formatDate(subscriptionDates.subscription_start_date),
      formatDate(subscriptionDates.subscription_end_date),
    ]
  );

  return result.rows[0];
};

const ensurePaidPricingCustomer = async (db, payload) => {
  const { values, errors } = validateCustomerPayload({
    customer_name: payload.customer_name || payload.name,
    company_name: payload.company_name || payload.companyName || payload.company,
    phone: payload.phone,
    email: payload.email,
    subscription_plan: payload.subscription_plan || payload.plan,
    notes: payload.notes,
  });

  if (Object.keys(errors).length > 0) {
    const error = new Error("Invalid customer payload");
    error.statusCode = 400;
    error.details = errors;
    throw error;
  }

  const existing = await findExistingCustomer(db, values);
  if (existing) {
    const customer = await updateCustomerSubscription(db, existing, values.subscription_plan);
    return { customer, created: false };
  }

  const customer = await createCustomerRecord(db, values, {
    paymentStatus: "Subscription Active",
  });
  return { customer, created: true };
};

module.exports = {
  createCustomerRecord,
  ensurePaidPricingCustomer,
  findCustomerDuplicate,
  normalizeEmail,
  normalizePhone,
  normalizePlan,
  validateCustomerPayload,
};
