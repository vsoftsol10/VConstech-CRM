import { motion } from "framer-motion";
import { FiUser } from "react-icons/fi";

const SalesStats = ({ stats = [], loading = false }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-[124px] rounded-2xl border border-gray-200 bg-white p-5 shadow-sm animate-pulse"
          >
            <div className="mb-5 h-4 w-24 rounded bg-gray-100" />
            <div className="h-8 w-16 rounded bg-gray-100" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: i * 0.08 }}
          className="bg-white border border-gray-200 rounded-2xl px-5 py-4 flex flex-col justify-between gap-2 shadow-sm hover:shadow-md hover:border-[#F5C518] hover:-translate-y-[3px] transition-all duration-200 h-full"
        >
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-gray-500 font-medium">{stat.label}</span>
            <div className="w-7 h-7 rounded-full bg-[#FFF8E1] flex items-center justify-center">
              <FiUser className="text-[#F5C518] text-sm" />
            </div>
          </div>
          <p className="text-[28px] font-bold text-gray-900 leading-tight">{stat.value}</p>
          <div className="flex items-center justify-between mt-auto">
            <span className={`text-[12px] font-medium ${stat.subColor}`}>{stat.sub}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${stat.badgeColor}`}>
              {stat.badge}
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default SalesStats;
