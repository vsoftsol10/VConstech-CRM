const REMINDER_ACTIVITY_TYPE = "Reminder Updated";
const REMINDER_TITLE = "Follow-up Reminder Updated";
const REMINDER_REFERENCE_TYPE = "lead_follow_up";

const toBoolean = (value, defaultValue = true) => {
  if (value === undefined || value === null || value === "") return defaultValue;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return !["false", "0", "no", "off"].includes(value.trim().toLowerCase());
  return Boolean(value);
};

const toDateOnly = (value) => {
  if (!value) return null;
  const text = String(value).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;

  const [year, month, day] = text.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return text;
};

const normalizeTime = (value) => {
  if (!value) return null;
  const text = String(value).trim();
  const match = text.match(/^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/);
  return match ? `${match[1]}:${match[2]}` : null;
};

const formatReminderTime = (value) => {
  const time = normalizeTime(value);
  if (!time) return null;
  const [hourText, minute] = time.split(":");
  const hour = Number(hourText);
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${String(displayHour).padStart(2, "0")}:${minute} ${suffix}`;
};

const formatReminderValue = (date, time) => {
  if (!date && !time) return "No reminder";
  return `${date || "No date"}${time ? ` ${formatReminderTime(time) || time}` : ""}`;
};

const validateReminderInput = ({ followUpDate, followUpTime, reminder }, { requireWhenEnabled = true } = {}) => {
  const reminderEnabled = toBoolean(reminder, false);
  const normalizedDate = toDateOnly(followUpDate);
  const normalizedTime = normalizeTime(followUpTime);

  if (reminderEnabled && requireWhenEnabled && !normalizedDate) {
    return { error: "Follow-up date is required when reminder is enabled.", status: 400 };
  }

  if (followUpDate && !normalizedDate) {
    return { error: "Invalid follow-up date.", status: 400 };
  }

  if (reminderEnabled && requireWhenEnabled && !normalizedTime) {
    return { error: "Follow-up time is required when reminder is enabled.", status: 400 };
  }

  if (followUpTime && !normalizedTime) {
    return { error: "Invalid follow-up time.", status: 400 };
  }

  if (normalizedDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [year, month, day] = normalizedDate.split("-").map(Number);
    const selected = new Date(year, month - 1, day);
    if (selected < today) {
      return { error: "Follow-up date cannot be in the past.", status: 400 };
    }
  }

  return {
    reminderEnabled: reminderEnabled && Boolean(normalizedDate && normalizedTime),
    followUpDate: normalizedDate,
    followUpTime: normalizedTime,
  };
};

const hasReminderPayload = (body = {}) =>
  Object.prototype.hasOwnProperty.call(body, "followUpDate") ||
  Object.prototype.hasOwnProperty.call(body, "follow_up_date") ||
  Object.prototype.hasOwnProperty.call(body, "followUpTime") ||
  Object.prototype.hasOwnProperty.call(body, "follow_up_time") ||
  Object.prototype.hasOwnProperty.call(body, "reminder") ||
  Object.prototype.hasOwnProperty.call(body, "reminderEnabled") ||
  Object.prototype.hasOwnProperty.call(body, "reminder_enabled");

const getReminderFields = (body = {}) => ({
  followUpDate: body.followUpDate ?? body.follow_up_date ?? null,
  followUpTime: body.followUpTime ?? body.follow_up_time ?? null,
  reminder: body.reminderEnabled ?? body.reminder_enabled ?? body.reminder ?? false,
});

const reminderChanged = (previous, next) =>
  String(previous?.follow_up_date || "") !== String(next.followUpDate || "") ||
  String(normalizeTime(previous?.follow_up_time) || "") !== String(next.followUpTime || "") ||
  Boolean(previous?.reminder_enabled) !== Boolean(next.reminderEnabled);

const getLeadReminderState = async (db, leadId) => {
  const result = await db.query(
    `SELECT id, follow_up_date::text AS follow_up_date, follow_up_time::text AS follow_up_time, reminder_enabled
     FROM leads
     WHERE id = $1
     FOR UPDATE`,
    [leadId]
  );

  if (result.rowCount === 0) {
    const error = new Error("Lead not found while saving follow-up details.");
    error.status = 404;
    throw error;
  }

  return result.rows[0];
};

const buildReminderHistoryNote = ({ previous, next, note }) => {
  const fromValue = formatReminderValue(previous?.follow_up_date, previous?.follow_up_time);
  const toValue = formatReminderValue(next.followUpDate, next.followUpTime);
  const changeNote = `Follow-up changed from\n${fromValue}\n\nto\n\n${toValue}`;

  return note ? `${note}\n\n${changeNote}` : changeNote;
};

const cancelOldPendingReminderNotifications = async (db, leadId, previous) => {
  if (!previous?.follow_up_date) return 0;

  const prefix = `${leadId}:${previous.follow_up_date}:${previous.follow_up_time || "no-time"}:%`;
  const result = await db.query(
    `DELETE FROM notifications
     WHERE reference_type = $1
       AND reference_id LIKE $2
       AND is_read = false`,
    [REMINDER_REFERENCE_TYPE, prefix]
  );

  return result.rowCount || 0;
};

const syncLeadReminder = async (db, { leadId, stage, reminderInput, previous }) => {
  const changed = reminderChanged(previous, reminderInput);
  const result = await db.query(
    `UPDATE leads
     SET status = COALESCE($1, status),
         follow_up_date = $2::date,
         follow_up_time = $3::time,
         reminder_enabled = $4::boolean,
         follow_up_reminder_sent_at = CASE WHEN $6::boolean THEN NULL ELSE follow_up_reminder_sent_at END,
         follow_up_reminder_sent_for_date = CASE WHEN $6::boolean THEN NULL ELSE follow_up_reminder_sent_for_date END
     WHERE id = $5
     RETURNING *`,
    [
      stage || null,
      reminderInput.followUpDate,
      reminderInput.followUpTime,
      reminderInput.reminderEnabled,
      leadId,
      changed,
    ]
  );

  if (result.rowCount === 0) {
    const error = new Error("Lead not found while saving follow-up details.");
    error.status = 404;
    throw error;
  }

  return result.rows[0] || null;
};

const insertWorkHistory = async (
  db,
  { leadId, stage, note, reminderInput, createdBy, activityType = null, title = null }
) => {
  const result = await db.query(
    `INSERT INTO lead_work_history
     (lead_id, stage, note, follow_up_date, follow_up_time, reminder, created_by, activity_type, title)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING *`,
    [
      leadId,
      stage || null,
      note || null,
      reminderInput.followUpDate,
      reminderInput.followUpTime,
      reminderInput.reminderEnabled,
      createdBy || null,
      activityType,
      title,
    ]
  );

  return result.rows[0] || null;
};

const saveReminderUpdate = async (
  db,
  { leadId, stage, note, followUpDate, followUpTime, reminder, createdBy, insertGeneralHistory = true }
) => {
  const reminderInput = validateReminderInput({ followUpDate, followUpTime, reminder });
  if (reminderInput.error) {
    const error = new Error(reminderInput.error);
    error.status = reminderInput.status;
    throw error;
  }

  const previous = await getLeadReminderState(db, leadId);
  const changed = reminderChanged(previous, reminderInput);

  let history = null;
  if (changed) {
    const historyNote = buildReminderHistoryNote({ previous, next: reminderInput, note });
    await cancelOldPendingReminderNotifications(db, leadId, previous);
    history = await insertWorkHistory(db, {
      leadId,
      stage,
      note: historyNote,
      reminderInput,
      createdBy,
      activityType: REMINDER_ACTIVITY_TYPE,
      title: REMINDER_TITLE,
    });
  } else if (insertGeneralHistory && (note || stage)) {
    history = await insertWorkHistory(db, {
      leadId,
      stage,
      note,
      reminderInput,
      createdBy,
      activityType: "Work Update",
      title: "Lead Work Update",
    });
  }

  const lead = await syncLeadReminder(db, { leadId, stage, reminderInput, previous });

  return {
    changed,
    skippedReminderHistory: !changed,
    history,
    lead,
  };
};

module.exports = {
  REMINDER_REFERENCE_TYPE,
  formatReminderTime,
  getReminderFields,
  hasReminderPayload,
  saveReminderUpdate,
  validateReminderInput,
};
