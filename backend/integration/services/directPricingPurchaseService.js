const pool = require("../../config/database");
const { ensurePaidPricingCustomer } = require("../../services/customerService");

const handleDirectPricingPurchase = async (payload) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const result = await ensurePaidPricingCustomer(client, payload);

    await client.query("COMMIT");

    return {
      created: result.created,
      customer: {
        id: result.customer.id,
        customer_name: result.customer.customer_name,
        company_name: result.customer.company_name,
        email: result.customer.email,
        phone: result.customer.phone,
        subscription_plan: result.customer.subscription_plan,
        payment_status: result.customer.payment_status,
        subscription_status: result.customer.subscription_status,
        subscription_start_date: result.customer.subscription_start_date,
        subscription_end_date: result.customer.subscription_end_date,
        erp_customer_id: result.customer.erp_customer_id || null,
      },
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  handleDirectPricingPurchase,
};
