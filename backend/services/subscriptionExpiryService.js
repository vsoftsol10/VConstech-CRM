const pool = require("../config/database");
const {
  sendSubscriptionExpiredEmail,
  sendSubscriptionReminderEmail,
} = require("../utils/emailUtil");
const erpApiClient = require("../integration/services/erpApiClient");
const {
  createFollowUpTask,
} = require("../integration/services/customerStatusSyncService");

const PRICING_URL = "https://vconstech.in/pricing";
const DAY_IN_MS = 24 * 60 * 60 * 1000;

const parseReminderDays = () =>
  String(process.env.SUBSCRIPTION_REMINDER_DAYS || "30,7,1")
    .split(",")
    .map((value) => Number.parseInt(value.trim(), 10))
    .filter((value) => Number.isInteger(value) && value > 0)
    .sort((a, b) => b - a);

const dateOnly = (date = new Date()) => date.toISOString().slice(0, 10);

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const toDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const buildEventId = ({ customerId, type, referenceDate, daysBefore }) =>
  [
    "subscription",
    type,
    customerId,
    daysBefore ? `${daysBefore}d` : null,
    referenceDate,
  ]
    .filter(Boolean)
    .join("-");

const paidSubscriptionWhere = `
  LOWER(COALESCE(subscription_plan, '')) NOT IN ('trial', 'free trial', 'trail')
  AND LOWER(COALESCE(subscription_status, payment_status, '')) IN (
    'subscription active',
    'active',
    'paid'
  )
  AND LOWER(COALESCE(subscription_status, payment_status, '')) NOT IN (
    'trial active',
    'trial expired',
    'follow-up required',
    'subscription expired'
  )
`;

const tryReserveEvent = async ({ eventId, customer, status, payload }) => {
  const result = await pool.query(
    `INSERT INTO crm_erp_status_events
     (event_id, crm_customer_id, erp_customer_id, status, payload)
     VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (event_id) DO NOTHING
     RETURNING *`,
    [
      eventId,
      customer.id,
      customer.erp_customer_id || null,
      status,
      { ...payload, processing: true },
    ]
  );

  if (result.rows[0]) return { event: result.rows[0], reserved: true };

  const existing = await pool.query(
    "SELECT * FROM crm_erp_status_events WHERE event_id = $1 LIMIT 1",
    [eventId]
  );
  return { event: existing.rows[0] || null, reserved: false };
};

const updateEventPayload = (eventId, payload) =>
  pool.query(
    `UPDATE crm_erp_status_events
     SET payload = payload || $2::jsonb
     WHERE event_id = $1`,
    [eventId, payload]
  );

const completeEvent = (eventId, payload) =>
  updateEventPayload(eventId, {
    ...payload,
    processing: false,
    completedAt: new Date().toISOString(),
  });

const releaseEvent = (eventId) =>
  pool.query("DELETE FROM crm_erp_status_events WHERE event_id = $1", [eventId]);

const fetchReminderCustomers = async (targetDate) => {
  const result = await pool.query(
    `SELECT *
     FROM customers
     WHERE renewal_date = $1::date
       AND email IS NOT NULL
       AND renewal_date >= CURRENT_DATE
       AND ${paidSubscriptionWhere}`,
    [targetDate]
  );

  return result.rows;
};

const fetchExpiryCustomers = async () => {
  const result = await pool.query(
    `SELECT *
     FROM customers
     WHERE (
       (
         renewal_date <= CURRENT_DATE
         AND email IS NOT NULL
         AND ${paidSubscriptionWhere}
       )
       OR EXISTS (
         SELECT 1
         FROM crm_erp_status_events e
         WHERE e.crm_customer_id = customers.id
           AND e.status = 'SUBSCRIPTION_EXPIRED'
           AND e.payload->>'completedAt' IS NULL
       )
     )`
  );

  return result.rows;
};

const markCrmInactive = async (customer) => {
  if (
    String(customer.subscription_status || customer.payment_status || "").toLowerCase() ===
    "subscription expired"
  ) {
    return customer;
  }

  const expiryDate = toDate(customer.renewal_date) || new Date();
  const inactiveDate = addDays(new Date(), -1);

  const result = await pool.query(
    `UPDATE customers
     SET renewal_date = $1::date,
         subscription_end_date = $2::timestamptz,
         payment_status = 'Subscription Expired',
         subscription_status = 'Subscription Expired'
     WHERE id = $3
     RETURNING *`,
    [dateOnly(inactiveDate), inactiveDate, customer.id]
  );

  await pool.query(
    `INSERT INTO subscription_history
     (customer_id, customer_name, plan_name, amount, action_type, start_date, end_date)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [
      customer.id,
      customer.customer_name,
      customer.subscription_plan,
      customer.subscription_amount || 0,
      "EXPIRED",
      customer.subscription_start_date ? dateOnly(toDate(customer.subscription_start_date)) : null,
      dateOnly(expiryDate),
    ]
  );

  return result.rows[0];
};

const deactivateErpAccount = async (customer, eventId) => {
  if (!customer.erp_customer_id) {
    return { skipped: true, reason: "missing_erp_customer_identifier" };
  }

  return erpApiClient.updateCustomerStatus(customer.erp_customer_id, {
    status: "SUBSCRIPTION_EXPIRED",
    accountStatus: "SUBSCRIPTION_EXPIRED",
    isActive: false,
    plan: customer.subscription_plan,
    eventId,
  });
};

const createSalesFollowUp = async (customer, eventId) =>
  createFollowUpTask(pool, {
    customer: {
      ...customer,
      followUpTitle: `Renewal follow up: ${customer.customer_name || customer.company_name || "ERP customer"}`,
      followUpDescription: `Paid subscription expired for customer ${customer.customer_name || customer.id}. ERP event ${eventId}.`,
    },
    eventId,
  });

const processReminderCustomer = async ({ customer, daysBefore, targetDate }) => {
  const eventId = buildEventId({
    customerId: customer.id,
    type: "renewal-reminder",
    daysBefore,
    referenceDate: targetDate,
  });

  const reservation = await tryReserveEvent({
    eventId,
    customer,
    status: `SUBSCRIPTION_REMINDER_${daysBefore}D`,
    payload: { daysBefore, targetDate, renewalLink: PRICING_URL },
  });

  if (!reservation.reserved) return { customerId: customer.id, skipped: true, eventId };

  try {
    const email = await sendSubscriptionReminderEmail({
      name: customer.customer_name,
      email: customer.email,
      companyName: customer.company_name,
      plan: customer.subscription_plan,
      expiryDate: customer.renewal_date,
    });

    await pool.query(
      `UPDATE customers
       SET reminder_sent = true,
           reminder_sent_date = CURRENT_DATE
       WHERE id = $1`,
      [customer.id]
    );

    await completeEvent(eventId, { email });
    return { customerId: customer.id, sent: true, eventId, email };
  } catch (error) {
    await releaseEvent(eventId);
    console.error("[SubscriptionExpiry] Reminder failed", {
      customerId: customer.id,
      eventId,
      message: error.message,
    });
    return { customerId: customer.id, failed: true, eventId, error: error.message };
  }
};

const processExpiredCustomer = async (customer) => {
  const expiryDate = dateOnly(toDate(customer.renewal_date) || new Date());
  const eventId = buildEventId({
    customerId: customer.id,
    type: "expired",
    referenceDate: expiryDate,
  });

  const reservation = await tryReserveEvent({
    eventId,
    customer,
    status: "SUBSCRIPTION_EXPIRED",
    payload: { expiryDate, renewalLink: PRICING_URL },
  });

  if (!reservation.event) return { customerId: customer.id, skipped: true, eventId };

  const eventPayload = reservation.event.payload || {};
  let emailRecorded = Boolean(eventPayload.email);
  if (!reservation.reserved && eventPayload.completedAt) {
    return { customerId: customer.id, skipped: true, eventId };
  }

  try {
    const email =
      eventPayload.email ||
      (await sendSubscriptionExpiredEmail({
        name: customer.customer_name,
        email: customer.email,
        companyName: customer.company_name,
      }));

    if (!eventPayload.email) {
      await updateEventPayload(eventId, { email });
      emailRecorded = true;
    }

    const crmCustomer = await markCrmInactive(customer);
    const erp = await deactivateErpAccount(customer, eventId);
    const followUpTask = await createSalesFollowUp(crmCustomer, eventId);

    await completeEvent(eventId, { email, erp, followUpTask });
    return { customerId: customer.id, expired: true, eventId, email, erp, crmCustomer, followUpTask };
  } catch (error) {
    if (!emailRecorded) {
      await releaseEvent(eventId);
    } else {
      await updateEventPayload(eventId, {
        processing: true,
        lastError: error.message,
        lastFailedAt: new Date().toISOString(),
      });
    }
    console.error("[SubscriptionExpiry] Expiry processing failed", {
      customerId: customer.id,
      eventId,
      message: error.message,
    });
    return { customerId: customer.id, failed: true, eventId, error: error.message };
  }
};

const processReminderPhase = async ({ daysBefore, today }) => {
  const targetDate = dateOnly(addDays(today, daysBefore));
  const customers = await fetchReminderCustomers(targetDate);
  const results = [];

  for (const customer of customers) {
    results.push(await processReminderCustomer({ customer, daysBefore, targetDate }));
  }

  return {
    daysBefore,
    targetDate,
    checked: customers.length,
    sent: results.filter((result) => result.sent).length,
    skipped: results.filter((result) => result.skipped).length,
    failed: results.filter((result) => result.failed).length,
    results,
  };
};

const processExpiryPhase = async () => {
  const customers = await fetchExpiryCustomers();
  const results = [];

  for (const customer of customers) {
    results.push(await processExpiredCustomer(customer));
  }

  return {
    checked: customers.length,
    expired: results.filter((result) => result.expired).length,
    skipped: results.filter((result) => result.skipped).length,
    failed: results.filter((result) => result.failed).length,
    results,
  };
};

const runSubscriptionExpiryJob = async () => {
  const today = new Date();
  const reminderDays = parseReminderDays();

  console.log("[SubscriptionExpiry] Checking subscription reminders and expiries.");

  const reminders = [];
  for (const daysBefore of reminderDays) {
    reminders.push(await processReminderPhase({ daysBefore, today }));
  }

  const expiry = await processExpiryPhase();

  return {
    reminderDays,
    reminders,
    expiry,
  };
};

module.exports = {
  runSubscriptionExpiryJob,
};
