const pool = require("../config/database");
const erpApiClient = require("../integration/services/erpApiClient");
const erpSupabaseCustomerService = require("../services/erpSupabaseCustomerService");

const countValue = async (query) => {
  const result = await pool.query(query);
  return result.rows[0]?.count || 0;
};

const unwrapErpCustomers = (response) =>
  response?.customers ||
  response?.data?.customers ||
  response?.users ||
  response?.data?.users ||
  (Array.isArray(response) ? response : []);

const isActiveCustomer = (customer) => {
  if (typeof customer?.active === "boolean") return customer.active;
  if (typeof customer?.isActive === "boolean") return customer.isActive;

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
    : await erpApiClient.getSuperadminUsers();
  const customers = unwrapErpCustomers(data);

  return {
    customers: customers.length,
    activeCustomers: customers.filter(isActiveCustomer).length,
  };
};

const getLocalCustomerStats = async () => {
  const [customers, activeCustomers] = await Promise.all([
    countValue("SELECT COUNT(*)::int AS count FROM customers"),
    countValue(`
      SELECT COUNT(*)::int AS count
      FROM customers
      WHERE active = true
         OR LOWER(COALESCE(subscription_status, payment_status, '')) IN (
           'active',
           'trial active',
           'trial_active',
           'subscription active',
           'subscription_active'
         )
    `),
  ]);

  return { customers, activeCustomers };
};

const getDashboardStats = async (_req, res) => {
  try {
    let customerStats;

    try {
      customerStats = await getErpCustomerStats();
    } catch (sourceErr) {
      console.error("Dashboard customer source unavailable, using local CRM customers:", sourceErr.message);
      customerStats = await getLocalCustomerStats();
    }

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
        customers: customerStats.customers,
        activeCustomers: customerStats.activeCustomers,
        inactiveCustomers: customerStats.customers - customerStats.activeCustomers,
        activeSubscriptions: customerStats.activeCustomers,
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
