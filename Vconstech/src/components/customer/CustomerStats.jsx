import { motion } from "framer-motion";
import { TrendingUp, UserCheck, UserX, Users } from "lucide-react";

export default function CustomerStats({ customers = [] }) {
  const total = customers.length;
  const active = customers.filter(c => c.active).length;

  const retention = total > 0 ? Math.round((active / total) * 100) : 0;

  const stats = [
    {
      label: "Total Customers",
      value: total,
      sub: "All records",
      badge: "+100%",
      badgeType: "up",
      icon: Users,
    },
    {
      label: "Active",
      value: active,
      sub: "Currently active",
      badge: `${retention}%`,
      badgeType: "up",
      icon: UserCheck,
    },
    {
      label: "Inactive",
      value: total - active,
      sub: "Not active",
      badge: `${100 - retention}%`,
      badgeType: "down",
      icon: UserX,
    },
    {
      label: "Retention",
      value: `${retention}%`,
      sub: "Customer retention rate",
      badge: retention > 70 ? "Good" : "Low",
      badgeType: retention > 70 ? "up" : "down",
      icon: TrendingUp,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((s, i) => {
        const Icon = s.icon;
        return (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.45,
              delay: i * 0.09,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
            whileHover={{ y: -4 }}
            className="group relative bg-white rounded-2xl p-4 border border-gray-100 hover:border-[#F5C518] transition-colors duration-200"
          >
            {/* Top */}
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs text-gray-500 font-medium">
                {s.label}
              </span>
              <div className="w-9 h-9 rounded-full bg-yellow-50 flex items-center justify-center">
                <Icon className="w-4 h-4 text-yellow-600" />
              </div>
            </div>

            {/* Value */}
            <h2 className="text-2xl font-bold text-[#111] mb-3">
              {s.value}
            </h2>

            {/* Bottom */}
            <div className="flex justify-between">
              <span className="text-xs text-gray-400">{s.sub}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  s.badgeType === "up"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-600"
                }`}
              >
                {s.badge}
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}