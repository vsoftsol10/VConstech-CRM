import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiEdit2,
  FiEye,
  FiFilter,
  FiMoreVertical,
  FiRefreshCw,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import { API_BASE_URL } from "../../config/api";
import AssignTaskForm from "../TeamMember/AssignTaskForm";
import TicketHistoryDrawer from "../tickets/TicketHistoryDrawer";

const API = `${API_BASE_URL}`;
const STATUS_OPTIONS = ["Open", "In Progress", "Resolved", "Closed"];

const PRIORITY_COLORS = {
  Low: { bg: "#f0fdf4", text: "#16a34a" },
  Medium: { bg: "#fffbe6", text: "#b8900a" },
  High: { bg: "#fef2f2", text: "#dc2626" },
  Critical: { bg: "#fdf4ff", text: "#9333ea" },
};

function getInitials(name = "") {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");
}

function formatDate(value) {
  if (!value) return "No due date";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getEmployeeName(employee) {
  return employee?.name || employee?.full_name || "Employee";
}

function StatPill({ label, value, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 shadow-sm flex items-center gap-3">
      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-lg font-bold text-gray-800">{value}</span>
      <span className="text-xs text-gray-400">{label}</span>
    </div>
  );
}

function FilterButton({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`h-9 px-4 rounded-xl text-sm font-semibold border transition-colors ${
        active
          ? "bg-[#F5C518] border-[#F5C518] text-black"
          : "bg-white border-gray-200 text-gray-500 hover:bg-[#FFFBF0]"
      }`}
    >
      {children}
    </button>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="rounded-xl bg-gray-50 px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-1 text-sm font-medium text-gray-800 break-words">{value || "-"}</p>
    </div>
  );
}

function TaskDetailsModal({ task, employee, onClose }) {
  const [updates, setUpdates] = useState([]);
  const [updatesLoading, setUpdatesLoading] = useState(false);
  const [updatesError, setUpdatesError] = useState("");

  useEffect(() => {
    if (!task?.id) return;

    const loadUpdates = async () => {
      setUpdatesLoading(true);
      setUpdatesError("");
      try {
        const response = await axios.get(`${API}/api/tasks/${task.id}/updates`, {
          params: { employee_id: employee?.employee_id || employee?.id || task.assigned_to },
        });
        setUpdates(response.data?.data || response.data || []);
      } catch (err) {
        setUpdatesError(err.response?.data?.message || "Failed to load task updates.");
      } finally {
        setUpdatesLoading(false);
      }
    };

    loadUpdates();
  }, [task?.id, task?.assigned_to, employee?.employee_id, employee?.id]);

  if (!task) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b px-6 py-5">
          <div>
            <p className="text-xs font-mono text-[#b8900a]">TASK-{task.id}</p>
            <h2 className="mt-1 text-xl font-bold text-gray-900">
              {task.title || task.task_title || "Untitled task"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close task details"
          >
            <FiX />
          </button>
        </div>

        <div className="max-h-[calc(90vh-86px)] overflow-y-auto px-6 py-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <DetailRow label="Status" value={task.status || "Open"} />
            <DetailRow label="Priority" value={task.priority || "Medium"} />
            <DetailRow label="Due Date" value={formatDate(task.due_date || task.date)} />
            <DetailRow label="Assigned To" value={task.employee_name || task.assigned_to_name || task.assigned_to} />
            <DetailRow label="Created At" value={formatDate(task.created_at)} />
            <DetailRow label="Updated At" value={formatDate(task.updated_at)} />
          </div>

          <div className="mt-4 rounded-xl bg-gray-50 px-3 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Description</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">
              {task.description || "No description"}
            </p>
          </div>

          <div className="mt-4 rounded-xl border border-gray-100 bg-white p-4">
            <h3 className="text-sm font-bold text-gray-900">Task Updates</h3>
            <p className="mt-1 text-xs text-gray-400">Work notes for this task.</p>

            {updatesError && <p className="mt-3 text-xs font-medium text-red-500">{updatesError}</p>}

            <div className="mt-3">
              {updatesLoading ? (
                <div className="rounded-xl border border-dashed border-gray-200 p-4 text-center text-sm text-gray-400">
                  Loading task updates...
                </div>
              ) : updates.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 p-4 text-center text-sm text-gray-400">
                  No work notes yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {updates.map((item) => (
                    <div key={item.id || item.created_at} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-bold text-gray-800">
                          {item.employee_name || item.employee_id || "Employee"}
                        </p>
                        <p className="text-xs text-gray-400">{formatDateTime(item.created_at)}</p>
                      </div>
                      <p className="whitespace-pre-wrap text-sm leading-5 text-gray-700">{item.work_note || item.note}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TicketDetailsModal({ ticket, onClose }) {
  if (!ticket) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b px-6 py-5">
          <div>
            <p className="text-xs font-mono text-[#b8900a]">
              {ticket.ticket_number || `TICKET-${ticket.id}`}
            </p>
            <h2 className="mt-1 text-xl font-bold text-gray-900">
              {ticket.short_description || "Untitled ticket"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close ticket details"
          >
            <FiX />
          </button>
        </div>

        <div className="max-h-[calc(90vh-86px)] overflow-y-auto px-6 py-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <DetailRow label="Status" value={ticket.state || "Open"} />
            <DetailRow label="Urgency" value={ticket.urgency || "Medium"} />
            <DetailRow label="Category" value={ticket.category} />
            <DetailRow label="Caller" value={ticket.caller} />
            <DetailRow label="Contact Type" value={ticket.contact_type} />
            <DetailRow label="Location" value={ticket.location} />
            <DetailRow label="Department" value={ticket.department} />
            <DetailRow label="Assigned To" value={ticket.employee_name || ticket.assigned_to_name || ticket.assigned_to} />
            <DetailRow label="Due Date" value={formatDate(ticket.due_date)} />
            <DetailRow label="Created At" value={formatDate(ticket.created_at)} />
            <DetailRow label="Updated At" value={formatDate(ticket.updated_at)} />
            <DetailRow label="Resolved At" value={formatDate(ticket.resolved_at)} />
          </div>

          <div className="mt-4 rounded-xl bg-gray-50 px-3 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Notes</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">
              {ticket.notes || "No notes"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AssignmentCard({
  item,
  kind,
  highlighted,
  onViewTicket,
  onOpenHistory,
  onDeleteTicket,
  onViewTask,
  onEditTask,
  onDeleteTask,
}) {
  const isTicket = kind === "ticket";
  const title = isTicket ? item.short_description : item.title || item.task_title;
  const status = isTicket ? item.state : item.status || "Open";
  const priority = isTicket ? item.urgency : item.priority;
  const number = isTicket ? item.ticket_number || `TICKET-${item.id}` : `TASK-${item.id}`;
  const dueDate = item.due_date || item.date;
  const colors = PRIORITY_COLORS[priority] || PRIORITY_COLORS.Medium;
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      className={`relative bg-white rounded-2xl border shadow-sm p-4 transition-all ${
        highlighted ? "border-[#F5C518] ring-2 ring-[#F5C518]/30" : "border-gray-100"
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <span className="inline-flex text-xs font-mono text-[#b8900a] bg-[#fffbe6] px-2 py-1 rounded-lg border border-[#F5C518]/40">
            {number}
          </span>
          <h3 className="mt-3 text-sm font-bold text-gray-800 leading-snug">{title || "Untitled assignment"}</h3>
        </div>
        <div className="flex items-start gap-2">
          <span
            className="text-xs font-semibold px-2 py-1 rounded-lg shrink-0"
            style={{ background: colors.bg, color: colors.text }}
          >
            {priority || "Medium"}
          </span>

          {!isTicket && (
          <div className="relative">
            <button
              onClick={() => setMenuOpen((current) => !current)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              aria-label={`${isTicket ? "Ticket" : "Task"} actions`}
            >
              <FiMoreVertical />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-9 z-30 w-36 overflow-hidden rounded-xl border bg-white py-1 shadow-lg">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    isTicket ? onViewTicket(item) : onViewTask(item);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  <FiEye className="text-gray-400" /> View
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    isTicket ? onEditTicket(item) : onEditTask(item);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  <FiEdit2 className="text-gray-400" /> Edit
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    isTicket ? onDeleteTicket(item) : onDeleteTask(item);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                >
                  <FiTrash2 /> Delete
                </button>
              </div>
            )}
          </div>
          )}
        </div>
      </div>

      <p className="text-xs text-gray-400 line-clamp-2 mb-4">
        {isTicket ? item.notes || item.caller || "No ticket notes" : item.description || "No task description"}
      </p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-[#fafafa] rounded-xl px-3 py-2">
          <p className="text-[11px] text-gray-400 mb-1">Type</p>
          <p className="text-xs font-semibold text-gray-700">{isTicket ? "Ticket" : "Task"}</p>
        </div>
        <div className="bg-[#fafafa] rounded-xl px-3 py-2">
          <p className="text-[11px] text-gray-400 mb-1">Due</p>
          <p className="text-xs font-semibold text-gray-700 flex items-center gap-1">
            <FiCalendar className="text-[#F5C518]" /> {formatDate(dueDate)}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
          <FiClock className="text-[#F5C518]" /> {status}
        </span>
        {isTicket && (
          <button
            type="button"
            onClick={() => onOpenHistory(item)}
            className="h-9 rounded-xl border border-[#F5C518] px-4 text-xs font-bold text-gray-700 transition-colors hover:bg-[#F5C518] hover:text-black"
          >
            Action
          </button>
        )}
      </div>
    </div>
  );
}

export default function TicketPage() {
  const [employee, setEmployee] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [ticketFilter, setTicketFilter] = useState("All");
  const [taskFilter, setTaskFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewTicket, setViewTicket] = useState(null);
  const [viewTask, setViewTask] = useState(null);
  const [editTask, setEditTask] = useState(null);
  const [historyTicket, setHistoryTicket] = useState(null);
  const [workspaceView, setWorkspaceView] = useState(() =>
    new URLSearchParams(window.location.search).get("task") ? "tasks" : "tickets"
  );

  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const highlightedTicket = params.get("ticket");
  const highlightedTask = params.get("task");

  const loadWorkspace = async (emp) => {
    setLoading(true);
    setError("");
    try {
      const [ticketRes, taskRes] = await Promise.all([
        axios.get(`${API}/api/tickets`, { params: { assigned_to: emp.employee_id } }),
        axios.get(`${API}/api/tasks`, { params: { assigned_to: emp.employee_id } }),
      ]);

      setTickets(ticketRes.data?.data || ticketRes.data || []);
      setTasks(taskRes.data?.data || taskRes.data || []);
    } catch (err) {
      setError(err?.response?.data?.error || err?.response?.data?.message || "Unable to load workspace.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem("employee");
    if (!stored) {
      setLoading(false);
      return;
    }

    try {
      const emp = JSON.parse(stored);
      setEmployee(emp);
      loadWorkspace(emp);
    } catch {
      setLoading(false);
    }
  }, []);

  const filteredTickets = useMemo(
    () => (ticketFilter === "All" ? tickets : tickets.filter((ticket) => ticket.state === ticketFilter)),
    [ticketFilter, tickets]
  );

  const filteredTasks = useMemo(
    () => (taskFilter === "All" ? tasks : tasks.filter((task) => (task.status || "Open") === taskFilter)),
    [taskFilter, tasks]
  );

  const deleteTask = async (task) => {
    const confirmed = window.confirm(
      `Delete TASK-${task.id}? This task will be removed permanently.`
    );

    if (!confirmed) return;

    try {
      await axios.delete(`${API}/api/tasks/${task.id}`);
      setTasks((prev) => prev.filter((item) => item.id !== task.id));
      alert("Task deleted successfully.");
    } catch (err) {
      alert(err?.response?.data?.message || err?.response?.data?.error || "Failed to delete task.");
    }
  };

  const deleteTicket = async (ticket) => {
    const confirmed = window.confirm(
      `Delete ${ticket.ticket_number || `TICKET-${ticket.id}`}? This ticket will be removed permanently.`
    );

    if (!confirmed) return;

    try {
      await axios.delete(`${API}/api/tickets/${ticket.id}`);
      setTickets((prev) => prev.filter((item) => item.id !== ticket.id));
      alert("Ticket deleted successfully.");
    } catch (err) {
      alert(err?.response?.data?.message || err?.response?.data?.error || "Failed to delete ticket.");
    }
  };

  const handleTicketStatusUpdated = (updatedTicket) => {
    setTickets((prev) =>
      prev.map((ticket) =>
        String(ticket.id) === String(updatedTicket.id) ? { ...ticket, ...updatedTicket } : ticket
      )
    );
    setHistoryTicket((current) =>
      current && String(current.id) === String(updatedTicket.id)
        ? { ...current, ...updatedTicket }
        : current
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-[#F5C518] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!employee) {
    return <div className="flex items-center justify-center min-h-screen text-gray-400 text-sm">Please log in.</div>;
  }

 const employeeName = employee?.name || employee?.full_name || "Employee";
const avatar =
  employee?.profile_image
    ? `${API}/uploads/${employee.profile_image}`
    : null;
  return (
    <div className="min-h-screen bg-[#f7f7f5] p-4 md:p-6 font-sans">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col md:flex-row md:items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-[#F5C518]/40 shrink-0">
          {avatar ? (
            <img src={avatar} alt={employeeName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#F5C518] to-yellow-300 flex items-center justify-center text-xl font-bold text-black">
              {getInitials(employeeName)}
            </div>
          )}
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-gray-800">Workspace</h2>
          <p className="text-sm text-gray-500">
            {employeeName} · {employee.department} · {employee.designation || employee.role || "Employee"}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <StatPill label="Tickets" value={tickets.length} color="#3b82f6" />
          <StatPill label="Tasks" value={tasks.length} color="#F5C518" />
          <button
            onClick={() => loadWorkspace(employee)}
            className="bg-white rounded-xl border border-gray-100 px-4 py-3 shadow-sm flex items-center gap-2 text-xs font-semibold text-gray-600 hover:bg-[#FFFBF0]"
          >
            <FiRefreshCw /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="inline-flex w-full rounded-xl border border-gray-200 bg-white p-1 shadow-sm md:w-auto">
          <button
            onClick={() => setWorkspaceView("tickets")}
            className={`h-10 flex-1 rounded-lg px-5 text-sm font-bold transition-colors md:flex-none ${
              workspaceView === "tickets"
                ? "bg-[#F5C518] text-black"
                : "text-gray-500 hover:bg-[#FFFBF0]"
            }`}
          >
            Tickets
          </button>
          <button
            onClick={() => setWorkspaceView("tasks")}
            className={`h-10 flex-1 rounded-lg px-5 text-sm font-bold transition-colors md:flex-none ${
              workspaceView === "tasks"
                ? "bg-[#F5C518] text-black"
                : "text-gray-500 hover:bg-[#FFFBF0]"
            }`}
          >
            Tasks
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {["All", ...STATUS_OPTIONS].map((status) => (
            <FilterButton
              key={status}
              active={workspaceView === "tickets" ? ticketFilter === status : taskFilter === status}
              onClick={() =>
                workspaceView === "tickets"
                  ? setTicketFilter(status)
                  : setTaskFilter(status)
              }
            >
              {status}
            </FilterButton>
          ))}
        </div>
      </div>

      {workspaceView === "tickets" && (
        <section>
          <h3 className="mb-4 text-base font-bold text-gray-800 flex items-center gap-2">
            <FiFilter className="text-[#F5C518]" /> Assigned Tickets
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredTickets.length ? (
              filteredTickets.map((ticket) => (
                <AssignmentCard
                  key={ticket.id}
                  item={ticket}
                  kind="ticket"
                  highlighted={String(ticket.id) === String(highlightedTicket)}
                  onViewTicket={setViewTicket}
                  onOpenHistory={setHistoryTicket}
                  onDeleteTicket={deleteTicket}
                />
              ))
            ) : (
              <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center text-gray-400 text-sm">
                No tickets match this filter.
              </div>
            )}
          </div>
        </section>
      )}

      {workspaceView === "tasks" && (
        <section>
          <h3 className="mb-4 text-base font-bold text-gray-800 flex items-center gap-2">
            <FiCheckCircle className="text-[#F5C518]" /> Assigned Tasks
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredTasks.length ? (
              filteredTasks.map((task) => (
                <AssignmentCard
                  key={task.id}
                  item={task}
                  kind="task"
                  highlighted={String(task.id) === String(highlightedTask)}
                  onViewTask={setViewTask}
                  onEditTask={setEditTask}
                  onDeleteTask={deleteTask}
                />
              ))
            ) : (
              <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center text-gray-400 text-sm">
                No tasks match this filter.
              </div>
            )}
          </div>
        </section>
      )}

      <TicketDetailsModal ticket={viewTicket} onClose={() => setViewTicket(null)} />
      <TaskDetailsModal task={viewTask} employee={employee} onClose={() => setViewTask(null)} />
      <TicketHistoryDrawer
        ticketId={historyTicket?.id}
        ticket={historyTicket}
        open={Boolean(historyTicket)}
        onClose={() => setHistoryTicket(null)}
        currentUser={employee}
        statusUpdateOnly
        onStatusUpdated={handleTicketStatusUpdated}
      />

      {editTask && (
        <AssignTaskForm
          editTask={editTask}
          onClose={() => setEditTask(null)}
          onAssign={() => loadWorkspace(employee)}
          enableWorkNotes
          currentEmployee={employee}
        />
      )}
    </div>
  );
}
