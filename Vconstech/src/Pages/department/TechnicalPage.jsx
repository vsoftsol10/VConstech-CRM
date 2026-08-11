import { useEffect, useMemo, useState } from "react";
import TechnicalTable    from "../../components/department/technical/TechnicalTable";
import { API_BASE_URL } from "../../config/api";
import TechnicalStats from "../../components/department/technical/TechnicalStats"

const mapState = (state) => {
  if (!state) return "Open";
  if (state === "In Progress") return "In progress";
  return state;
};

const normalizeStatus = (status) =>
  String(status || "Open").trim().toLowerCase().replace(/[\s_-]+/g, " ");

const mapTicket = (ticket) => ({
  id: ticket.id,
  ticketNo: ticket.ticket_number || `#${ticket.id}`,
  type: ticket.type === "incident" ? "Incident Ticket" : "Request Ticket",
  clientName: ticket.caller || "-",
  status: mapState(ticket.state),
  description: ticket.short_description || "-",
  assignTo: ticket.employee_name || ticket.assigned_to || "Unassigned",
  date: ticket.created_at?.slice(0, 10) || "-",
  raw: ticket,
});

export default function TechnicalPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/tickets/department/Technical`);
        const json = await res.json();

        if (!res.ok || !json.success) {
          throw new Error(json.error || "Failed to load technical tickets.");
        }

        setTickets((json.data || []).map(mapTicket));
        setError("");
      } catch (err) {
        setError(err.message || "Failed to load technical tickets.");
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, []);

  const stats = useMemo(() => {
    const counts = tickets.reduce(
      (acc, ticket) => {
        const status = normalizeStatus(ticket.status || ticket.raw?.state);

        acc.total += 1;
        if (status === "open") acc.open += 1;
        if (status === "in progress") acc.inProgress += 1;
        if (status === "resolved" || status === "closed") acc.resolvedClosed += 1;

        return acc;
      },
      { total: 0, open: 0, inProgress: 0, resolvedClosed: 0 }
    );

    return [
      { label: "Total Tickets", value: counts.total, sub: "all technical tickets", badge: "+0%", badgeType: "up" },
      { label: "Open Tickets", value: counts.open, sub: "awaiting action", badge: "+0%", badgeType: "up" },
      { label: "In Progress Tickets", value: counts.inProgress, sub: "currently assigned", badge: "+0%", badgeType: "up" },
      { label: "Resolved/Closed Tickets", value: counts.resolvedClosed, sub: "completed tickets", badge: "+0%", badgeType: "up" },
    ];
  }, [tickets]);

  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-[32px] font-bold text-[#111111]">Technical</h1>        
      </div>
      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-500">
          {error}
        </div>
      )}
      <TechnicalStats stats={stats} loading={loading} />

      <TechnicalTable
        tickets={tickets}
        setTickets={setTickets}
        loading={loading}
        error={error}
      />

    </div>
  );
}
