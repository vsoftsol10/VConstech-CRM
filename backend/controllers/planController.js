const pool = require("../config/database");

// ── GET all plans with features ─────────────────────────────────────────────
const getAllPlans = async (req, res) => {
  try {
    const plans = await pool.query(`
      SELECT *
      FROM plans
      ORDER BY created_at ASC
    `);

    const features = await pool.query(`
      SELECT *
      FROM plan_features
    `);

    const formattedPlans = plans.rows.map((plan) => ({
      ...plan,
      features: features.rows.filter((f) => f.plan_id === plan.id),
    }));

    res.json(formattedPlans);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ── PUT update plan with features ───────────────────────────────────────────
const updatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, duration, description, features } = req.body;

    // Update plan
    const result = await pool.query(
      `UPDATE plans
       SET name=$1, price=$2, duration=$3, description=$4
       WHERE id=$5
       RETURNING *`,
      [name, price, duration, description, id]
    );

    // Delete old features
    await pool.query(
      `DELETE FROM plan_features WHERE plan_id=$1`,
      [id]
    );

    // Insert new features
    for (const feature of features) {
      if (feature && feature.trim() !== "") {
        await pool.query(
          `INSERT INTO plan_features (plan_id, feature_name)
           VALUES ($1,$2)`,
          [id, feature]
        );
      }
    }

    res.json({
      success: true,
      plan: result.rows[0],
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  getAllPlans,
  updatePlan,
};
