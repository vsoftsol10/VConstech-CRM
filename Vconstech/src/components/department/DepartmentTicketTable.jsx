import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { FiSearch, FiX } from "react-icons/fi";
import ActionDropdown from "../TeamMember/ActionDropdown";
import TicketForm from "../tickets/TicketForm";

const STYLE = `
  @keyframes rowIn {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes dropdownIn {
    from { opacity: 0; transform: translateY(-8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* Main table scroll container: horizontal only. No vertical bounding
     so the table grows naturally with row count. */
  .table-scroll-container {
    scrollbar-gutter: stable;
  }
  .table-scroll-container::-webkit-scrollbar {
    height: 0px; /* hide native horizontal bar; the sticky bar below drives it */
  }

  /* Dedicated horizontal scrollbar, sticky to the bottom of the viewport */
  .bottom-scrollbar {
    scrollbar-width: thin;
    position: sticky;
    bottom: 0;
  }
  .bottom-scrollbar::-webkit-scrollbar {
    height: 10px;
  }
  .bottom-scrollbar::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 8px;
  }
  .bottom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #9ca3af;
  }
  .bottom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
`;

const ROW_OPTIONS = [10, 15, 25, 50, 100];

const statusColors = {
  Open: "bg-blue-100 text-blue-600",
  "In progress": "bg-yellow-100 text-yellow-700",
  "In Progress": "bg-yellow-100 text-yellow-700",
  Resolved: "bg-green-100 text-green-600",
  Closed: "bg-gray-100 text-gray-600",
  Saved: "bg-green-100 text-green-700",
  Draft: "bg-yellow-100 text-yellow-700",
};

const priorityColors = {
  Low: "bg-green-100 text-green-700",
  Medium: "bg-yellow-100 text-yellow-700",
  High: "bg-red-100 text-red-700",
  Critical: "bg-purple-100 text-purple-700",
};

const normalize = (value) => String(value || "").trim();

const getCategory = (ticket) => ticket.category || ticket.raw?.category || "-";
const getPriority = (ticket) => ticket.priority || ticket.raw?.urgency || "Medium";
const getAssignedTo = (ticket) => ticket.assignTo || ticket.raw?.employee_name || ticket.raw?.assigned_to || "Unassigned";

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
    const handleScrollOrResize = () => setPos(getMenuPosition());
    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        anchorRef.current &&
        !anchorRef.current.contains(event.target)
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
      className="fixed z-[9999] w-[240px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl shadow-black/10"
      style={{ top: pos.top, left: pos.left, animation: "dropdownIn 0.18s ease-out" }}
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
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onSelect(option)}
            title={option}
            className={`block w-full truncate px-3 py-2 text-left text-[13px] transition-colors ${
              selected === option ? "bg-yellow-50 text-yellow-700 font-semibold" : "text-gray-700 hover:bg-yellow-50"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>,
    document.body
  );
}

function FilterHeader({ label, active, buttonRef, open, onToggle, children }) {
  return (
    <div className="relative inline-flex items-center gap-2">
      <span>{label}</span>
      <button
        ref={buttonRef}
        type="button"
        onClick={onToggle}
        className={`p-1 rounded-md transition-colors ${
          active ? "bg-yellow-100 text-yellow-700" : "text-gray-500 hover:bg-gray-100"
        }`}
        aria-label={`Filter ${label}`}
        aria-expanded={open}
      >
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <line x1="4" y1="6" x2="20" y2="6" />
          <line x1="8" y1="12" x2="16" y2="12" />
          <line x1="11" y1="18" x2="13" y2="18" />
        </svg>
      </button>
      {children}
    </div>
  );
}

function TicketModal({ ticket, mode, onClose, onSaved, onDeleted }) {
  if (!ticket) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[80] flex items-center justify-center px-3 py-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2 }}
          className="relative h-[92vh] w-full max-w-6xl overflow-hidden rounded-2xl bg-[#f4f4f4] shadow-2xl"
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-gray-400 shadow-sm transition-all hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close ticket modal"
          >
            <FiX size={17} />
          </button>
          <div className="h-full overflow-y-auto">
            <TicketForm
              mode={mode}
              ticketId={ticket.id}
              initialMode={mode}
              inModal
              onClose={onClose}
              onSaved={onSaved}
              onDeleted={onDeleted}
            />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}

export default function DepartmentTicketTable({
  tickets = [],
  loading = false,
  error = "",
  onDelete,
  onTicketSaved,
  emptyLabel = "No tickets found",
}) {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [headerFilterOpen, setHeaderFilterOpen] = useState(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterAssignedTo, setFilterAssignedTo] = useState("");
  const [modalTicket, setModalTicket] = useState(null);
  const [modalMode, setModalMode] = useState("view");

  const statusBtnRef = useRef(null);
  const priorityBtnRef = useRef(null);
  const categoryBtnRef = useRef(null);
  const assignedBtnRef = useRef(null);

  // --- Synced horizontal scrollbar refs/state ---
  const tableScrollRef = useRef(null); // the actual horizontally-scrolling container
  const tableElRef = useRef(null); // the <table> element, used to measure content width
  const bottomScrollRef = useRef(null); // the dedicated sticky horizontal scrollbar
  const isSyncingRef = useRef(false); // guards against feedback loop between the two scroll listeners
  const [scrollWidth, setScrollWidth] = useState(0);

  const statuses = useMemo(
    () => [...new Set(tickets.map((ticket) => ticket.status).filter(Boolean))].sort(),
    [tickets]
  );
  const priorities = useMemo(
    () => [...new Set(tickets.map(getPriority).filter((item) => item && item !== "-"))].sort(),
    [tickets]
  );
  const categories = useMemo(
    () => [...new Set(tickets.map(getCategory).filter((item) => item && item !== "-"))].sort(),
    [tickets]
  );
  const assignees = useMemo(
    () => [...new Set(tickets.map(getAssignedTo).filter((item) => item && item !== "-"))].sort(),
    [tickets]
  );

  const activeFilterCount = [filterStatus, filterPriority, filterCategory, filterAssignedTo].filter(Boolean).length;

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return tickets.filter((ticket) => {
      const haystack = [
        ticket.ticketNo,
        ticket.type,
        ticket.clientName,
        ticket.status,
        getPriority(ticket),
        getCategory(ticket),
        ticket.description,
        getAssignedTo(ticket),
        ticket.date,
      ]
        .map((value) => String(value || "").toLowerCase())
        .join(" ");

      const matchSearch = !term || haystack.includes(term);
      const matchStatus = !filterStatus || normalize(ticket.status) === filterStatus;
      const matchPriority = !filterPriority || normalize(getPriority(ticket)) === filterPriority;
      const matchCategory = !filterCategory || normalize(getCategory(ticket)) === filterCategory;
      const matchAssigned = !filterAssignedTo || normalize(getAssignedTo(ticket)) === filterAssignedTo;

      return matchSearch && matchStatus && matchPriority && matchCategory && matchAssigned;
    });
  }, [tickets, search, filterStatus, filterPriority, filterCategory, filterAssignedTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const paginated = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  // Measure the table's real width so the dedicated scrollbar's inner
  // spacer matches it exactly (keeps the thumb size/proportion correct).
  useLayoutEffect(() => {
    const tableEl = tableElRef.current;
    if (!tableEl || loading || error) return;

    const updateWidth = () => setScrollWidth(tableEl.scrollWidth);
    updateWidth();

    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(tableEl);
    window.addEventListener("resize", updateWidth);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateWidth);
    };
  }, [loading, error, paginated.length, rowsPerPage]);

  // Two-way sync between the table's native horizontal scroll position
  // and the dedicated bottom scrollbar. isSyncingRef prevents the two
  // onScroll handlers from triggering each other in an infinite loop.
  const handleTableScroll = () => {
    if (isSyncingRef.current) {
      isSyncingRef.current = false;
      return;
    }
    if (tableScrollRef.current && bottomScrollRef.current) {
      isSyncingRef.current = true;
      bottomScrollRef.current.scrollLeft = tableScrollRef.current.scrollLeft;
    }
  };

  const handleBottomScroll = () => {
    if (isSyncingRef.current) {
      isSyncingRef.current = false;
      return;
    }
    if (tableScrollRef.current && bottomScrollRef.current) {
      isSyncingRef.current = true;
      tableScrollRef.current.scrollLeft = bottomScrollRef.current.scrollLeft;
    }
  };

  const openTicketModal = (ticket, mode) => {
    setModalTicket(ticket);
    setModalMode(mode);
  };

  const handleSaved = (ticket) => {
    onTicketSaved?.(ticket);
  };

  const handleDeleted = (id) => {
    onDelete?.(id, { alreadyDeleted: true });
    setModalTicket(null);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(Number(event.target.value));
    setCurrentPage(1);
  };

  return (
    <>
      <style>{STYLE}</style>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-visible">
        <div className="p-4 flex flex-col sm:flex-row gap-3 border-b border-gray-100">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-gray-50"
              placeholder="Search tickets..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 px-4 py-3 text-xs">
            <span className="font-semibold text-gray-500">Filters:</span>
            {filterStatus && <span className="rounded-full bg-yellow-50 px-2.5 py-1 font-semibold text-yellow-700">Status: {filterStatus}</span>}
            {filterPriority && <span className="rounded-full bg-yellow-50 px-2.5 py-1 font-semibold text-yellow-700">Priority: {filterPriority}</span>}
            {filterCategory && <span className="rounded-full bg-yellow-50 px-2.5 py-1 font-semibold text-yellow-700">Category: {filterCategory}</span>}
            {filterAssignedTo && <span className="rounded-full bg-yellow-50 px-2.5 py-1 font-semibold text-yellow-700">Assigned: {filterAssignedTo}</span>}
            <button
              type="button"
              onClick={() => {
                setFilterStatus("");
                setFilterPriority("");
                setFilterCategory("");
                setFilterAssignedTo("");
                setCurrentPage(1);
              }}
              className="rounded-full px-2.5 py-1 font-semibold text-red-500 transition-colors hover:bg-red-50"
            >
              Clear
            </button>
          </div>
        )}

        {loading ? (
          <div className="p-5 space-y-3">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="h-12 rounded-xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="py-20 text-center text-red-400 text-sm">{error}</div>
        ) : (
          <>
            <div
              ref={tableScrollRef}
              onScroll={handleTableScroll}
              className="table-scroll-container relative z-0 overflow-x-auto"
            >
              <table ref={tableElRef} className="w-full min-w-[1180px] text-sm">
                <thead className="sticky top-0 z-30">
                  <tr className="bg-gray-50">
                    <th className="px-4 md:px-5 py-2.5 text-left text-[14px] text-black tracking-wide whitespace-nowrap">Ticket No</th>
                    <th className="px-4 md:px-5 py-2.5 text-left text-[14px] text-black tracking-wide whitespace-nowrap">Type</th>
                    <th className="px-4 md:px-5 py-2.5 text-left text-[14px] text-black tracking-wide whitespace-nowrap">Client Name</th>
                    <th className="px-4 md:px-5 py-2.5 text-left text-[14px] text-black tracking-wide whitespace-nowrap">
                      <FilterHeader
                        label="Status"
                        active={filterStatus}
                        buttonRef={statusBtnRef}
                        open={headerFilterOpen === "status"}
                        onToggle={() => setHeaderFilterOpen((open) => (open === "status" ? null : "status"))}
                      >
                        <HeaderFilterMenu
                          anchorRef={statusBtnRef}
                          isOpen={headerFilterOpen === "status"}
                          onClose={() => setHeaderFilterOpen(null)}
                          allLabel="All Statuses"
                          options={statuses}
                          selected={filterStatus}
                          onSelect={(value) => {
                            setFilterStatus(value);
                            setHeaderFilterOpen(null);
                            setCurrentPage(1);
                          }}
                        />
                      </FilterHeader>
                    </th>
                    <th className="px-4 md:px-5 py-2.5 text-left text-[14px] text-black tracking-wide whitespace-nowrap">
                      <FilterHeader
                        label="Priority"
                        active={filterPriority}
                        buttonRef={priorityBtnRef}
                        open={headerFilterOpen === "priority"}
                        onToggle={() => setHeaderFilterOpen((open) => (open === "priority" ? null : "priority"))}
                      >
                        <HeaderFilterMenu
                          anchorRef={priorityBtnRef}
                          isOpen={headerFilterOpen === "priority"}
                          onClose={() => setHeaderFilterOpen(null)}
                          allLabel="All Priorities"
                          options={priorities}
                          selected={filterPriority}
                          onSelect={(value) => {
                            setFilterPriority(value);
                            setHeaderFilterOpen(null);
                            setCurrentPage(1);
                          }}
                        />
                      </FilterHeader>
                    </th>
                    <th className="px-4 md:px-5 py-2.5 text-left text-[14px] text-black tracking-wide whitespace-nowrap">
                      <FilterHeader
                        label="Category"
                        active={filterCategory}
                        buttonRef={categoryBtnRef}
                        open={headerFilterOpen === "category"}
                        onToggle={() => setHeaderFilterOpen((open) => (open === "category" ? null : "category"))}
                      >
                        <HeaderFilterMenu
                          anchorRef={categoryBtnRef}
                          isOpen={headerFilterOpen === "category"}
                          onClose={() => setHeaderFilterOpen(null)}
                          allLabel="All Categories"
                          options={categories}
                          selected={filterCategory}
                          onSelect={(value) => {
                            setFilterCategory(value);
                            setHeaderFilterOpen(null);
                            setCurrentPage(1);
                          }}
                        />
                      </FilterHeader>
                    </th>
                    <th className="px-4 md:px-5 py-2.5 text-left text-[14px] text-black tracking-wide whitespace-nowrap">Description</th>
                    <th className="px-4 md:px-5 py-2.5 text-left text-[14px] text-black tracking-wide whitespace-nowrap">
                      <FilterHeader
                        label="Assigned To"
                        active={filterAssignedTo}
                        buttonRef={assignedBtnRef}
                        open={headerFilterOpen === "assigned"}
                        onToggle={() => setHeaderFilterOpen((open) => (open === "assigned" ? null : "assigned"))}
                      >
                        <HeaderFilterMenu
                          anchorRef={assignedBtnRef}
                          isOpen={headerFilterOpen === "assigned"}
                          onClose={() => setHeaderFilterOpen(null)}
                          allLabel="All Assignees"
                          options={assignees}
                          selected={filterAssignedTo}
                          onSelect={(value) => {
                            setFilterAssignedTo(value);
                            setHeaderFilterOpen(null);
                            setCurrentPage(1);
                          }}
                        />
                      </FilterHeader>
                    </th>
                    <th className="px-4 md:px-5 py-2.5 text-left text-[14px] text-black tracking-wide whitespace-nowrap">Date</th>
                    <th className="px-4 md:px-5 py-2.5 text-left text-[14px] text-black tracking-wide whitespace-nowrap">Action</th>
                  </tr>
                </thead>
                <tbody className="relative z-0">
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center py-12 text-gray-400">
                        <div className="flex flex-col items-center gap-2" style={{ animation: "fadeIn 0.4s ease" }}>
                          <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="text-gray-300">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
                          </svg>
                          <p className="font-medium">{emptyLabel}</p>
                          {(search || activeFilterCount > 0) && <p className="text-xs text-gray-300">Try clearing your search or filters</p>}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginated.map((ticket, index) => (
                      <tr
                        key={ticket.id}
                        className="border-t border-gray-50 hover:bg-yellow-50/40 transition-colors"
                        style={{
                          opacity: 0,
                          animation: "rowIn 0.45s ease forwards",
                          animationDelay: `${index * 60}ms`,
                        }}
                      >
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => openTicketModal(ticket, "view")}
                            className="font-semibold text-[#C89B00] underline"
                          >
                            {ticket.ticketNo}
                          </button>
                        </td>
                        <td className="px-5 py-3.5 text-gray-600 whitespace-nowrap">{ticket.type}</td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-9 h-9 rounded-full ${ticket.avatarBg || "bg-yellow-100"} flex items-center justify-center text-sm font-bold ${ticket.avatarBg ? "text-white" : "text-yellow-600"} shrink-0`}>
                              {ticket.clientAvatar || ticket.clientName?.[0] || "?"}
                            </div>
                            <p className="font-semibold text-gray-800 leading-tight">{ticket.clientName || "-"}</p>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${statusColors[ticket.status] || "bg-gray-100 text-gray-600"}`}>
                            {ticket.status || "Open"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${priorityColors[getPriority(ticket)] || "bg-gray-100 text-gray-600"}`}>
                            {getPriority(ticket)}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-gray-600 whitespace-nowrap">{getCategory(ticket)}</td>
                        <td className="px-5 py-3.5 text-gray-600">
                          <span className="block max-w-[260px] truncate">{ticket.description || "-"}</span>
                        </td>
                        <td className="px-5 py-3.5 text-gray-600 whitespace-nowrap">{getAssignedTo(ticket)}</td>
                        <td className="px-5 py-3.5 text-gray-400 whitespace-nowrap">{ticket.date || "-"}</td>
                        <td className="px-5 py-3.5" onClick={(event) => event.stopPropagation()}>
                          <ActionDropdown
                            onView={() => openTicketModal(ticket, "view")}
                            onEdit={() => openTicketModal(ticket, "edit")}
                            onDelete={() => onDelete?.(ticket.id)}
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Dedicated horizontal scrollbar, sticky to viewport bottom while table is on screen */}
            <div
              ref={bottomScrollRef}
              onScroll={handleBottomScroll}
              className="bottom-scrollbar overflow-x-auto overflow-y-hidden bg-white border-t border-gray-200"
              style={{ height: "14px" }}
              aria-hidden="true"
            >
              <div style={{ width: scrollWidth, height: 1 }} />
            </div>
          </>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-500 text-xs text-gray-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <span>
              Showing {(currentPage - 1) * rowsPerPage + 1} - {Math.min(currentPage * rowsPerPage, filtered.length)} of {filtered.length} ticket{filtered.length !== 1 ? "s" : ""}
            </span>

            <div className="flex items-center gap-2">
              <select
                value={rowsPerPage}
                onChange={handleRowsPerPageChange}
                className="px-3 py-1 border rounded bg-white text-sm outline-none cursor-pointer"
              >
                {ROW_OPTIONS.map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>

              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                className="px-3 py-1 border rounded disabled:opacity-70"
              >
                Previous
              </button>

              <span className="px-3 py-1">{currentPage} / {totalPages}</span>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                className="px-3 py-1 border rounded disabled:opacity-70"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <TicketModal
        ticket={modalTicket}
        mode={modalMode}
        onClose={() => setModalTicket(null)}
        onSaved={handleSaved}
        onDeleted={handleDeleted}
      />
    </>
  );
}
