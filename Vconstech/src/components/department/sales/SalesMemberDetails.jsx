import { motion } from "framer-motion";

const priorityColors = {
  High: "bg-red-100 text-red-600",
  Medium: "bg-yellow-100 text-yellow-700",
  Low: "bg-green-100 text-green-700",
  Critical: "bg-purple-100 text-purple-700",
};

const leadStatusColors = {
  won: "bg-green-50 text-green-700",
  lost: "bg-red-50 text-red-600",
  qualified: "bg-blue-50 text-blue-700",
  contacted: "bg-yellow-50 text-yellow-700",
  new: "bg-gray-100 text-gray-700",
};

const DetailStat = ({ label, value }) => (
  <div className="rounded-xl bg-gray-50 px-3 py-2">
    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
    <p className="mt-1 text-sm font-bold text-[#111111]">{value ?? "-"}</p>
  </div>
);

const SalesMemberDetails = ({
  member,
  tasks = [],
  leads = [],
  loading = false,
  tasksLoading = false,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay: 0.2 }}
    className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex-1"
  >
    <div className="px-5 pt-5 pb-3 border-b border-gray-100">
      <h2 className="text-[16px] font-bold text-[#111111]">Member Details</h2>
    </div>

    {loading ? (
      <div className="p-5 space-y-3">
        {[...Array(5)].map((_, index) => (
          <div key={index} className="h-12 rounded-xl bg-gray-100 animate-pulse" />
        ))}
      </div>
    ) : !member ? (
      <div className="p-10 text-center text-sm text-gray-400">Select a team member to view details.</div>
    ) : (
      <div className="p-5 space-y-5">
        <div className="flex items-center gap-3">
          <img
            src={member.avatar}
            alt={member.name}
            className="h-12 w-12 rounded-full object-cover border border-gray-100"
          />
          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-bold text-[#111111]">{member.name}</h3>
            <p className="text-xs text-gray-400">{member.role || "Sales Executive"}</p>
          </div>
          <span className="ml-auto rounded-full bg-yellow-50 px-2.5 py-1 text-[11px] font-bold text-yellow-700">
            {member.status || "Active"}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <DetailStat label="Employee ID" value={member.employeeId || member.id} />
          <DetailStat label="Leads Assigned" value={member.leadsAssigned} />
          <DetailStat label="Deals Won" value={member.dealsWon} />
          <DetailStat label="Today's Due Tasks" value={tasks.length} />
        </div>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#111111]">Today's Due Tasks</h3>
            {tasksLoading && <span className="text-xs text-gray-400">Refreshing...</span>}
          </div>

          {tasksLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="h-12 rounded-xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : tasks.length > 0 ? (
            <div className="space-y-2">
              {tasks.map((task) => (
                <div key={task.id} className="rounded-xl border border-gray-100 px-3 py-3 hover:bg-yellow-50/40 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#111111]">{task.title || "Untitled task"}</p>
                      <p className="mt-1 text-xs text-gray-400">{task.person || member.name}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${priorityColors[task.priority] || priorityColors.Medium}`}>
                      {task.priority || "Medium"}
                    </span>
                  </div>
                  <p className="mt-2 text-xs font-medium text-gray-500">{task.time || "Due today"}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-400">
              No due tasks for today.
            </div>
          )}
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#111111]">Assigned Leads</h3>
            <span className="text-xs text-gray-400">{leads.length} lead{leads.length !== 1 ? "s" : ""}</span>
          </div>

          {leads.length > 0 ? (
            <div className="max-h-[320px] overflow-y-auto rounded-xl border border-gray-100">
              {leads.map((lead) => {
                const status = String(lead.status || "new").toLowerCase();
                return (
                  <div key={lead.id} className="border-b border-gray-100 px-3 py-3 last:border-b-0 hover:bg-yellow-50/40 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#111111]">{lead.full_name || "Untitled lead"}</p>
                        <p className="mt-1 truncate text-xs text-gray-400">{lead.company || lead.channel || "-"}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${leadStatusColors[status] || leadStatusColors.new}`}>
                        {lead.status || "new"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-400">
              No assigned leads for this member.
            </div>
          )}
        </section>
      </div>
    )}
  </motion.div>
);

export default SalesMemberDetails;
