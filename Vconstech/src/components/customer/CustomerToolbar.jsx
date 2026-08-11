import { useState, useRef, useEffect } from "react";
import { Search } from "lucide-react";

const PLANS = ["Free trial", "Basic",  "Premium", "Advanced"];

const PLAN_STYLES = {
  Freetrial:      "bg-gray-100 text-gray-600",
  Basic:      "bg-yellow-100 text-yellow-700",
  Pro:        "bg-blue-100 text-blue-700",
  Premium:    "bg-purple-100 text-purple-700",
  Enterprise: "bg-purple-100 text-purple-700",
};

export default function CustomerToolbar({
  tabs,
  activeTab,
  setActiveTab,
  customers,
  tableSearch,
  setTableSearch,
  planFilter,
  togglePlanFilter,
  onAddCustomer,
}) {
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const clearAll    = () => PLANS.forEach((p) => planFilter.includes(p) && togglePlanFilter(p));
  const activeCount = planFilter.length;

  return (
    <div className="px-4 md:px-6 pt-5 pb-3 border-b border-gray-100">

      {/* TOP ROW */}
      <div className="flex flex-wrap items-center gap-3 mb-4">

        {/* Search */}
        <div className="relative min-w-[180px] flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search name, email, phone..."
            value={tableSearch}
            onChange={(e) => setTableSearch(e.target.value)}
            className="w-full h-[46px] pl-10 pr-4 rounded-xl border border-gray-200 text-sm text-gray-700 outline-none focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100 transition-all"
          />
        </div>

        {/* Add Customer Button */}
        <button
          onClick={onAddCustomer}
          className="order-3 sm:order-none flex items-center justify-center gap-1.5 h-[46px] px-4 rounded-xl bg-[#F5C518] text-black text-sm font-bold hover:bg-yellow-400 active:scale-95 transition-all duration-150 shrink-0 shadow-sm"
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
          Add Customer
        </button>

    
      </div>

      {/* Active filter chips */}
      {activeCount > 0 && (
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {planFilter.map((plan) => (
            <span key={plan} className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${PLAN_STYLES[plan]}`}>
              {plan}
              <button onClick={() => togglePlanFilter(plan)} className="ml-0.5 opacity-60 hover:opacity-100 transition">✕</button>
            </span>
          ))}
        </div>
      )}

      {/* TABS */}
      <div className="flex gap-6">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2 text-sm transition-all duration-200 border-b-2 ${
              activeTab === tab ? "border-yellow-400 text-yellow-500 font-semibold" : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            {tab}
            <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs font-bold ${
              activeTab === tab ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-400"
            }`}>
              {tab === "All"      ? customers.length : null}
              {tab === "Active"   ? customers.filter((c) => c.active).length : null}
              {tab === "Inactive" ? customers.filter((c) => !c.active).length : null}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
