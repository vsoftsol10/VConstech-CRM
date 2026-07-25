import { motion } from "framer-motion";
import { CardIcon } from "../icons/SubscriptionIcons";

function computeActive(customer) {
  const dateStr = customer.renewal_date_raw || customer.renewal_date;
  if (!dateStr) return false;
  const renewal = new Date(dateStr);
  if (isNaN(renewal)) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return renewal >= today;
}

function buildStatCards(customers) {
  const total    = customers.length;
  const today    = new Date();
  today.setHours(0, 0, 0, 0);
  const in7Days  = new Date(today);
  in7Days.setDate(in7Days.getDate() + 7);

  // ── Active: renewal_date >= today ──────────────────────────
  const activePlans = customers.filter((c) => computeActive(c)).length;

  // ── Expiring Soon: active but within 7 days ────────────────
  const expiringSoon = customers.filter((c) => {
    const dateStr = c.renewal_date_raw || c.renewal_date;
    const renewal = new Date(dateStr);
    return !isNaN(renewal) && renewal >= today && renewal <= in7Days;
  }).length;

  // ── Due for Renewal: already expired ──────────────────────
  const renewedPlans = customers.filter((c) => c.has_renewed === true).length;

  // ── Notified: reminder_sent = true ────────────────────────
  const notified = customers.filter((c) => c.reminder_sent === true).length;

  return [
    {
      label:     "Plan Active",
      value:     activePlans,
      sub:       `${total} total customers`,
      badge:     total > 0 ? `${Math.round((activePlans / total) * 100)}%` : "0%",
      badgeType: "green",
    },
    {
      label:     "Expiring Soon",
      value:     expiringSoon,
      sub:       "Within the next 7 days",
      badge:     expiringSoon > 0 ? "Action needed" : "All clear",
      badgeType: expiringSoon > 0 ? "red" : "green",
    },
    {
      label:     "Renew Plan",
      value:     renewedPlans,
      sub:       "Customers renewed",
      badge:     renewedPlans > 0 ? `${renewedPlans} renewed` : "0",
      badgeType: "green",
    },
    {
      label:     "Notify Customer",
      value:     notified,
      sub:       "Reminders sent",
      badge:     total > 0 ? `${Math.round((notified / total) * 100)}%` : "0%",
      badgeType: "green",
    },
  ];
}

export default function SubscriptionStats({ customers = [] }) {
  const statCards = buildStatCards(customers);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 mt-5">
      {statCards.map((card, index) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.45,
            delay: index * 0.09,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className="
            group relative bg-white rounded-2xl p-2 md:p-5
            border border-gray-100 hover:border-yellow-200
            overflow-hidden will-change-transform
          "
          style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs md:text-sm text-gray-500 font-medium">
              {card.label}
            </span>
            <div className="
              w-[32px] sm:w-[34px] md:w-[36px]
              h-[32px] sm:h-[34px] md:h-[36px]
              rounded-full bg-yellow-50
              flex items-center justify-center shrink-0 ml-2
            ">
              <span className="text-[#F5C518]"><CardIcon /></span>
            </div>
          </div>

          <h2 className="
            text-[22px] sm:text-[26px] md:text-[28px]
            font-bold text-[#111111] leading-none tracking-tight mb-3
          ">
            {card.value}
          </h2>

          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] sm:text-[12px] text-gray-400">
              {card.sub}
            </span>
            <span className={`
              flex items-center gap-0.5 px-1.5 py-0.5 rounded-full
              text-[9px] sm:text-[10px] font-bold whitespace-nowrap
              ${card.badgeType === "green"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-600"}
            `}>
              {card.badge}
            </span>
          </div>

          <motion.div
            initial={{ width: 0 }}
            whileHover={{ width: "100%" }}
            transition={{ duration: 0.35 }}
            className="absolute bottom-0 left-0 h-[3px] bg-gradient-to-r from-[#F5C518] to-yellow-300"
          />
        </motion.div>
      ))}
    </div>
  );
}
