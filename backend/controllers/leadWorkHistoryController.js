const pool = require("../config/database");
const { saveReminderUpdate } = require("../services/reminderService");

const getActor = (req) => req.user?.employee_id || req.user?.id || null;

const sendError = (res, err, fallback) => {
  const status = err.status || 500;
  const message = status >= 500 ? fallback : err.message;
  res.status(status).json({ success: false, error: message });
};

const withTransaction = async (handler) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const result = await handler(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackErr) {
      console.error("Reminder transaction rollback failed:", rollbackErr.message);
    }
    throw err;
  } finally {
    client.release();
  }
};

const createLeadWorkHistory = async (req, res) => {
  try {
    const { leadId, stage, note, followUpDate, followUpTime, reminder } = req.body;

    const result = await withTransaction((client) =>
      saveReminderUpdate(client, {
        leadId,
        stage,
        note,
        followUpDate,
        followUpTime,
        reminder,
        createdBy: getActor(req),
        insertGeneralHistory: true,
      })
    );

    res.json({
      success: true,
      skipped: result.skippedReminderHistory && !result.history,
      message:
        result.skippedReminderHistory && !result.history
          ? "Reminder unchanged. No duplicate reminder history entry created."
          : "Work update saved.",
      ...result.history,
      lead: result.lead,
    });
  } catch (err) {
    console.error("Create lead work history failed:", err.message);
    sendError(res, err, "Failed to save lead work history.");
  }
};

const getLeadWorkHistory = async (req, res) => {
  try {
    const { leadId } = req.params;

    const result = await pool.query(
      `SELECT *
       FROM lead_work_history
       WHERE lead_id = $1
       ORDER BY created_at DESC`,
      [leadId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Get lead work history failed:", err.message);
    res.status(500).json({ success: false, error: "Failed to load lead work history." });
  }
};

const createLeadUpdate = async (req, res) => {
  try {
    const { lead_id, stage, note, follow_up_date, follow_up_time, reminder } = req.body;

    const result = await withTransaction(async (client) => {
      const reminderResult = await saveReminderUpdate(client, {
        leadId: lead_id,
        stage,
        note,
        followUpDate: follow_up_date,
        followUpTime: follow_up_time,
        reminder,
        createdBy: getActor(req),
        insertGeneralHistory: true,
      });

      const update = await client.query(
        `INSERT INTO lead_updates
         (lead_id, stage, note, follow_up_date, follow_up_time, reminder)
         VALUES ($1,$2,$3,$4,$5,$6)
         RETURNING *`,
        [
          lead_id,
          stage || null,
          note || null,
          reminderResult.lead.follow_up_date || null,
          reminderResult.lead.follow_up_time || null,
          reminderResult.lead.reminder_enabled,
        ]
      );

      return { ...reminderResult, update: update.rows[0] };
    });

    res.json({ success: true, ...result.update, lead: result.lead });
  } catch (err) {
    console.error("Create lead update failed:", err.message);
    sendError(res, err, "Failed to save lead update.");
  }
};

const getLeadUpdates = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT *
       FROM lead_updates
       WHERE lead_id = $1
       ORDER BY created_at DESC`,
      [req.params.leadId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Get lead updates failed:", err.message);
    res.status(500).json({ success: false, error: "Failed to load lead updates." });
  }
};

module.exports = {
  createLeadWorkHistory,
  getLeadWorkHistory,
  createLeadUpdate,
  getLeadUpdates,
};
