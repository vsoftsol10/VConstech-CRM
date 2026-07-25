const pool = require("../config/database");

const REMINDER_REFERENCE_TYPE = "lead_follow_up";

const toDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getTomorrowDateString = (baseDate = new Date()) => {
  const tomorrow = new Date(baseDate);
  tomorrow.setDate(baseDate.getDate() + 1);
  return toDateString(tomorrow);
};

const buildReminderReferenceId = (lead, phase) =>
  `${lead.id}:${lead.follow_up_date}:${lead.follow_up_time || "no-time"}:${phase}`;

const buildReminderContent = (lead, phase) => {
  const time = lead.follow_up_time || "Not set";
  const company = lead.company || "Not set";

  if (phase === "today") {
    return {
      title: "Today's Follow-up",
      message: `Lead: ${lead.full_name}\nCompany: ${company}\nYour scheduled follow-up is today.\nTime: ${time}`,
    };
  }

  return {
    title: "Reminder Tomorrow",
    message: `Lead: ${lead.full_name}\nCompany: ${company}\nTomorrow is your scheduled follow-up.\nDate: ${lead.follow_up_date}\nTime: ${time}`,
  };
};

const fetchReminderLeads = async (reminderDate, phase) => {
  const sentFilter =
    phase === "today"
      ? `AND (
           l.follow_up_reminder_sent_for_date IS NULL
           OR l.follow_up_reminder_sent_for_date <> $1::date
         )`
      : "";

  const result = await pool.query(
    `SELECT
       l.id,
       l.full_name,
       l.company,
       l.phone,
       l.email,
       l.status,
       l.assigned_to,
       l.follow_up_date::text AS follow_up_date,
       l.follow_up_time::text AS follow_up_time,
       l.reminder_enabled,
       l.follow_up_reminder_sent_for_date,
       tm.id AS team_member_id,
       tm.employee_id,
       tm.name AS employee_name,
       tm.email AS employee_email
     FROM leads l
     JOIN team_members tm
       ON tm.id::text = l.assigned_to::text
       OR tm.employee_id = l.assigned_to::text
     WHERE l.reminder_enabled IS TRUE
       AND l.follow_up_date = $1::date
       AND l.follow_up_time IS NOT NULL
       AND l.assigned_to IS NOT NULL
       AND LOWER(COALESCE(l.status, '')) NOT IN ('won', 'lost')
       ${sentFilter}
     ORDER BY l.follow_up_date ASC, l.follow_up_time ASC NULLS LAST, l.id ASC`,
    [reminderDate]
  );

  return result.rows;
};

const createReminderNotification = async (client, lead, phase) => {
  const referenceId = buildReminderReferenceId(lead, phase);
  const { title, message } = buildReminderContent(lead, phase);

  const result = await client.query(
    `INSERT INTO notifications
       (team_member_id, type, title, message, reference_type, reference_id, is_read)
     SELECT $1::uuid, 'reminder', $2::varchar, $3::text, $4::varchar, $5::text, false
     WHERE NOT EXISTS (
       SELECT 1
       FROM notifications
       WHERE team_member_id = $1::uuid
         AND reference_type = $4::varchar
         AND reference_id = $5::text
     )
     RETURNING *`,
    [lead.team_member_id, title, message, REMINDER_REFERENCE_TYPE, referenceId]
  );

  return {
    notification: result.rows[0] || null,
    duplicate: result.rows.length === 0,
  };
};

const markReminderSent = async (client, lead, reminderDate, phase) => {
  if (phase !== "today") {
    await client.query(
      `UPDATE leads
       SET follow_up_reminder_sent_at = NOW()
       WHERE id = $1
         AND follow_up_date = $2::date`,
      [lead.id, reminderDate]
    );
    return;
  }

  await client.query(
    `UPDATE leads
     SET follow_up_reminder_sent_at = NOW(),
         follow_up_reminder_sent_for_date = $1::date
     WHERE id = $2
       AND follow_up_date = $1::date`,
    [reminderDate, lead.id]
  );
};

const processLeadReminder = async (lead, reminderDate, phase) => {
  const client = await pool.connect();
  const referenceId = buildReminderReferenceId(lead, phase);

  try {
    await client.query("BEGIN");
    const result = await createReminderNotification(client, lead, phase);
    await markReminderSent(client, lead, reminderDate, phase);
    await client.query("COMMIT");

    if (result.duplicate) {
      console.log(
        `[ReminderScheduler] Lead ${lead.id} reminder ${referenceId} already exists for ${
          lead.employee_id || lead.team_member_id
        }.`
      );
      return { leadId: lead.id, phase, status: "skipped", reason: "duplicate_notification" };
    }

    console.log(
      `[ReminderScheduler] Sent lead follow-up reminder ${referenceId} to ${
        lead.employee_id || lead.team_member_id
      }.`
    );
    return { leadId: lead.id, phase, status: "sent", employeeId: lead.employee_id };
  } catch (error) {
    await client.query("ROLLBACK");

    if (error.code === "23505") {
      await markReminderSent(client, lead, reminderDate, phase);
      return { leadId: lead.id, phase, status: "skipped", reason: "duplicate_notification" };
    }

    console.error(`[ReminderScheduler] Lead ${lead.id} reminder failed:`, error.message);
    return { leadId: lead.id, phase, status: "failed", error: error.message };
  } finally {
    client.release();
  }
};

const processReminderPhase = async (reminderDate, phase) => {
  console.log(`[ReminderScheduler] Checking ${phase} lead follow-up reminders for ${reminderDate}.`);

  const leads = await fetchReminderLeads(reminderDate, phase);
  const results = [];

  for (const lead of leads) {
    results.push(await processLeadReminder(lead, reminderDate, phase));
  }

  const sent = results.filter((result) => result.status === "sent").length;
  const skipped = results.filter((result) => result.status === "skipped").length;
  const failed = results.filter((result) => result.status === "failed").length;

  console.log(
    `[ReminderScheduler] ${phase} completed. checked=${leads.length}, sent=${sent}, skipped=${skipped}, failed=${failed}.`
  );

  return { phase, reminderDate, checked: leads.length, sent, skipped, failed, results };
};

const runFollowUpReminderJob = async ({ today = toDateString(new Date()), tomorrow = getTomorrowDateString() } = {}) => {
  const tomorrowResult = await processReminderPhase(tomorrow, "tomorrow");
  const todayResult = await processReminderPhase(today, "today");

  const results = [...tomorrowResult.results, ...todayResult.results];
  const sent = tomorrowResult.sent + todayResult.sent;
  const skipped = tomorrowResult.skipped + todayResult.skipped;
  const failed = tomorrowResult.failed + todayResult.failed;
  const checked = tomorrowResult.checked + todayResult.checked;

  console.log(
    `[ReminderScheduler] Completed all phases. checked=${checked}, sent=${sent}, skipped=${skipped}, failed=${failed}.`
  );

  return {
    checked,
    sent,
    skipped,
    failed,
    phases: [tomorrowResult, todayResult],
    results,
  };
};

module.exports = {
  REMINDER_REFERENCE_TYPE,
  toDateString,
  getTomorrowDateString,
  runFollowUpReminderJob,
};
