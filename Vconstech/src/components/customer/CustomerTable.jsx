import { useRef, useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import Toggle from "./Toggle";
import CustomerActionMenu from "./CustomerActionMenu";
import { FiFilter} from "react-icons/fi";

export default function CustomerTable({
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
  currentPage,
  setCurrentPage,
  totalPages,
  totalRecords,
   rowsPerPage,
  setRowsPerPage,
  selectedCustomers,
  setSelectedCustomers,
}) {

  const [contentWidth, setContentWidth] = useState(0);
  const isSyncing = useRef(false);
  
  const [barRect, setBarRect] = useState({ left: 0, width: 0, visible: false });

 
 const [showPlanFilter, setShowPlanFilter] = useState(false);

const handleSelectAll = (e) => {
  const visibleCustomerIds = filteredCustomers.map((c) => c.id);

  if (e.target.checked) {
    setSelectedCustomers((prev) => [...new Set([...prev, ...visibleCustomerIds])]);
  } else {
    setSelectedCustomers((prev) =>
      prev.filter((id) => !visibleCustomerIds.includes(id))
    );
  }
};
useEffect(() => {
  const handleClickOutside = () => {
    setShowPlanFilter(false);
  };

  if (showPlanFilter) {
    window.addEventListener("click", handleClickOutside);
  }

  return () => {
    window.removeEventListener("click", handleClickOutside);
  };
}, [showPlanFilter]);
const handleSelect = (id) => {
  setSelectedCustomers((prev) =>
    prev.includes(id)
      ? prev.filter((item) => item !== id)
      : [...prev, id]
  );
};

const handleRowsPerPageChange = (e) => {
  setRowsPerPage(Number(e.target.value));
  setCurrentPage(1);
};

  const handleWheel = useCallback((e) => {
    if (e.deltaX !== 0 && tableScrollRef.current) {
      tableScrollRef.current.scrollLeft += e.deltaX;
    }
  }, []);

  return (
    <div className="flex flex-col bg-white rounded-2xl border border-gray-200 shadow-sm">

     
    

      <div
        className="hide-native-scrollbar overflow-x-auto overflow-y-hidden"
       
       
        onWheel={handleWheel}
      >
        {/* <div className="min-w-[1300px]"> */}

          <table className="w-full text-sm">

            <thead>
  <tr className="bg-[#f0f0ee]">
    <th className="sticky top-0 z-[5] bg-[#f0f0ee] px-6 py-4 text-start text-[13px] font-semibold text-[#111111]">
  <div className="flex items-center gap-3">
    <input
      type="checkbox"
      checked={
        filteredCustomers.length > 0 &&
        filteredCustomers.every((c) => selectedCustomers.includes(c.id))
      }
      onChange={handleSelectAll}
    />
    <span>Customer ID</span>
  </div>
</th>

    <th className="sticky top-0 z-[5] bg-[#f0f0ee] px-6 py-4 text-start text-[13px] font-semibold text-[#111111]">
      Customer Name
    </th>

    <th className="sticky top-0 z-[5] bg-[#f0f0ee] px-6 py-4 text-start text-[13px] font-semibold text-[#111111]">
      Company
    </th>

    {/* Plan Dropdown */}
   <th className="sticky top-0 z-[5] bg-[#f0f0ee] px-6 py-4 text-start text-[13px] font-semibold text-[#111111] relative">
  <div className="flex items-center gap-2">
    <span>Plan</span>

   <button
  type="button"
  onClick={(e) => {
    e.stopPropagation();
    setShowPlanFilter(!showPlanFilter);
  }}
  className="p-1 rounded hover:bg-gray-200 transition"
>
  <FiFilter
    size={15}
    className={planFilter ? "text-yellow-600" : "text-gray-500"}
  />
</button>
  </div>

  {showPlanFilter && (
    <div className="absolute top-full left-0 mt-2 w-44 rounded-lg border border-gray-200 bg-white shadow-xl z-50">
     

      <button
        onClick={() => {
          togglePlanFilter("Free trial");
          setShowPlanFilter(false);
        }}
        className={`w-full px-4 py-2 text-left hover:bg-yellow-300 ${
          planFilter === "Free Trial" ? "bg-yellow-50 font-semibold" : ""
        }`}
      >
        Free Trial
      </button>

      <button
        onClick={() => {
          togglePlanFilter("Basic");
          setShowPlanFilter(false);
        }}
        className={`w-full px-4 py-2 text-left hover:bg-yellow-300 ${
          planFilter === "Basic" ? "bg-yellow-50 font-semibold" : ""
        }`}
      >
        Basic
      </button>

      <button
        onClick={() => {
          togglePlanFilter("Premium");
          setShowPlanFilter(false);
        }}
        className={`w-full px-4 py-2 text-left hover:bg-yellow-300 ${
          planFilter === "Premium" ? "bg-yellow-50 font-semibold" : ""
        }`}
      >
        Premium
      </button>

      <button
        onClick={() => {
          togglePlanFilter("Advanced");
          setShowPlanFilter(false);
        }}
        className={`w-full px-4 py-2 text-left hover:bg-yellow-300 ${
          planFilter === "Advanced" ? "bg-yellow-50 font-semibold" : ""
        }`}
      >
        Advanced
      </button>
    </div>
  )}
</th>

    <th className="sticky top-0 z-[5] bg-[#f0f0ee] px-6 py-4 text-start text-[13px] font-semibold text-[#111111]">
      Active
    </th>

    <th className="sticky top-0 z-[5] bg-[#f0f0ee] px-6 py-4 text-start text-[13px] font-semibold text-[#111111]">
      Action
    </th>
  </tr>
</thead>

            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr className="border-t border-gray-100">
                  <td colSpan={10} className="py-16 text-center text-gray-400 text-sm">
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c, i) => (
                  <tr
                    key={c.id}
                    className="border-t border-gray-100 hover:bg-[#fffdf3] transition-all duration-200 cursor-pointer"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                   <td className="px-6 py-4">
  <div className="flex items-center gap-3">
    <input
      type="checkbox"
      checked={selectedCustomers.includes(c.id)}
      onChange={() => handleSelect(c.id)}
      onClick={(e) => e.stopPropagation()}
      className="h-4 w-4 cursor-pointer accent-yellow-500"
    />

    <span className="text-xs text-gray-500 font-mono">
      {c.id}
    </span>
  </div>
</td>
                    <td className="px-6 py-5 text-left">
                      <div className="flex items-center justify-start gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-sm font-semibold">
                          {(c.name || "U")[0]}
                        </div>
                        <span className="text-sm font-medium text-[#111111]">{c.name || c.customer_name || "-"}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-gray-600">{c.company || c.company_name || "-"}</td>

                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${c.planColor}`}>
                        {c.plan || c.subscription_plan || "-"}
                      </span>
                    </td>

                   
                    <td className="px-6 py-5 text-center">
                      <div className="flex justify-center">
                        <Toggle active={c.active} onToggle={() => handleToggle(c)} />
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <CustomerActionMenu
                          onView={() => onView(c)}
                          onEdit={() => onEdit(c)}
                          onDelete={() => onDelete(c.id)}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        {/* </div> */}
      </div>

     
    

      <div className="flex items-center justify-between px-6 py-4 border-t">
        <span className="text-sm text-gray-500">
          Showing {totalRecords === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} -
          {Math.min(currentPage * rowsPerPage, totalRecords)}
          {" "}of {totalRecords}
        </span>

        <div className="flex items-center gap-2">
          <select
            value={rowsPerPage}
            onChange={handleRowsPerPageChange}
            className="px-3 py-1 border rounded bg-white text-sm outline-none cursor-pointer"
          >
            {[10, 15, 25, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>

          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Previous
          </button>

          <span className="px-3 py-1">
            {currentPage} / {totalPages}
          </span>

          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
