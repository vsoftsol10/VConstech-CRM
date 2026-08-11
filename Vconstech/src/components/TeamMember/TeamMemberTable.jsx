import { useState, useMemo, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import ActionDropdown from "./ActionDropdown";
import { API_BASE_URL } from "../../config/api";

const API = `${API_BASE_URL}`;

const STATUS_COLOR = {
  Active:     "bg-green-100 text-green-700",
  Inactive:   "bg-red-100 text-red-700",
  "On Leave": "bg-yellow-100 text-yellow-700",
};

function formatDate(raw) {
  if (!raw) return "—";
  return new Date(raw).toLocaleDateString("en-IN", {
    day:   "2-digit",
    month: "short",
    year:  "numeric",
  });
}

function getWorkloadItems(member) {
  const department = String(member.department || "").toLowerCase();
  const counts = {
    Leads: Number(member.lead_count || 0),
    Tasks: Number(member.task_count || 0),
    Tickets: Number(member.ticket_count || 0),
  };

  if (department === "sales") {
    return [
      ["Leads", counts.Leads],
      ["Tasks", counts.Tasks],
    ];
  }
  if (department === "marketing") {
    return [
      ["Leads", counts.Leads],
      ["Tasks", counts.Tasks],
    ];
  }
  if (department === "support") {
    return [
      ["Tasks", counts.Tasks],
      ["Tickets", counts.Tickets],
    ];
  }
  if (department === "technical") {
    return [
      ["Tasks", counts.Tasks],
      ["Tickets", counts.Tickets],
    ];
  }

  return [
    ["Leads", counts.Leads],
    ["Tasks", counts.Tasks],
    ["Tickets", counts.Tickets],
  ];
}

// ── Portal-based header filter menu ─────────────────────────────────────
function HeaderFilterMenu({ anchorRef, isOpen, onClose, allLabel, options, selected, onSelect }) {
  const [pos, setPos] = useState(null);
  const menuRef = useRef(null);
  const menuWidth = 240;
  const viewportGap = 12;

  const getMenuPosition = () => {
    if (!anchorRef.current) return null;
    const rect = anchorRef.current.getBoundingClientRect();
    const maxLeft = window.innerWidth - menuWidth - viewportGap;

    return {
      top: rect.bottom + 6,
      left: Math.max(viewportGap, Math.min(rect.left, maxLeft)),
    };
  };

  useLayoutEffect(() => {
    if (!isOpen || !anchorRef.current) return;
    setPos(getMenuPosition());
  }, [isOpen, anchorRef]);

  useEffect(() => {
    if (!isOpen) return;
    const handleScrollOrResize = () => {
      setPos(getMenuPosition());
    };
    const handleClickOutside = (e) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target) &&
        anchorRef.current && !anchorRef.current.contains(e.target)
      ) {
        onClose();
      }
    };
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, anchorRef, onClose]);

  if (!isOpen || !pos) return null;

  return createPortal(
    <div
      ref={menuRef}
      className="fixed z-[999] w-[240px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl shadow-black/10"
      style={{
        top: pos.top,
        left: pos.left,
        animation: "dropdownIn 0.18s ease-out",
      }}
    >
      <div className="max-h-[240px] overflow-y-auto py-1">
        <button
          type="button"
          onClick={() => onSelect("")}
          title={allLabel}
          className={`block w-full truncate px-3 py-2 text-left text-[13px] transition-colors ${
            !selected ? "bg-yellow-50 text-yellow-700 font-semibold" : "text-gray-700 hover:bg-yellow-50"
          }`}
        >
          {allLabel}
        </button>
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onSelect(opt)}
            title={opt}
            className={`block w-full truncate px-3 py-2 text-left text-[13px] transition-colors ${
              selected === opt ? "bg-yellow-50 text-yellow-700 font-semibold" : "text-gray-700 hover:bg-yellow-50"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>,
    document.body
  );
}

// ── Keyframes injected once ─────────────────────────────────────────────
const STYLE = `
  @keyframes rowIn {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0);    }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes dropdownIn {
    from { opacity: 0; transform: translateY(-8px); }
    to   { opacity: 1; transform: translateY(0);     }
  }
`;

export default function TeamMemberTable({ members, onEdit, onView, onDelete }) {
  const [search,      setSearch]      = useState("");
  const [activeTab,   setActiveTab]   = useState("All");
  const [filterDate,  setFilterDate]  = useState("");
  const [filterRole,  setFilterRole]  = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [headerFilterOpen, setHeaderFilterOpen] = useState(null);
  const [roleOpen, setRoleOpen] = useState(false);
  const filterRef = useRef(null);
  const headerFilterRef = useRef(null);
  const departmentBtnRef = useRef(null);
  const roleBtnRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target))
        setShowFilters(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Filtered members based on search, tab, and department/date filters ──
  const departmentFiltered = useMemo(() => {
    return members.filter((m) => {
      const matchSearch =
        !search ||
        m.name?.toLowerCase().includes(search.toLowerCase()) ||
        m.role?.toLowerCase().includes(search.toLowerCase()) ||
        m.employee_id?.toLowerCase().includes(search.toLowerCase());

      const matchTab = activeTab === "All" || m.department === activeTab;
      const matchDepartment = !filterDepartment || m.department === filterDepartment;
      const matchDate = !filterDate || m.date_joined?.startsWith(filterDate);

      return matchSearch && matchTab && matchDepartment && matchDate;
    });
  }, [members, search, activeTab, filterDate, filterDepartment]);

  // ── Dynamic roles based on department-filtered data ──
  const roles = useMemo(() => {
    return [...new Set(
      departmentFiltered
        .map((m) => m.role)
        .filter((role) => role && role.trim() !== "")
    )].sort();
  }, [departmentFiltered]);

  // ── Dynamic departments based on search and tab ──
  const departments = useMemo(() => {
    return [...new Set(
      members
        .filter((m) => {
          const matchSearch =
            !search ||
            m.name?.toLowerCase().includes(search.toLowerCase()) ||
            m.role?.toLowerCase().includes(search.toLowerCase()) ||
            m.employee_id?.toLowerCase().includes(search.toLowerCase());

          const matchTab = activeTab === "All" || m.department === activeTab;
          return matchSearch && matchTab;
        })
        .map((m) => m.department)
        .filter((dept) => dept && dept.trim() !== "")
    )].sort();
  }, [members, search, activeTab]);

  // ── Final filtered data (includes role filter) ──
  const filtered = useMemo(() => {
    return departmentFiltered.filter((m) => {
      const matchRole = !filterRole || m.role === filterRole;
      return matchRole;
    });
  }, [departmentFiltered, filterRole]);

  const tabs  = ["All", "Marketing", "Sales", "Support", "Technical"];
  const activeFilterCount = [filterRole, filterDate, filterDepartment].filter(Boolean).length;

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const paginated = filtered.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // ── Clear role filter if it doesn't exist in new roles list ──
  useEffect(() => {
    if (filterRole && !roles.includes(filterRole)) {
      setFilterRole("");
      setCurrentPage(1);
    }
  }, [roles, filterRole]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setFilterRole("");
    setFilterDepartment("");
    setCurrentPage(1);
  };

  const handleRowsPerPageChange = (e) => {
    setRowsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

// ...existing code...

  return (
    <>
      {/* ── Inject keyframes once ─────────────────────────────────────────── */}
      <style>{STYLE}</style>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-visible">

        {/* ── Controls ─────────────────────────────────────────────────────── */}
        <div className="p-4 flex flex-col sm:flex-row gap-3 border-b border-gray-100">

          {/* Search */}
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              className=" w-[800px] pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-gray-50"
              placeholder="Search by name, role or ID..."
              value={search}
              onChange={handleSearchChange}
            />
          </div>

          {/* Filter button + dropdown */}
          <div className="relative" ref={filterRef}>
        

            {showFilters && (
              <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-[220px] bg-white border border-gray-200 rounded-2xl shadow-lg p-4 flex flex-col gap-3">
                <div className="flex flex-col gap-1 relative">
                  <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    Role
                  </label>

                  {/* Select Button */}
                  <button
                    type="button"
                    onClick={() => setRoleOpen(!roleOpen)}
                    className="w-full h-10 rounded-xl border border-gray-200 bg-white px-3 flex items-center justify-between text-sm text-gray-700 hover:border-[#F5C518] focus:border-[#F5C518] focus:ring-2 focus:ring-yellow-100 transition-all"
                  >
                    <span className={filterRole ? "text-gray-700" : "text-gray-400"}>
                      {filterRole || "All roles"}
                    </span>

                    <svg
                      className={`w-4 h-4 text-yellow-500 transition-transform duration-200 ${
                        roleOpen ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      viewBox="0 0 24 24"
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>

                  {/* Dropdown */}
                  {roleOpen && (
                    <div className="absolute left-0 top-full mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">

                      {/* All Roles */}
                      <button
                        type="button"
                        onClick={() => {
                          setFilterRole("");
                          setRoleOpen(false);
                          setCurrentPage(1);
                        }}
                        className={`w-full px-4 py-2.5 text-left text-sm transition-colors
                        ${
                          filterRole === ""
                            ? "bg-yellow-50 text-yellow-700 font-semibold"
                            : "hover:bg-yellow-50 text-gray-700"
                        }`}
                      >
                        All roles
                      </button>

                      {roles.map((role) => (
                        <button
                          key={role}
                          type="button"
                          onClick={() => {
                            setFilterRole(role);
                            setRoleOpen(false);
                            setCurrentPage(1);
                          }}
                          className={`w-full px-4 py-2.5 text-left text-sm transition-colors
                          ${
                            filterRole === role
                              ? "bg-yellow-50 text-yellow-700 font-semibold"
                              : "hover:bg-yellow-50 text-gray-700"
                          }`}
                        >
                          {role}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Clear filters */}
                {activeFilterCount > 0 && (
                  <>
                    <div className="border-t border-gray-100" />
                    <button
                      onClick={() => { setFilterRole(""); setFilterDate(""); setFilterDepartment(""); setCurrentPage(1); }}
                      className="text-[12px] font-semibold text-red-400 hover:bg-red-50 rounded-xl px-2 py-1.5 text-left transition-all duration-200"
                    >
                      Clear filters
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Active Filters Display ─────────────────────────────────────── */}
        {(filterDepartment || filterRole) && (
          <div className="px-4 py-3 flex flex-wrap items-center gap-2 border-b border-gray-100 bg-yellow-50/30">
            <span className="text-[12px] font-semibold text-gray-600 uppercase tracking-wide">Active:</span>
            
            {filterDepartment && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-yellow-100 border border-yellow-300 rounded-full">
                <span className="text-[12px] font-semibold text-yellow-700">Department:</span>
                <span className="text-[12px] font-bold text-yellow-800">{filterDepartment}</span>
                <button
                  onClick={() => {
                    setFilterDepartment("");
                    setFilterRole("");
                    setCurrentPage(1);
                  }}
                  className="ml-1 text-yellow-600 hover:text-yellow-800 transition-colors"
                  title="Remove department filter"
                >
                  <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            )}

            {filterRole && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 border border-blue-300 rounded-full">
                <span className="text-[12px] font-semibold text-blue-700">Role:</span>
                <span className="text-[12px] font-bold text-blue-800">{filterRole}</span>
                <button
                  onClick={() => {
                    setFilterRole("");
                    setCurrentPage(1);
                  }}
                  className="ml-1 text-blue-600 hover:text-blue-800 transition-colors"
                  title="Remove role filter"
                >
                  <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            )}

            {activeFilterCount > 0 && (
              <button
                onClick={() => { setFilterRole(""); setFilterDate(""); setFilterDepartment(""); setCurrentPage(1); }}
                className="ml-auto text-[11px] font-semibold text-red-500 hover:text-red-700 hover:bg-red-50 px-2.5 py-1 rounded-lg transition-all duration-200"
              >
                Clear All
              </button>
            )}
          </div>
        )}

        {/* ── Tabs ─────────────────────────────────────────────────────────── */}
        <div className="px-4 pt-3 flex items-center gap-2 overflow-x-auto border-b border-gray-100 pb-3" style={{ scrollbarWidth: "none" }}>
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`h-[36px] sm:h-[40px] px-3 sm:px-4 rounded-full border flex items-center whitespace-nowrap shrink-0 text-[12px] sm:text-sm font-semibold transition-all duration-200 ${
                activeTab === tab
                  ? "bg-[#F5C518] border-[#F5C518] text-black shadow-sm"
                  : "bg-white border-gray-200 text-gray-600 hover:bg-[#FFFBF0] hover:border-[#F5C518]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ── Table ────────────────────────────────────────────────────────── */}
        <div className="relative z-0 overflow-x-auto overflow-y-visible" ref={headerFilterRef}>
          <table className="w-full text-sm">
            <thead className="relative z-30">
              <tr className="bg-gray-50">
                <th className="px-4 md:px-5 py-2.5 text-left text-[14px] text-black font-semibold tracking-wide whitespace-nowrap">
                  Team Member
                </th>

                {/* Department column */}
                <th className="px-4 md:px-5 py-2.5 text-left text-[14px] font-semibold text-black tracking-wide whitespace-nowrap">
                  <div className="relative inline-flex items-center gap-2">
                    <span>Department</span>
                    <button
                      ref={departmentBtnRef}
                      type="button"
                      onClick={() => setHeaderFilterOpen((open) => open === "department" ? null : "department")}
                      className={`p-1 rounded-md transition-colors ${
                        filterDepartment ? "bg-yellow-100 text-yellow-700" : "text-gray-500 hover:bg-gray-100"
                      }`}
                    >
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <line x1="4" y1="6" x2="20" y2="6" />
                        <line x1="8" y1="12" x2="16" y2="12" />
                        <line x1="11" y1="18" x2="13" y2="18" />
                      </svg>
                    </button>

                    <HeaderFilterMenu
                      anchorRef={departmentBtnRef}
                      isOpen={headerFilterOpen === "department"}
                      onClose={() => setHeaderFilterOpen(null)}
                      allLabel="All Departments"
                      options={departments}
                      selected={filterDepartment}
                      onSelect={(value) => {
                        setFilterDepartment(value);
                        setFilterRole("");
                        setHeaderFilterOpen(null);
                        setCurrentPage(1);
                      }}
                    />
                  </div>
                </th>

                {/* Role column */}
                <th className="px-4 md:px-5 py-2.5 text-left text-[14px] font-semibold text-black tracking-wide whitespace-nowrap">
                  <div className="relative inline-flex items-center gap-2">
                    <span>Role</span>
                    <button
                      ref={roleBtnRef}
                      type="button"
                      onClick={() => setHeaderFilterOpen((open) => open === "role" ? null : "role")}
                      className={`p-1 rounded-md transition-colors ${
                        filterRole ? "bg-yellow-100 text-yellow-700" : "text-gray-500 hover:bg-gray-100"
                      }`}
                    >
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <line x1="4" y1="6" x2="20" y2="6" />
                        <line x1="8" y1="12" x2="16" y2="12" />
                        <line x1="11" y1="18" x2="13" y2="18" />
                      </svg>
                    </button>

                    <HeaderFilterMenu
                      anchorRef={roleBtnRef}
                      isOpen={headerFilterOpen === "role"}
                      onClose={() => setHeaderFilterOpen(null)}
                      allLabel="All Roles"
                      options={roles}
                      selected={filterRole}
                      onSelect={(value) => {
                        setFilterRole(value);
                        setHeaderFilterOpen(null);
                        setCurrentPage(1);
                      }}
                    />
                  </div>
                </th>

                <th className="px-4 md:px-5 py-2.5 text-left text-[14px] font-semibold text-black tracking-wide whitespace-nowrap">
                  Workload
                </th>
                <th className="px-4 md:px-5 py-2.5 text-left text-[14px] font-semibold text-black tracking-wide whitespace-nowrap">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="relative z-0">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400">
                    <div
                      className="flex flex-col items-center gap-2"
                      style={{ animation: "fadeIn 0.4s ease" }}
                    >
                      <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="text-gray-300">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                      <p className="font-medium">No members found</p>
                      {(search || activeFilterCount > 0) && (
                        <p className="text-xs text-gray-300">Try clearing your search or filters</p>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map((m, i) => {
                  const workloadItems = getWorkloadItems(m);
                  const totalWorkload = workloadItems.reduce((sum, [, count]) => sum + count, 0);

                  return (
                    <tr
                      key={m.id}
                      className="border-t border-gray-50 hover:bg-yellow-50/40 transition-colors"
                      style={{
                        opacity: 0,
                        animation: "rowIn 0.45s ease forwards",
                        animationDelay: `${i * 60}ms`,
                      }}
                    >
                      {/* ── Avatar + Name + ID ──────────────────────────── */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          {m.profile_image ? (
                            <img
                              src={`${API}/uploads/${m.profile_image}`}
                              alt={m.name}
                              className="w-9 h-9 rounded-full object-cover shrink-0 border border-gray-200"
                              onError={(e) => {
                                e.target.style.display = "none";
                                e.target.nextSibling.style.display = "flex";
                              }}
                            />
                          ) : null}

                          <div
                            className="w-9 h-9 rounded-full bg-yellow-100 flex items-center justify-center text-sm font-bold text-yellow-600 shrink-0"
                            style={{ display: m.profile_image ? "none" : "flex" }}
                          >
                            {m.name?.[0]?.toUpperCase()}
                          </div>

                          <div>
                            <p className="font-semibold text-gray-800 leading-tight">{m.name}</p>
                            <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                              {m.employee_id || "—"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-gray-600 whitespace-nowrap">{m.department || "—"}</td>
                      <td className="px-5 py-3.5 text-gray-600 whitespace-nowrap">{m.role || "—"}</td>

                      {/* ── Workload ─────────────────────────────────────── */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[11px] font-bold uppercase tracking-wide text-gray-400">
                            Workload: {totalWorkload}
                          </span>
                          <div className="flex flex-wrap gap-1.5 max-w-[230px]">
                            {workloadItems.map(([label, count]) => (
                              <span
                                key={label}
                                className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-gray-700"
                              >
                                {label}: {count}
                              </span>
                            ))}
                          </div>
                        </div>
                      </td>

                      {/* ── Action ───────────────────────────────────────── */}
                      <td className="px-5 py-3.5">
                        <ActionDropdown
                          onView={() => onView(m)}
                          onEdit={() => onEdit(m)}
                          onDelete={() => onDelete(m.id)}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Footer count ─────────────────────────────────────────────────── */}
        {filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-500 text-xs text-gray-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <span>
              Showing {(currentPage - 1) * rowsPerPage + 1} - {Math.min(currentPage * rowsPerPage, filtered.length)} of {filtered.length} member{filtered.length !== 1 ? "s" : ""}
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
                className="px-3 py-1 border rounded disabled:opacity-70"
              >
                Previous
              </button>

              <span className="px-3 py-1">
                {currentPage} / {totalPages}
              </span>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
                className="px-3 py-1 border rounded disabled:opacity-70"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );

}