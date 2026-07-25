const pool = require("../config/database");

const countValue = async (query) => {
  const result = await pool.query(query);
  return result.rows[0]?.count || 0;
};

const getDashboardStats = async (_req, res) => {
  try {
    const [
      leads,
      customers,
      activeSubscriptions,
      tickets,
      tasks,
      teamMembers,
      notifications,
      unreadNotifications,
    ] = await Promise.all([
      countValue("SELECT COUNT(*)::int AS count FROM leads"),
      countValue("SELECT COUNT(*)::int AS count FROM customers"),
      countValue("SELECT COUNT(*)::int AS count FROM customers WHERE renewal_date >= CURRENT_DATE"),
      countValue("SELECT COUNT(*)::int AS count FROM tickets"),
      countValue("SELECT COUNT(*)::int AS count FROM tasks"),
      countValue("SELECT COUNT(*)::int AS count FROM team_members"),
      countValue("SELECT COUNT(*)::int AS count FROM notifications"),
      countValue("SELECT COUNT(*)::int AS count FROM notifications WHERE is_read = false"),
    ]);

    res.json({
      success: true,
      data: {
        leads,
        customers,
        activeSubscriptions,
        tickets,
        tasks,
        teamMembers,
        notifications,
        unreadNotifications,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = { getDashboardStats };
