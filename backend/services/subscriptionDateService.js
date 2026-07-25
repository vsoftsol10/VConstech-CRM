const DAY_IN_MS = 24 * 60 * 60 * 1000;

const PLAN_ALIASES = {
  trail: "trial",
  trial: "free trial",
  "free trial": "free trial",
};

const normalizePlanKey = (value) => {
  const key = String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
  return PLAN_ALIASES[key] || key;
};

const parsePositiveNumber = (value) => {
  const match = String(value || "").match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : null;
};

const parsePlanDurationInDays = (duration) => {
  const text = String(duration || "").trim().toLowerCase();
  const amount = parsePositiveNumber(text);
  const value = amount && amount > 0 ? amount : 1;

  if (!text) return null;
  if (/\b(day|days|daily)\b/.test(text)) return Math.round(value);
  if (/\b(week|weeks|weekly)\b/.test(text)) return Math.round(value * 7);
  if (/\b(month|months|monthly)\b/.test(text)) return Math.round(value * 30);
  if (/\b(year|years|annual|annually|yearly)\b/.test(text)) return Math.round(value * 365);
  if (amount && amount > 0) return Math.round(amount);

  return null;
};

const calculateSubscriptionDates = (planDurationInDays, startDate = new Date()) => {
  const duration = Number(planDurationInDays);
  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error("Plan duration must be a positive number of days");
  }

  const subscription_start_date = new Date(startDate);
  const subscription_end_date = new Date(subscription_start_date.getTime() + Math.round(duration) * DAY_IN_MS);

  return {
    subscription_start_date,
    subscription_end_date,
  };
};

const getPlanForSubscription = async (db, planName) => {
  const planKey = normalizePlanKey(planName);
  const result = await db.query(
    `SELECT id, name, price, duration
     FROM plans
     WHERE LOWER(TRIM(name)) = $1
        OR LOWER(TRIM(name)) = $2
     ORDER BY created_at ASC
     LIMIT 1`,
    [planKey, normalizePlanKey(planKey)]
  );

  const plan = result.rows[0];
  if (!plan) {
    const error = new Error(`Subscription plan "${planName}" was not found`);
    error.status = 400;
    throw error;
  }

  const durationInDays = parsePlanDurationInDays(plan.duration);
  if (!durationInDays) {
    const error = new Error(`Subscription plan "${plan.name}" has an invalid duration`);
    error.status = 400;
    throw error;
  }

  return {
    ...plan,
    price: Number(plan.price || 0),
    durationInDays,
  };
};

module.exports = {
  calculateSubscriptionDates,
  getPlanForSubscription,
  normalizePlanKey,
  parsePlanDurationInDays,
};
