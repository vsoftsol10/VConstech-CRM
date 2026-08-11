const pool = require("../config/database");
const { getTeamMember } = require("../utils/notifications");

const notificationSelect = `
  n.*,
  tm.employee_id,
  tm.name AS employee_name,
  n.reference_type AS related_type,
  n.reference_id AS related_id,
  CASE
    WHEN n.reference_type = 'ticket' THEN '/ticket?ticket=' || n.reference_id::text
    WHEN n.reference_type = 'task' THEN '/ticket?task=' || n.reference_id::text
    WHEN n.reference_type = 'lead_follow_up' THEN '/leads/' || split_part(n.reference_id::text, ':', 1)
    ELSE NULL
  END AS link,
  CASE WHEN n.is_read THEN 'Read' ELSE 'Unread' END AS status
`;

const getNotifications = async (req, res) => {
  try {
    const { employee_id, team_member_id, status } = req.query;
    const params = [];
    const where = [];

    if (employee_id || team_member_id) {
      const member = await getTeamMember(team_member_id || employee_id);
      if (!member) return res.json({ success: true, data: [] });
      params.push(member.id);
      where.push(`n.team_member_id = $${params.length}`);
    }

    if (status) {
      params.push(status.toLowerCase() === "read");
      where.push(`n.is_read = $${params.length}`);
    }

    const result = await pool.query(
      `SELECT ${notificationSelect}
       FROM notifications n
       LEFT JOIN team_members tm ON tm.id = n.team_member_id
       ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
       ORDER BY n.created_at DESC`,
      params
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const getNotificationCount = async (req, res) => {
  try {
    const { employee_id, team_member_id } = req.query;
    const params = [];
    const where = ["is_read = false"];

    if (employee_id || team_member_id) {
      const member = await getTeamMember(team_member_id || employee_id);
      if (!member) return res.json({ success: true, data: { unread: 0 } });
      params.push(member.id);
      where.push(`team_member_id = $${params.length}`);
    }

    const result = await pool.query(
      `SELECT COUNT(*)::int AS unread
       FROM notifications
       WHERE ${where.join(" AND ")}`,
      params
    );

    res.json({ success: true, data: { unread: result.rows[0]?.unread || 0 } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE notifications
       SET is_read = true
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ success: false, error: "Notification not found" });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = {
  getNotifications,
  getNotificationCount,
  markNotificationRead,
};
