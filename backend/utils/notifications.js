const pool = require("../config/database");

const getTeamMember = async (identifier) => {
  if (!identifier) return null;

  const result = await pool.query(
    `SELECT id, employee_id, name, department
     FROM team_members
     WHERE id::text = $1 OR employee_id = $1
     LIMIT 1`,
    [String(identifier)]
  );

  return result.rows[0] || null;
};

const createNotification = async ({
  employeeId,
  teamMemberId,
  employeeName,
  title,
  message,
  type = "info",
  relatedType,
  relatedId,
  link,
}) => {
  if ((!employeeId && !teamMemberId) || !title) return null;

  try {
    const member = await getTeamMember(teamMemberId || employeeId);
    if (!member) return null;

    const result = await pool.query(
      `INSERT INTO notifications
       (team_member_id, type, title, message, reference_type, reference_id, is_read)
       VALUES ($1,$2,$3,$4,$5,$6,false)
       RETURNING *`,
      [
        member.id,
        type,
        title,
        message || title,
        relatedType || null,
        relatedId || null,
      ]
    );

    return {
      ...result.rows[0],
      employee_id: member.employee_id,
      employee_name: employeeName || member.name,
      related_type: result.rows[0].reference_type,
      related_id: result.rows[0].reference_id,
      link: link || null,
    };
  } catch (err) {
    console.warn("Notification skipped:", err.message);
    return null;
  }
};

module.exports = { createNotification, getTeamMember };
