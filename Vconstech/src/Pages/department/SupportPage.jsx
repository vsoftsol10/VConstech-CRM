import { useEffect, useMemo, useState } from "react";
import SupportStats from "../../components/department/support/SupportStats";
import SupportTable from "../../components/department/support/SupportTable";
import { API_BASE_URL } from "../../config/api";

const mapState = (state) => {
  if (!state) return "Open";
  if (state === "In Progress") return "In progress";
  return state;
};

const avatarColors = [
  "bg-blue-500", "bg-green-500", "bg-purple-500",
  "bg-pink-500", "bg-orange-500", "bg-teal-500",
];

const getAvatarColor = (name = "") => {
  const index = (String(name).charCodeAt(0) || 0) % avatarColors.length;
  return avatarColors[index];
};

const mapTicket = (ticket) => {
  const caller = ticket.caller || "-";
  const department = ticket.department || "Unassigned";

  return {
    id: ticket.id,
    ticketNo: ticket.ticket_number || `#${ticket.id}`,
    type: ticket.type === "incident" ? "Incident Ticket" : "Request Ticket",
    clientName: caller,
    clientAvatar: caller === "-" ? "?" : caller[0].toUpperCase(),
    avatarBg: getAvatarColor(caller),
    status: mapState(ticket.state),
    description: ticket.short_description || "-",
    assignTo: ticket.employee_name || ticket.assigned_to || "Unassigned",
    department,
    priority: ticket.urgency || "Medium",
    date: ticket.created_at?.slice(0, 10) || "-",
    raw: ticket,
  };
};

export default function SupportPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSupportTickets = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/tickets`);
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || "Failed to load tickets.");
        }
        setTickets((json.data || []).map(mapTicket));
        setError("");
      } catch (err) {
        setError(err.message || "Failed to load tickets.");
      } finally {
        setLoading(false);
      }
    };

    fetchSupportTickets();
  }, []);

  const stats = useMemo(() => {
    const total = tickets.length;
    const incidents = tickets.filter((t) => t.type === "Incident Ticket").length;
    const requests = total - incidents;
    const breach = tickets.filter((t) => String(t.raw?.urgency || "").toLowerCase() === "high").length;

    return [
      { label: "Total Ticket", value: total, sub: "all tickets", subColor: "text-gray-500", badge: "+0%", badgeColor: "bg-green-100 text-green-600" },
      { label: "Incident Ticket", value: incidents, sub: "incident tickets", subColor: "text-gray-500", badge: "+0%", badgeColor: "bg-green-100 text-green-600" },
      { label: "Request Ticket", value: requests, sub: "request tickets", subColor: "text-gray-500", badge: "+0%", badgeColor: "bg-green-100 text-green-600" },
      { label: "Breach", value: breach, sub: "high urgency", subColor: "text-gray-500", badge: "-0%", badgeColor: "bg-red-100 text-red-500" },
    ];
  }, [tickets]);

  return (
    <div className="space-y-6">

      {/* Title — same pattern as Technical & Marketing */}
      <div>
        <h1 className="text-[32px] font-bold text-[#111111]">Support</h1>        
      </div>

      <SupportStats stats={stats} loading={loading} />

      <SupportTable
        tickets={tickets}
        setTickets={setTickets}
        loading={loading}
        error={error}
      />

    </div>
  );
}
