import Toggle from "./Toggle";
import CustomerToolbar from "./CustomerToolbar";
import CustomerActionMenu from "./CustomerActionMenu";

export default function CustomerMobileCards({
  filteredCustomers,
  handleToggle,
  emptyMessage,
  tabs,
  activeTab,
  setActiveTab,
  customers,
  tableSearch,
  setTableSearch,
  planFilter,
  togglePlanFilter,
  onView,
  onEdit,
  onDelete,
}) {
  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <CustomerToolbar
          tabs={tabs}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          customers={customers}
          tableSearch={tableSearch}
          setTableSearch={setTableSearch}
          planFilter={planFilter}
          togglePlanFilter={togglePlanFilter}
        />
      </div>

      {filteredCustomers.length === 0 ? (
        <p className="text-center py-12 text-gray-400 text-sm">{emptyMessage}</p>
      ) : (
        filteredCustomers.map((c, i) => (
          <div
            key={c.id}
            className="
              anim-fadeUp bg-white rounded-2xl border border-gray-100 shadow-sm p-4
              hover:border-yellow-200 hover:shadow-md hover:shadow-yellow-50
              transition-all duration-200
            "
            style={{ animationDelay: `${i * 60}ms` }}
          >
            {/* Row 1 — Name + Plan + Menu */}
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="font-semibold text-gray-800 text-sm">{c.name}</div>
                <div className="text-xs text-gray-400 mt-0.5">{c.id} · {c.company}</div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${c.planColor}`}>
                  {c.plan}
                </span>
                <CustomerActionMenu
                  onView={() => onView(c)}
                  onEdit={() => onEdit(c)}
                  onDelete={() => onDelete(c.id)}
                />
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-50 my-2" />

            {/* Row 2 — Email + Phone */}
            <div className="flex flex-col gap-0.5 mb-3">
              <div className="text-xs text-gray-500">{c.email}</div>
              <div className="text-xs text-gray-400">{c.phone}</div>
            </div>

            {/* Row 3 — Date + Members + Toggle */}
            <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
              <div>
                <div className="text-gray-400">Price</div>
                <div className="font-medium text-gray-700">
                  {c.subscription_amount !== "" && c.subscription_amount != null ? `₹${c.subscription_amount}` : "-"}
                </div>
              </div>
              <div>
                <div className="text-gray-400">Expiry</div>
                <div className="font-medium text-gray-700">{c.renewal_date || "-"}</div>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">{c.start_date || "-"}</span>
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-gray-600">{c.members} members</span>
                <Toggle active={c.active} onToggle={() => handleToggle(c)} />
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
