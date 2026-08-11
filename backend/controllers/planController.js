// const pool = require("../config/database");

// // ── GET all plans with features ─────────────────────────────────────────────
// const getAllPlans = async (req, res) => {
//   try {
//     const plans = await pool.query(`
//       SELECT *
//       FROM plans
//       ORDER BY created_at ASC
//     `);

//     const features = await pool.query(`
//       SELECT *
//       FROM plan_features
//     `);

//     const formattedPlans = plans.rows.map((plan) => ({
//       ...plan,
//       features: features.rows.filter((f) => f.plan_id === plan.id),
//     }));

//     res.json(formattedPlans);
//   } catch (err) {
//     res.status(500).json({
//       success: false,
//       message: err.message,
//     });
//   }
// };

// // ── PUT update plan with features ───────────────────────────────────────────
// const updatePlan = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { name, price, duration, description, features } = req.body;

//     // Update plan
//     const result = await pool.query(
//       `UPDATE plans
//        SET name=$1, price=$2, duration=$3, description=$4
//        WHERE id=$5
//        RETURNING *`,
//       [name, price, duration, description, id]
//     );

//     // Delete old features
//     await pool.query(
//       `DELETE FROM plan_features WHERE plan_id=$1`,
//       [id]
//     );

//     // Insert new features
//     for (const feature of features) {
//       if (feature && feature.trim() !== "") {
//         await pool.query(
//           `INSERT INTO plan_features (plan_id, feature_name)
//            VALUES ($1,$2)`,
//           [id, feature]
//         );
//       }
//     }

//     res.json({
//       success: true,
//       plan: result.rows[0],
//     });

//   } catch (err) {
//     res.status(500).json({
//       success: false,
//       message: err.message,
//     });
//   }
// };

// module.exports = {
//   getAllPlans,
//   updatePlan,
// };




const pool = require("../config/database");

const normalizePrice = (price) => {
  if (price === "" || price === undefined || price === null || isNaN(Number(price))) {
    return null;
  }

  return Number(price);
};

const normalizeText = (value) => {
  const text = String(value ?? "").trim();
  return text || null;
};

const normalizeFeature = (feature, index) => {
  const featureName =
    typeof feature === "string" ? feature.trim() : String(feature?.feature_name ?? "").trim();

  if (!featureName) return null;

  const rawCategory =
    typeof feature === "object" ? normalizeText(feature.category_name) : null;
  const rawTier = typeof feature === "object" ? normalizeText(feature.tier) : null;
  const tier = String(rawTier || rawCategory || "normal").toLowerCase() === "advanced"
    ? "advanced"
    : "normal";
  const categoryName = rawCategory || (tier === "advanced" ? "Advanced" : "Normal");
  const displayOrder =
    typeof feature === "object" && !isNaN(Number(feature.display_order))
      ? Number(feature.display_order)
      : index;

  return {
    feature_name: featureName,
    category_name: categoryName,
    tier,
    display_order: displayOrder,
  };
};

const insertPlanFeatures = async (client, planId, features = []) => {
  if (!Array.isArray(features)) return [];

  const inserted = [];

  for (let i = 0; i < features.length; i++) {
    const feature = normalizeFeature(features[i], i);
    if (!feature) continue;

    const result = await client.query(
      `INSERT INTO plan_features (plan_id, feature_name, category_name, tier, display_order)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        planId,
        feature.feature_name,
        feature.category_name,
        feature.tier,
        feature.display_order,
      ]
    );

    inserted.push(result.rows[0]);
  }

  return inserted;
};

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
      ORDER BY display_order ASC
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

// ── POST create new plan with features ──────────────────────────────────────
const createPlan = async (req, res) => {
  const client = await pool.connect();

  try {
    const { name, price, duration, description, features } = req.body;
    const planName = normalizeText(name);

    if (!planName) {
      return res.status(400).json({ success: false, message: "Plan name is required" });
    }

    await client.query("BEGIN");

    const result = await client.query(
      `INSERT INTO plans (name, price, duration, description)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [planName, normalizePrice(price), normalizeText(duration), normalizeText(description)]
    );

    const newPlan = result.rows[0];
    const insertedFeatures = await insertPlanFeatures(client, newPlan.id, features);

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      plan: { ...newPlan, features: insertedFeatures },
    });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("createPlan error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
      detail: err.detail || null,
    });
  } finally {
    client.release();
  }
};

// ── PUT update plan with features ───────────────────────────────────────────
// ── PUT update plan with features ───────────────────────────────────────────
const updatePlan = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const { name, price, duration, description, features } = req.body;
    const planName = normalizeText(name);

    if (!planName) {
      return res.status(400).json({ success: false, message: "Plan name is required" });
    }

    await client.query("BEGIN");

    const result = await client.query(
      `UPDATE plans
       SET name=$1, price=$2, duration=$3, description=$4
       WHERE id=$5
       RETURNING *`,
      [
        planName,
        normalizePrice(price),
        normalizeText(duration),
        normalizeText(description),
        id,
      ]
    );

    if (result.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ success: false, message: "Plan not found" });
    }

    await client.query(`DELETE FROM plan_features WHERE plan_id=$1`, [id]);
    const insertedFeatures = await insertPlanFeatures(client, id, features);

    await client.query("COMMIT");

    res.json({ success: true, plan: { ...result.rows[0], features: insertedFeatures } });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("updatePlan error:", err);
    res.status(500).json({ success: false, message: err.message, detail: err.detail || null });
  } finally {
    client.release();
  }
};
// ── DELETE plan (features cascade via FK) ───────────────────────────────────
const deletePlan = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM plans WHERE id=$1 RETURNING *`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Plan not found",
      });
    }

    res.json({
      success: true,
      message: "Plan deleted",
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
  createPlan,
  updatePlan,
  deletePlan,
};
