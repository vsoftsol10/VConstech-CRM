import { motion } from "framer-motion";
import { FiUser } from "react-icons/fi";

const stats = [
  {
    label:    "Total Ticket",
    value:    "45",
    sub:      "128 this Week",
    subColor: "text-orange-400",
    badge:    "OPEN",
    badgeColor: "bg-orange-100 text-orange-500",
  },
  {
    label:    "Open Ticket",
    value:    "1,328",
    sub:      "-23 this week",
    subColor: "text-orange-400",
    badge:    "OPEN",
    badgeColor: "bg-orange-100 text-orange-500",
  },
  {
    label:    "Response Time",
    value:    "24.6%",
    sub:      "from last month",
    subColor: "text-green-500",
    badge:    "GOOD",
    badgeColor: "bg-green-100 text-green-600",
  },
  {
    label:    "Resolved today",
    value:    "186",
    sub:      "this week",
    subColor: "text-orange-400",
    badge:    "OPEN",
    badgeColor: "bg-orange-100 text-orange-500",
  },
];

const StatsCards = () => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: i * 0.08 }}
          className="bg-white border border-gray-200 rounded-2xl px-5 py-4 flex flex-col justify-between gap-2 shadow-sm hover:shadow-md transition-shadow duration-300 h-full"
        >
          {/* Top Row */}
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-gray-500 font-medium">{stat.label}</span>
            <div className="w-7 h-7 rounded-full bg-[#FFF8E1] flex items-center justify-center">
              <FiUser className="text-[#F5C518] text-sm" />
            </div>
          </div>

          {/* Value */}
          <p className="text-[28px] font-bold text-gray-900 leading-tight">{stat.value}</p>

          {/* Sub + Badge */}
          <div className="flex items-center justify-between mt-auto">
            <span className={`text-[12px] font-medium ${stat.subColor}`}>
              {stat.sub}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${stat.badgeColor}`}>
              {stat.badge}
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default StatsCards;
