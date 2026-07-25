
import { motion } from "framer-motion";
import { FiTrendingUp, FiTrendingDown } from "react-icons/fi";

const LeadStatsCard = ({ title, value, subtitle, growth, growthType, delay, icon: Icon }) => {
  const isPositive = growthType === "positive";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: (delay ?? 0) * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className="
        group relative bg-white rounded-2xl
        p-3 sm:p-4 md:p-5
        border border-gray-100 hover:border-yellow-200
        overflow-hidden will-change-transform min-w-0 h-full
      "
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
    >
      {/* Top row */}
      <div className="flex justify-between items-start mb-2 sm:mb-3 gap-1">
        {/* ✅ was text-xs/sm — too large on small grids; now scales from 10px */}
        <span className="text-[10px] sm:text-xs text-gray-500 font-medium leading-snug">
          {title}
        </span>
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-yellow-50 flex items-center justify-center shrink-0">
          {Icon && <Icon size={14} className="text-[#F5C518]" />}
        </div>
      </div>

      {/* Value — ✅ scales down on mobile so it doesn't overflow */}
      <div className="text-[20px] sm:text-[24px] md:text-[28px] font-bold text-gray-900 leading-none tracking-tight mb-2 truncate">
        {value}
      </div>

      {/* Bottom */}
      <div className="flex items-center justify-between gap-1 flex-wrap">
        <span className="text-[10px] sm:text-[11px] text-gray-400">{subtitle}</span>
        {/* <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold whitespace-nowrap shrink-0 ${isPositive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
          {isPositive ? <FiTrendingUp size={8} /> : <FiTrendingDown size={8} />}
          {growth}
        </span> */}
      </div>

      {/* Hover bar */}
      <motion.div
        initial={{ width: 0 }}
        whileHover={{ width: "100%" }}
        transition={{ duration: 0.35 }}
        className="absolute bottom-0 left-0 h-[3px] bg-gradient-to-r from-[#F5C518] to-yellow-300"
      />
    </motion.div>
  );
};

export default LeadStatsCard;