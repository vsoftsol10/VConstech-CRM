// const pool = require("../config/database");

// // ── POST create lead ────────────────────────────────────────────────────────
// const createLead = async (req, res) => {
//   try {
//     const { fullName, company, channel, status, phone, email, date, plan, requirements, assignedTo } = req.body;

//     const existingLead = await pool.query(
//       `SELECT email, phone FROM leads WHERE email = $1 OR phone = $2`,
//       [email, phone]
//     );

//     if (existingLead.rows.length > 0) {
//       const lead = existingLead.rows[0];
//       return res.status(409).json({
//         emailExists: lead.email === email,
//         phoneExists: lead.phone === phone,
//       });
//     }

//     const result = await pool.query(
//       `INSERT INTO leads
//        (full_name, company, channel, status, phone, email, lead_date, plan, requirements, assigned_to)
//        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
//        RETURNING *`,
//       [
//         fullName,
//         company,
//         channel?.value || channel,
//         status?.value || status,
//         phone,
//         email,
//         date || null,
//         plan?.value || plan,
//         requirements || null,
//         assignedTo?.value || assignedTo || null,
//       ]
//     );

//     res.status(201).json({
//       success: true,
//       lead: result.rows[0],
//     });

//   } catch (err) {
//     console.log(err.message);
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// // ── GET all leads ───────────────────────────────────────────────────────────
// const getAllLeads = async (req, res) => {
//   try {
//     const { assigned_to } = req.query;
//     let query = `
//       SELECT
//         l.*,
//         EXISTS (SELECT 1 FROM customers c WHERE c.lead_id = l.id) AS is_customer
//       FROM leads l
//     `;
//     const params = [];

//     if (assigned_to) {
//       query += " WHERE l.assigned_to = $1";
//       params.push(assigned_to);
//     }
//     query += " ORDER BY l.created_at DESC";

//     const result = await pool.query(query, params);
//     res.json(result.rows);
//   } catch (err) {
//     console.log(err.message);
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// // ── GET single lead ─────────────────────────────────────────────────────────
// const getLeadById = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const result = await pool.query(
//       "SELECT * FROM leads WHERE id = $1",
//       [id]
//     );

//     if (result.rows.length === 0) {
//       return res.status(404).json({ message: "Lead not found" });
//     }

//     res.json(result.rows[0]);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// // ── PUT update lead ─────────────────────────────────────────────────────────
// const updateLead = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { fullName, company, channel, status, phone, email, date, plan, assignedTo, requirements } = req.body;

//     const result = await pool.query(
//       `UPDATE leads
//        SET full_name=$1, company=$2, channel=$3, status=$4,
//            phone=$5, email=$6, lead_date=$7, plan=$8,
//            requirements=$9, assigned_to=$10
//        WHERE id=$11
//        RETURNING *`,
//       [
//         fullName,
//         company,
//         channel?.value || channel,
//         status?.value || status,
//         phone,
//         email,
//         date || null,
//         plan?.value || plan,
//         requirements || null,
//         assignedTo || null,
//         id,
//       ]
//     );

//     if (result.rows.length === 0) {
//       return res.status(404).json({ message: "Lead not found" });
//     }

//     res.json({ success: true, lead: result.rows[0] });

//   } catch (err) {
//     console.error(err.message);
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// // ── DELETE lead ─────────────────────────────────────────────────────────────
// const deleteLead = async (req, res) => {
//   try {
//     const { id } = req.params;

//     await pool.query("DELETE FROM leads WHERE id = $1", [id]);

//     res.json({
//       success: true,
//       message: "Lead deleted",
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({
//       success: false,
//       message: "Delete failed",
//     });
//   }
// };

// module.exports = {
//   createLead,
//   getAllLeads,
//   getLeadById,
//   updateLead,
//   deleteLead,
// };


const pool = require("../config/database");
const { getReminderFields, hasReminderPayload, saveReminderUpdate } = require("../services/reminderService");

const getActor = (req) => req.user?.employee_id || req.user?.id || null;

const sendError = (res, err, fallback) => {
  const status = err.status || 500;
  res.status(status).json({ success: false, message: status >= 500 ? fallback : err.message });
};

const EMAIL_PATTERN = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const PHONE_PATTERN = /^[6-9]\d{9}$/;

const normalizeText = (value) => String(value || "").trim();
const normalizeEmail = (value) => normalizeText(value).toLowerCase();
const normalizePhone = (value) => normalizeText(value).replace(/\D/g, "");
const todayInput = () => new Date().toISOString().split("T")[0];

const validateLeadPayload = (body) => {
  const values = {
    fullName: normalizeText(body.fullName),
    company: normalizeText(body.company),
    channel: body.channel?.value || body.channel || null,
    status: body.status?.value || body.status || null,
    phone: normalizePhone(body.phone),
    email: normalizeEmail(body.email),
    date: normalizeText(body.date),
    plan: body.plan?.value || body.plan || null,
    address: normalizeText(body.address),
    location: normalizeText(body.location),
    requirements: normalizeText(body.requirements),
    assignedTo: body.assignedTo?.value || body.assignedTo || null,
  };
  const errors = {};

  if (!values.fullName) errors.fullName = "Full name is required";
  else if (values.fullName.length < 3) errors.fullName = "Name must be at least 3 characters";
  if (!values.company) errors.company = "Company is required";
  if (!values.phone) errors.phone = "Phone is required";
  else if (!PHONE_PATTERN.test(values.phone)) errors.phone = "Enter a valid 10-digit mobile number";
  if (!values.email) errors.email = "Email is required";
  else if (!EMAIL_PATTERN.test(values.email)) errors.email = "Enter a valid email address";
  if (!values.status) errors.status = "Status is required";
  if (values.status !== "new" && !values.plan) errors.plan = "Plan is required";
  if (!values.channel) errors.channel = "Channel is required";
  if (!values.date) errors.date = "Date is required";
  else if (Number.isNaN(new Date(values.date).getTime())) errors.date = "Enter a valid date";
  else if (values.date > todayInput()) errors.date = "Lead date cannot be in the future";
  if (values.requirements && values.requirements.length < 10) {
    errors.requirements = "Requirements should be at least 10 characters";
  }

  return { values, errors };
};

const sendValidationError = (res, errors) =>
  res.status(400).json({ success: false, message: "Please fix the highlighted fields.", errors });

const findLeadDuplicate = async ({ email, phone, excludeId = null }) => {
  const params = [email, phone];
  let query = "SELECT id, email, phone FROM leads WHERE (LOWER(email) = $1 OR regexp_replace(phone, '\\D', '', 'g') = $2)";
  if (excludeId) {
    params.push(excludeId);
    query += " AND id <> $3";
  }
  query += " LIMIT 1";
  const result = await pool.query(query, params);
  return result.rows[0] || null;
};

// ── POST create lead ────────────────────────────────────────────────────────
const createLead = async (req, res) => {
  try {
    const { values, errors } = validateLeadPayload(req.body);
    if (Object.keys(errors).length > 0) return sendValidationError(res, errors);
    const { followUpDate, followUpTime, reminderEnabled } = getReminderFields(req.body);

    const duplicate = await findLeadDuplicate(values);
    if (duplicate) {
      return res.status(409).json({
        emailExists: normalizeEmail(duplicate.email) === values.email,
        phoneExists: normalizePhone(duplicate.phone) === values.phone,
      });
    }

    const result = await pool.query(
      `INSERT INTO leads
       (full_name, company, channel, status, phone, email, lead_date, plan, requirements, assigned_to,
        address, location, follow_up_date, follow_up_time, reminder_enabled)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING *`,
      [
        values.fullName,
        values.company,
        values.channel,
        values.status,
        values.phone,
        values.email,
        values.date || null,
        values.plan,
        values.requirements || null,
        values.assignedTo,
        values.address || null,
        values.location || null,
        followUpDate || null,
        followUpTime || null,
        reminderEnabled,
      ]
    );

    res.status(201).json({ success: true, lead: result.rows[0] });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET all leads ───────────────────────────────────────────────────────────
const getAllLeads = async (req, res) => {
  try {
    const { assigned_to } = req.query;
    const params = [];

    let whereClause = "";

    if (assigned_to) {
      // assigned_to could be:
      //   1. a numeric team_members.id  → use directly
      //   2. an employee_id string like "EMP-001" → resolve to team_members.id first
      const isNumeric = /^\d+$/.test(String(assigned_to).trim());

      if (isNumeric) {
        params.push(Number(assigned_to));
        whereClause = "WHERE l.assigned_to = $1";
      } else {
        // Resolve employee_id → team_members.id
        const memberRes = await pool.query(
          `SELECT id FROM team_members WHERE employee_id = $1 LIMIT 1`,
          [assigned_to]
        );
        if (memberRes.rows.length === 0) {
          // No matching member → return empty list, not an error
          return res.json([]);
        }
        params.push(memberRes.rows[0].id);
        whereClause = "WHERE l.assigned_to = $1";
      }
    }

    const query = `
      SELECT
        l.*,
        EXISTS (SELECT 1 FROM customers c WHERE c.lead_id = l.id) AS is_customer
      FROM leads l
      ${whereClause}
      ORDER BY l.created_at DESC
    `;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET single lead ─────────────────────────────────────────────────────────
const getLeadById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT
        l.*,
        EXISTS (SELECT 1 FROM customers c WHERE c.lead_id = l.id) AS is_customer
       FROM leads l
       WHERE l.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Lead not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── PUT update lead ─────────────────────────────────────────────────────────
const updateLead = async (req, res) => {
  try {
    const { id } = req.params;
    const { values, errors } = validateLeadPayload(req.body);
    if (Object.keys(errors).length > 0) return sendValidationError(res, errors);
    const { followUpDate, followUpTime, reminderEnabled } = getReminderFields(req.body);

    const converted = await pool.query(
      "SELECT 1 FROM customers WHERE lead_id = $1 LIMIT 1",
      [id]
    );

    if (converted.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "This lead has already been converted to a customer and cannot be edited.",
      });
    }

    const duplicate = await findLeadDuplicate({ ...values, excludeId: id });
    if (duplicate) {
      return res.status(409).json({
        emailExists: normalizeEmail(duplicate.email) === values.email,
        phoneExists: normalizePhone(duplicate.phone) === values.phone,
      });
    }

    const result = await pool.query(
      `UPDATE leads
       SET full_name=$1, company=$2, channel=$3, status=$4,
           phone=$5, email=$6, lead_date=$7, plan=$8,
           requirements=$9, assigned_to=$10,
           address=$11,
           location=$12,
           follow_up_date=$13,
           follow_up_time=$14,
           reminder_enabled=$15,
           follow_up_reminder_sent_at = CASE
             WHEN follow_up_date IS DISTINCT FROM $13::date
               OR follow_up_time IS DISTINCT FROM $14::time
               OR reminder_enabled IS DISTINCT FROM $15::boolean
             THEN NULL
             ELSE follow_up_reminder_sent_at
           END,
           follow_up_reminder_sent_for_date = CASE
             WHEN follow_up_date IS DISTINCT FROM $13::date
               OR follow_up_time IS DISTINCT FROM $14::time
               OR reminder_enabled IS DISTINCT FROM $15::boolean
             THEN NULL
             ELSE follow_up_reminder_sent_for_date
           END
       WHERE id=$16
       RETURNING *`,
      [
        values.fullName,
        values.company,
        values.channel,
        values.status,
        values.phone,
        values.email,
        values.date || null,
        values.plan,
        values.requirements || null,
        values.assignedTo,
        values.address || null,
        values.location || null,
        followUpDate || null,
        followUpTime || null,
        reminderEnabled,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Lead not found" });
    }

    res.json({ success: true, lead: result.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── DELETE lead ─────────────────────────────────────────────────────────────
const deleteLead = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM leads WHERE id = $1", [id]);
    res.json({ success: true, message: "Lead deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Delete failed" });
  }
};

module.exports = {
  createLead,
  getAllLeads,
  getLeadById,
  updateLead,
  deleteLead,
};
