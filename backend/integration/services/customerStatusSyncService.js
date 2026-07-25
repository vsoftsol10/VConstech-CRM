const pool = require("../../config/database");

const STATUS_MAP = {
  TRIAL_ACTIVE: {
    paymentStatus: "Trial Active",
    customerStatus: "Trial Active",
    createFollowUp: false,
  },
  SUBSCRIPTION_ACTIVE: {
    paymentStatus: "Subscription Active",
    customerStatus: "Subscription Active",
    createFollowUp: false,
  },
  TRIAL_EXPIRED: {
    paymentStatus: "Follow-up Required",
    customerStatus: "Follow-up Required",
    createFollowUp: true,
  },
  SUBSCRIPTION_EXPIRED: {
    paymentStatus: "Subscription Expired",
    customerStatus: "Subscription Expired",
    createFollowUp: false,
  },
};

const normalizeStatus = (status) => String(status || "").trim().toUpperCase();

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const dateOnly = (date) => new Date(date).toISOString().slice(0, 10);

const getAssignedMember = async (client, customer) => {
  if (customer.assigned_employee) {
    const byId = await client.query(
      "SELECT * FROM team_members WHERE id::text = $1 OR employee_id = $1 LIMIT 1",
      [String(customer.assigned_employee)]
    );
    if (byId.rows[0]) return byId.rows[0];
  }

  const leadMember = await client.query(
    `SELECT tm.*
     FROM leads l
     JOIN team_members tm ON tm.id::text = l.assigned_to::text OR tm.employee_id = l.assigned_to::text
     WHERE l.id = $1
     LIMIT 1`,
    [customer.lead_id]
  );
  if (leadMember.rows[0]) return leadMember.rows[0];

  const salesMember = await client.query(
    `SELECT *
     FROM team_members
     WHERE LOWER(department) = 'sales'
     ORDER BY created_at ASC
     LIMIT 1`
  );

  return salesMember.rows[0] || null;
};

const createFollowUpTask = async (client, { customer, eventId }) => {
  const existing = await client.query(
    `SELECT id FROM tasks
     WHERE description ILIKE $1
     LIMIT 1`,
    [`%ERP event ${eventId}%`]
  );

  if (existing.rows.length > 0) return existing.rows[0];

  const assignee = await getAssignedMember(client, customer);
  if (!assignee) return null;

  const result = await client.query(
    `INSERT INTO tasks
     (title, description, assigned_to, employee_name, department, priority, due_date, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING *`,
    [
      customer.followUpTitle ||
        `Follow up: ${customer.customer_name || customer.company_name || "ERP customer"}`,
      customer.followUpDescription ||
        `ERP trial expired for customer ${customer.customer_name || customer.id}. ERP event ${eventId}.`,
      assignee.employee_id,
      assignee.name,
      assignee.department || "Sales",
      "High",
      dateOnly(addDays(new Date(), 1)),
      "Open",
    ]
  );

  return result.rows[0];
};

const validateStatusPayload = (payload = {}) => {
  const status = normalizeStatus(payload.status);
  const errors = {};

  if (!payload.eventId) errors.eventId = "eventId is required";
  if (!payload.crmCustomerId) errors.crmCustomerId = "crmCustomerId is required";
  if (!status || !STATUS_MAP[status]) {
    errors.status =
      "status must be TRIAL_ACTIVE, SUBSCRIPTION_ACTIVE, TRIAL_EXPIRED, or SUBSCRIPTION_EXPIRED";
  }

  return { status, errors };
};

const syncCustomerStatus = async (payload) => {
  const { status, errors } = validateStatusPayload(payload);
  if (Object.keys(errors).length > 0) {
    const error = new Error("Invalid customer status payload");
    error.statusCode = 400;
    error.details = errors;
    throw error;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const existingEvent = await client.query(
      "SELECT * FROM crm_erp_status_events WHERE event_id = $1 LIMIT 1",
      [payload.eventId]
    );

    if (existingEvent.rows.length > 0) {
      await client.query("COMMIT");
      return {
        idempotent: true,
        status: existingEvent.rows[0].status,
      };
    }

    const customerResult = await client.query(
      "SELECT * FROM customers WHERE id = $1 FOR UPDATE",
      [payload.crmCustomerId]
    );

    const customer = customerResult.rows[0];
    if (!customer) {
      const error = new Error("CRM customer not found");
      error.statusCode = 404;
      throw error;
    }

    const statusConfig = STATUS_MAP[status];

    const inactiveDate = dateOnly(addDays(new Date(), -1));
    const updatedCustomerResult = await client.query(
      `UPDATE customers
       SET erp_status = $1,
           erp_customer_id = COALESCE($2, erp_customer_id),
           erp_synced_at = NOW(),
           erp_last_sync_at = NOW(),
           trial_start_date = COALESCE($3::date, trial_start_date),
           trial_end_date = COALESCE($4::date, trial_end_date),
           subscription_started_at = COALESCE($5::timestamp, subscription_started_at),
           subscription_status = $6,
           payment_status = $7,
           renewal_date = CASE WHEN $9::boolean THEN $10::date ELSE renewal_date END,
           subscription_end_date = CASE WHEN $9::boolean THEN $10::timestamp ELSE subscription_end_date END
       WHERE id = $8
       RETURNING *`,
      [
        status,
        payload.erpCustomerId || null,
        payload.trialStartDate || null,
        payload.trialEndDate || null,
        payload.purchaseDate || payload.subscriptionStartedAt || null,
        statusConfig.customerStatus,
        statusConfig.paymentStatus,
        payload.crmCustomerId,
        status === "SUBSCRIPTION_EXPIRED",
        inactiveDate,
      ]
    );

    let followUpTask = null;
    if (statusConfig.createFollowUp) {
      followUpTask = await createFollowUpTask(client, {
        customer: updatedCustomerResult.rows[0],
        eventId: payload.eventId,
      });
    }

    const eventResult = await client.query(
      `INSERT INTO crm_erp_status_events
       (event_id, crm_customer_id, erp_customer_id, status, payload, follow_up_task_id)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING *`,
      [
        payload.eventId,
        payload.crmCustomerId,
        payload.erpCustomerId || null,
        status,
        payload,
        followUpTask?.id || null,
      ]
    );

    await client.query("COMMIT");

    return {
      idempotent: false,
      status,
      customer: updatedCustomerResult.rows[0],
      event: eventResult.rows[0],
      followUpTask,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  createFollowUpTask,
  syncCustomerStatus,
};
