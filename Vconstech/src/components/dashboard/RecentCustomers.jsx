
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";


const planStyles = {
  Free:    "bg-gray-100 text-gray-600",
  Basic:   "bg-blue-50 text-blue-500",
  Premium: "bg-purple-50 text-purple-500",
  Advance: "bg-orange-50 text-orange-500",
};

const avatarColors = [
  "from-blue-400 to-indigo-500",
  "from-pink-400 to-rose-500",
  "from-green-400 to-teal-500",
  "from-amber-400 to-orange-500",
  "from-purple-400 to-violet-500",
];

const tableHeaderClass =
  "px-4 md:px-5 py-2.5 text-left text-[11px] font-semibold text-white uppercase tracking-wide";

const RecentCustomers = ({ customers = [] }) => {
  const navigate = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm"
    >

      {/* Header */}
      <div className="px-4 md:px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-2">
        <h2 className="text-[15px] sm:text-[17px] font-semibold text-[#111111]">
          Recent Customers
        </h2>
          <button
        onClick={() => navigate("/customer")}
        className="text-xs sm:text-sm text-[#F5C518] font-medium hover:underline whitespace-nowrap"
      >
        View all
      </button>
      </div>

      {/* ── Desktop / tablet table (sm and up) ── */}
      {/* <div className="hidden sm:block overflow-x-auto"> */}
      <div className="hidden sm:block overflow-x-auto px-4 pb-2">
        {/* <table className="w-full min-w-[560px] border-collapse"> */}
        <table className="table-auto w-full border-collapse">
         <thead>
  <tr className="bg-gray-100">
    {/* {["Customer", "Plan", "Status", "Renewal Date"].map((h) => ( */}
    {["Customer ID", "Customer", "Plan", "Status", "Renewal Date"].map((h) => (
      <th
        key={h}
        className="px-4 md:px-5 py-2.5 text-left text-[14px]  text-gray-800 tracking-wide"
      >
        {h}
      </th>
    ))}
  </tr>
</thead>
          <tbody>
          { customers.slice(0, 5).map((customer, index) => (
              <motion.tr
                key={customer.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.07 }}
                className="border-t border-gray-100 hover:bg-[#fffdf3] transition-colors duration-200 cursor-pointer"
              >
                {/* Customer ID */}
<td className="px-4 py-2 text-sm font-medium text-gray-700">
  {customer.customer_id || customer.id}
</td>
                {/* Name + email */}
                <td className="w-[300px] px-4 py-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-full bg-gradient-to-br ${avatarColors[index % avatarColors.length]}
                        flex items-center justify-center text-white text-xs font-bold shrink-0`}
                    >
                      {customer.customer_name[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#111111] truncate">{customer.customer_name}</p>
                      <p className="text-[11px] text-gray-400 truncate">{customer.email}</p>
                    </div>
                  </div>
                </td>

                {/* Plan */}
                <td className="px-4 md:px-5 py-2">
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${planStyles[customer.subscription_plan] || "bg-gray-100 text-gray-600"}`}>
                    {customer.subscription_plan}
                  </span>
                </td>

                {/* Status */}
                <td className="px-4 md:px-5 py-2">
                  <div className={`inline-flex items-center gap-1.5 text-xs font-semibold
                    ${customer.active? "text-green-500" : "text-red-400"}`}>
                    <span className="relative flex w-1.5 h-1.5 shrink-0">
                      {customer.active && (
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                      )}
                      <span className={`relative inline-flex rounded-full h-1.5 w-1.5
                        ${customer.active ? "bg-green-500" : "bg-red-400"}`}
                      />
                    </span>
                    {customer.active ? "Active" : "Inactive"}
                  </div>
                </td>

                {/* Renewal */}
                <td className="px-4 md:px-5 py-2 text-sm text-gray-400">
                  {customer.renewal_date}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Mobile card list (xs only) ── */}
     <div className="sm:hidden divide-y divide-gray-100">
  {customers.slice(0, 5).map((customer, index) => (
    <motion.div
      key={customer.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#fffdf3] transition-colors cursor-pointer"
    >
      <div
        className={`w-9 h-9 rounded-full bg-gradient-to-br ${
          avatarColors[index % avatarColors.length]
        } flex items-center justify-center text-white text-sm font-bold shrink-0`}
      >
        {customer.customer_name?.[0]}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-[#111111] truncate">
            {customer.customer_name}
          </p>

          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-500">
            {customer.subscription_plan}
          </span>
        </div>

        <p className="text-[11px] text-gray-400 mt-0.5">
          {customer.renewal_date}
        </p>
      </div>

      <div
        className={`inline-flex items-center gap-1.5 text-[11px] font-semibold shrink-0 ${
          customer.active
            ? "text-green-500"
            : "text-red-400"
        }`}
      >
        <span className="relative flex w-1.5 h-1.5">
          {customer.active && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          )}

          <span
            className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
              customer.active
                ? "bg-green-500"
                : "bg-red-400"
            }`}
          />
        </span>

        {customer.active ? "Active" : "Inactive"}
      </div>
    </motion.div>
  ))}
</div>  



    </motion.div>
  );
};

export default RecentCustomers;
