import { motion } from "framer-motion";
import { FiDatabase, FiUsers, FiTrendingUp, FiTrendingDown,FiUserCheck,FiUserX } from "react-icons/fi";

export default function CustomerStats({ customers = [], leads = [], stats }) {

  const total = customers.length || stats?.customers || 0;
  const active = customers.filter(c => c.active).length;
  const inactive = total - active;

  const activeGrowth =
    total > 0 ? ((active / total) * 100).toFixed(1) : 0;

  const inactiveGrowth =
    total > 0 ? ((inactive / total) * 100).toFixed(1) : 0;

const cards = [
  {
    title: "Total Customers",
    value: total,
    subtitle: "All customers in system",
    growth: `${total}`,
    type: "up",
    icon: FiUsers,
  },
  {
    title: "Total Generated Leads",
    value: leads.length || stats?.leads || 0,
    subtitle: "All generated leads",
    growth: `${leads.length || stats?.leads || 0}`,
    type: "up",
    icon: FiDatabase,
  },
  {
    title: "Active Users",
    value: active,
    subtitle: `${active} active users`,
    growth: `+${activeGrowth}%`,
    type: "up",
    icon: FiUserCheck,
  },
  {
    title: "Inactive User",
    value: inactive,
    subtitle: `${inactive} inactive users`,
    growth: `-${inactiveGrowth}%`,
    type: "down",
    icon: FiUserX,
  },
];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8 w-full">
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.45,
            delay: index * 0.09,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className="
            group relative bg-white
            rounded-2xl
            p-3 sm:p-4 md:p-5
            border border-gray-100
            hover:border-yellow-200
            overflow-hidden
            will-change-transform
            min-w-0
          "
          style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
        >
          {/* Top row */}
          <div className="flex justify-between items-start mb-2 sm:mb-3 gap-1">
            <span className="text-[10px] sm:text-xs md:text-sm text-gray-500 font-medium">
              {card.title}
            </span>

       <div
  className="
    w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9
    rounded-full bg-yellow-50
    flex items-center justify-center
    shrink-0
  "
>
  <card.icon className="text-[#F5C518] text-xs sm:text-sm md:text-base" />
</div>
          </div>

          {/* Value */}
          <h2 className="
            text-[20px] sm:text-[24px] md:text-[28px]
            font-bold text-[#111111]
            leading-none tracking-tight
            mb-2 sm:mb-3
            truncate
          ">
            {card.value}
          </h2>

          {/* Bottom row */}
          <div className="flex items-center justify-between gap-1 flex-wrap">
            <span className="text-[10px] sm:text-[11px] md:text-[12px] text-gray-400">
              {card.subtitle}
            </span>

            <span className={`
              inline-flex items-center gap-0.5
              px-1.5 py-0.5 rounded-full
              text-[9px] sm:text-[10px]
              font-bold whitespace-nowrap
              ${card.type === "up"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-600"
              }
            `}>
              {card.type === "up"
                ? <FiTrendingUp size={8} />
                : <FiTrendingDown size={8} />
              }
              {card.growth}
            </span>
          </div>

          {/* Hover line */}
          <motion.div
            initial={{ width: 0 }}
            whileHover={{ width: "100%" }}
            transition={{ duration: 0.35 }}
            className="
              absolute bottom-0 left-0
              h-[3px]
              bg-gradient-to-r from-[#F5C518] to-yellow-300
            "
          />
        </motion.div>
      ))}
    </div>
  );
}
