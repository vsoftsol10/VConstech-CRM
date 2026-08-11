import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FiMail, FiPhone } from "react-icons/fi";

const statusStyles = {
  new: "bg-blue-50 text-blue-600",
  contacted: "bg-cyan-50 text-cyan-600",
  qualified: "bg-emerald-50 text-emerald-600",
  proposal: "bg-amber-50 text-amber-600",
  won: "bg-green-50 text-green-600",
  lost: "bg-red-50 text-red-500",
  converted: "bg-purple-50 text-purple-600",
};

const formatLabel = (value, fallback = "Not set") => {
  const text = String(value || "").trim();
  if (!text) return fallback;
  return text
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
};

const formatDate = (value) => {
  if (!value) return "No date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No date";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getInitial = (lead) =>
  String(lead.full_name || lead.company || "?").trim().charAt(0).toUpperCase();

const RecentLeads = ({ leads = [] }) => {
  const navigate = useNavigate();
  const recentLeads = leads.slice(0, 6);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm"
    >
      <div className="px-4 md:px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-[15px] sm:text-[17px] font-semibold text-[#111111]">
            CRM Lead Data
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {leads.length} total lead{leads.length === 1 ? "" : "s"}
          </p>
        </div>
        <button
          onClick={() => navigate("/lead-sales")}
          className="text-xs sm:text-sm text-[#F5C518] font-medium hover:underline whitespace-nowrap"
        >
          View all
        </button>
      </div>

      <div className="hidden md:block overflow-x-auto px-4 pb-2">
        <table className="table-auto w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              {["Lead", "Company", "Contact", "Status", "Plan", "Lead Date"].map((header) => (
                <th
                  key={header}
                  className="px-4 md:px-5 py-2.5 text-left text-[14px] text-gray-800 tracking-wide"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recentLeads.map((lead, index) => {
              const status = String(lead.status || "").toLowerCase();

              return (
                <motion.tr
                  key={lead.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06 }}
                  onClick={() => navigate("/lead-sales")}
                  className="border-t border-gray-100 hover:bg-[#fffdf3] transition-colors duration-200 cursor-pointer"
                >
                  <td className="w-[260px] px-4 py-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-yellow-50 flex items-center justify-center text-[#F5C518] text-xs font-bold shrink-0">
                        {getInitial(lead)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#111111] truncate">
                          {lead.full_name || "Unnamed lead"}
                        </p>
                        <p className="text-[11px] text-gray-400 truncate">
                          {lead.channel ? formatLabel(lead.channel) : "No channel"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 md:px-5 py-2 text-sm text-gray-600">
                    {lead.company || "-"}
                  </td>
                  <td className="px-4 md:px-5 py-2">
                    <div className="space-y-1 text-xs text-gray-500">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <FiMail className="shrink-0 text-gray-400" />
                        <span className="truncate">{lead.email || "-"}</span>
                      </div>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <FiPhone className="shrink-0 text-gray-400" />
                        <span className="truncate">{lead.phone || "-"}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 md:px-5 py-2">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                        statusStyles[status] || "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {formatLabel(lead.status)}
                    </span>
                  </td>
                  <td className="px-4 md:px-5 py-2 text-sm text-gray-600">
                    {formatLabel(lead.plan, "No plan")}
                  </td>
                  <td className="px-4 md:px-5 py-2 text-sm text-gray-400">
                    {formatDate(lead.lead_date || lead.created_at)}
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="md:hidden divide-y divide-gray-100">
        {recentLeads.map((lead, index) => {
          const status = String(lead.status || "").toLowerCase();

          return (
            <motion.div
              key={lead.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              onClick={() => navigate("/lead-sales")}
              className="px-4 py-3 hover:bg-[#fffdf3] transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-yellow-50 flex items-center justify-center text-[#F5C518] text-sm font-bold shrink-0">
                    {getInitial(lead)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#111111] truncate">
                      {lead.full_name || "Unnamed lead"}
                    </p>
                    <p className="text-[11px] text-gray-400 truncate">
                      {lead.company || "No company"}
                    </p>
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${
                    statusStyles[status] || "bg-gray-100 text-gray-600"
                  }`}
                >
                  {formatLabel(lead.status)}
                </span>
              </div>
              <div className="mt-2 grid grid-cols-1 gap-1 text-[11px] text-gray-400">
                <span className="truncate">{lead.email || "No email"}</span>
                <span className="truncate">
                  {lead.phone || "No phone"} - {formatLabel(lead.plan, "No plan")} -{" "}
                  {formatDate(lead.lead_date || lead.created_at)}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {recentLeads.length === 0 && (
        <div className="px-4 md:px-6 py-8 text-center text-sm text-gray-400">
          No CRM leads found.
        </div>
      )}
    </motion.div>
  );
};

export default RecentLeads;
