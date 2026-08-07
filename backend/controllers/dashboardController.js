const pool = require("../config/database");
const erpApiClient = require("../integration/services/erpApiClient");
const erpSupabaseCustomerService = require("../services/erpSupabaseCustomerService");

const countValue = async (query) => {
  const result = await pool.query(query);
  return result.rows[0]?.count || 0;
};

const unwrapErpCustomers = (response) =>
  response?.customers || response?.data?.customers || (Array.isArray(response) ? response : []);

const isActiveCustomer = (customer) => {
  if (typeof customer?.active === "boolean") return customer.active;

  const status = String(
    customer?.subscription_status ||
      customer?.subscriptionStatus ||
      customer?.payment_status ||
      customer?.paymentStatus ||
      customer?.accountStatus ||
      ""
  )
    .trim()
    .toLowerCase();

  return [
    "active",
    "trial active",
    "trial_active",
    "subscription active",
    "subscription_active",
  ].includes(status);
};

const getErpCustomerStats = async () => {
  const data = erpSupabaseCustomerService.isConfigured()
    ? await erpSupabaseCustomerService.getCustomers()
    : await erpApiClient.getCustomers();
  const customers = unwrapErpCustomers(data);

  return {
    customers: customers.length,
    activeCustomers: customers.filter(isActiveCustomer).length,
  };
};

const getDashboardStats = async (_req, res) => {
  try {
    const erpCustomerStats = await getErpCustomerStats();
    const [
      leads,
      tickets,
      tasks,
      teamMembers,
      notifications,
      unreadNotifications,
    ] = await Promise.all([
      countValue("SELECT COUNT(*)::int AS count FROM leads"),
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
        customers: erpCustomerStats.customers,
        activeCustomers: erpCustomerStats.activeCustomers,
        inactiveCustomers: erpCustomerStats.customers - erpCustomerStats.activeCustomers,
        activeSubscriptions: erpCustomerStats.activeCustomers,
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
