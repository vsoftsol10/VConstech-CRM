import { motion } from "framer-motion";
import { FiTrendingUp, FiTrendingDown } from "react-icons/fi";

export default function TechnicalStats({ stats = [], loading = false }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-[116px] rounded-2xl border border-gray-200 bg-white p-5 shadow-sm animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1    }}
          transition={{ duration: 0.3, delay: i * 0.1 }}
          whileHover={{ y: -5 }}
          className="
            relative bg-white
            border border-gray-200
            rounded-2xl p-3 sm:p-4 md:p-5
            shadow-sm hover:shadow-xl
            hover:border-[#F5C518]
            transition-all duration-300
            cursor-pointer overflow-hidden
            h-full flex flex-col justify-between
          "
        >
          {/* Top */}
          <div className="flex items-start justify-between mb-3">
            <span className="text-[11px] sm:text-[12px] md:text-[13px] font-medium text-gray-500 leading-tight pr-2">
              {s.label}
            </span>
            <div className="
              w-[30px] sm:w-[32px] md:w-[34px]
              h-[30px] sm:h-[32px] md:h-[34px]
              rounded-full bg-yellow-50
              flex items-center justify-center shrink-0
            ">
              <svg width="16" height="16" fill="none" stroke="#F5C518" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
          </div>

          {/* Number */}
          <h2 className="text-[20px] sm:text-[22px] md:text-[24px] font-bold text-[#111111] leading-none tracking-tight mb-3">
            {s.value}
          </h2>

          {/* Bottom */}
          <div className="flex items-center justify-between gap-1 sm:gap-2">
            <span className="text-[10px] sm:text-[11px] md:text-[12px] text-gray-400 truncate">
              {s.sub}
            </span>
            <div className={`
              flex items-center gap-0.5 px-1.5 py-0.5
              rounded-full shrink-0
              text-[9px] sm:text-[10px] font-bold whitespace-nowrap
              ${s.badgeType === "up"
                ? "bg-green-100 text-green-600"
                : "bg-red-100 text-red-500"
              }
            `}>
              {s.badgeType === "up"
                ? <FiTrendingUp size={8} />
                : <FiTrendingDown size={8} />
              }
              {s.badge}
            </div>
          </div>

          {/* Hover Line */}
          <div className="absolute bottom-0 left-0 w-0 h-[3px] bg-gradient-to-r from-[#F5C518] to-yellow-300 hover:w-full transition-all duration-500" />
        </motion.div>
      ))}
    </div>
  );
}
