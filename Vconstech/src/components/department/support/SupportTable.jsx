import { useMemo, useState } from "react";
import DepartmentTicketTable from "../DepartmentTicketTable";
import { API_BASE_URL } from "../../../config/api";

const TICKET_FILTERS = ["All Tickets", "Draft Tickets"];

export default function SupportTable({ tickets = [], setTickets, loading = false, error = "" }) {
  const [activeTicketFilter, setActiveTicketFilter] = useState("All Tickets");

  const visibleTickets = useMemo(() => {
    if (activeTicketFilter === "Saved Tickets") {
      return tickets.filter((ticket) => String(ticket.status || ticket.raw?.state || "").toLowerCase() === "saved");
    }
    if (activeTicketFilter === "Draft Tickets") {
      return tickets.filter((ticket) => String(ticket.status || ticket.raw?.state || "").toLowerCase() === "draft");
    }
    return tickets;
  }, [activeTicketFilter, tickets]);

  const handleDelete = async (id, options = {}) => {
    if (options.alreadyDeleted) {
      setTickets?.((prev) => prev.filter((ticket) => String(ticket.id) !== String(id)));
      return;
    }

    if (!window.confirm("Are you sure you want to delete this ticket?")) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/tickets/${id}`, { method: "DELETE" });
      const result = await res.json();

      if (res.ok && result.success) {
        setTickets?.((prev) => prev.filter((ticket) => String(ticket.id) !== String(id)));
      } else {
        alert("Delete failed: " + (result.error || "Unable to delete ticket."));
      }
    } catch {
      alert("Server error.");
    }
  };

  const handleTicketSaved = (updatedTicket) => {
    setTickets?.((prev) =>
      prev.map((ticket) =>
        String(ticket.id) === String(updatedTicket.id)
          ? {
              ...ticket,
              status: updatedTicket.state === "In Progress" ? "In progress" : updatedTicket.state || ticket.status,
              description: updatedTicket.short_description || ticket.description,
              assignTo: updatedTicket.employee_name || updatedTicket.assigned_to || ticket.assignTo,
              department: updatedTicket.department || ticket.department,
              priority: updatedTicket.urgency || ticket.priority,
              raw: updatedTicket,
            }
          : ticket
      )
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {TICKET_FILTERS.map((filter) => (
         <button
  key={filter}
  type="button"
  onClick={() => setActiveTicketFilter(filter)}
  className={`h-[36px] sm:h-[40px] px-3 sm:px-4 rounded-full border flex items-center gap-1.5 whitespace-nowrap shrink-0 text-[12px] sm:text-sm font-semibold transition-all duration-200 ${
    activeTicketFilter === filter
      ? "bg-[#F5C518] text-black  shadow-sm"
      : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-400"
  }`}
>
            {filter}
            <span className="text-[10px] sm:text-[11px] opacity-70">
              {filter === "All Tickets"
                ? tickets.length
                : tickets.filter((ticket) =>
                    String(ticket.status || ticket.raw?.state || "").toLowerCase() ===
                    (filter === "Saved Tickets" ? "saved" : "draft")
                  ).length}
            </span>
          </button>
        ))}
      </div>

      <DepartmentTicketTable
        tickets={visibleTickets}
        loading={loading}
        error={error}
        onDelete={handleDelete}
        onTicketSaved={handleTicketSaved}
        emptyLabel="No support tickets found"
      />
    </div>
  );
}
