import { motion } from "framer-motion";

const HEADERS = ["Member", "Leads Assigned", "Deals Won", "Status"];

const statusColors = {
  Busy: "text-orange-500",
  Active: "text-green-500",
  Inactive: "text-gray-400",
};

const SalesTeamMembers = ({ members = [], selectedId, onSelect, loading = false }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay: 0.15 }}
    className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex-1"
  >
    <div className="px-5 pt-5 pb-3">
      <h2 className="text-[16px] font-bold text-[#111111]">Team Members</h2>
    </div>

    {loading ? (
      <div className="p-5 space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-14 rounded-xl bg-gray-100 animate-pulse" />
        ))}
      </div>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[400px] border-collapse">
          <thead>
            <tr className="bg-[#f0f0ee]">
              {HEADERS.map((h) => (
                <th
                  key={h}
                  className="px-5 py-3 text-center text-[12px] sm:text-[13px] font-semibold text-[#111111] whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {members.map((m, i) => (
              <motion.tr
                key={m.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.06 }}
                onClick={() => onSelect(m.id)}
                className={`border-t border-gray-100 cursor-pointer transition-colors ${
                  selectedId === m.id
                    ? "bg-yellow-50 border-l-4 border-l-yellow-400"
                    : "hover:bg-[#fffdf3]"
                }`}
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={m.avatar}
                      alt={m.name}
                      className="w-10 h-10 rounded-full object-cover shrink-0"
                    />
                    <div>
                      <p className="text-[13px] font-bold text-[#111111] whitespace-nowrap">{m.name}</p>
                      <p className="text-[11px] text-gray-400">{m.role}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 text-center text-[14px] text-gray-700 font-semibold">
                  {m.leadsAssigned}
                </td>
                <td className="px-5 py-4 text-center text-[14px] text-gray-700 font-semibold">
                  {m.dealsWon}
                </td>
                <td className="px-5 py-4 text-center">
                  <span className={`text-[13px] font-bold ${statusColors[m.status] || "text-gray-500"}`}>
                    {m.status}
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>

        {members.length === 0 && (
          <div className="py-10 text-center text-sm text-gray-400">No sales team members found.</div>
        )}
      </div>
    )}
  </motion.div>
);

export default SalesTeamMembers;
