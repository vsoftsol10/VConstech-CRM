import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";
import {
  FiCalendar,
  FiEdit2,
  FiEye,
  FiMoreVertical,
  FiRefreshCw,
  FiTrash2,
  FiX
} from "react-icons/fi";

import LeadPipelineColumn from "../leads/LeadPipelineColumn";
import AssignTaskForm from "../TeamMember/AssignTaskForm";

const API = "http://localhost:5000";

const TASK_STATUS_OPTIONS = ["All", "Open", "In Progress", "Resolved", "Closed"];
const WORK_HISTORY_TABS = ["Active Works", "Done Works"];

const PRIORITY_COLORS = {
  Low: { bg: "#f0fdf4", text: "#16a34a" },
  Medium: { bg: "#fffbe6", text: "#b8900a" },
  High: { bg: "#fef2f2", text: "#dc2626" },
  Critical: { bg: "#fdf4ff", text: "#9333ea" },
};

// ---------------- helpers ----------------
function formatDate(value) {
  if (!value) return "—";
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

function parseLeads(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function parseTasks(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function resolveAssignedToParam(emp) {
  return emp?.employee_id || null;
}

function isConvertedLead(lead) {
  return lead?.is_customer === true || lead?.is_customer === "true";
}

// ---------------- TASK CARD ----------------
function DetailRow({ label, value }) {
  return (
    <div className="rounded-xl bg-gray-50 px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-gray-800 break-words">
        {value || "-"}
      </p>
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
              {task.title || "Untitled task"}
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
            <DetailRow label="Due Date" value={formatDate(task.due_date)} />
            <DetailRow
              label="Assigned To"
              value={task.employee_name || task.assigned_to_name || task.assigned_to}
            />
            <DetailRow label="Created At" value={formatDate(task.created_at)} />
            <DetailRow label="Updated At" value={formatDate(task.updated_at)} />
          </div>

          <div className="mt-4 rounded-xl bg-gray-50 px-3 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              Description
            </p>
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

function TaskCard({ task, onStatusChange, onView, onEdit, onDelete }) {
  const status = task.status || "Open";
  const priority = task.priority || "Medium";
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="relative bg-white rounded-2xl border shadow-sm p-4">
      <div className="flex justify-between mb-2">
        <div>
          <span className="text-xs text-gray-400">TASK-{task.id}</span>
          <h3 className="font-semibold text-sm">
            {task.title || "Untitled"}
          </h3>
        </div>

        <div className="flex items-start gap-2">
          <span className="text-xs px-2 py-1 rounded bg-gray-100">
            {priority}
          </span>
          <div className="relative">
            <button
              onClick={() => setMenuOpen((current) => !current)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              aria-label="Task actions"
            >
              <FiMoreVertical />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-9 z-30 w-36 overflow-hidden rounded-xl border bg-white py-1 shadow-lg">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onView(task);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  <FiEye className="text-gray-400" /> View
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit(task);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  <FiEdit2 className="text-gray-400" /> Edit
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete(task);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                >
                  <FiTrash2 /> Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-500 mb-3">
        {task.description || "No description"}
      </p>

      <div className="flex justify-between text-xs mb-3">
        <span>{status}</span>
        <span>
          <FiCalendar className="inline mr-1 text-yellow-500" />
          {formatDate(task.due_date)}
        </span>
      </div>

      
    </div>
  );
}

// ---------------- MAIN ----------------
export default function SalesWorkspacePage() {
  const [employee, setEmployee] = useState(null);
  const [leads, setLeads] = useState([]);
  const [tasks, setTasks] = useState([]);

  const [view, setView] = useState("leads");
  const [open, setOpen] = useState(false);
  const [viewTask, setViewTask] = useState(null);
  const [editTask, setEditTask] = useState(null);

  const [leadFilter, setLeadFilter] = useState("All");
  const [taskFilter, setTaskFilter] = useState("All");
  const [workHistoryTab, setWorkHistoryTab] = useState("Active Works");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const location = useLocation();

  // ---------------- LOAD ----------------
  const loadWorkspace = async (emp) => {
    const assignedToParam = resolveAssignedToParam(emp);

    setLoading(true);
    setError("");

    try {
      const [leadRes, taskRes] = await Promise.all([
        axios.get(`${API}/api/leads`, {
          params: assignedToParam ? { assigned_to: assignedToParam } : {},
        }),
        axios.get(`${API}/api/tasks`, {
          params: { assigned_to: emp.employee_id },
        }),
      ]);

      setLeads(parseLeads(leadRes.data));
      setTasks(parseTasks(taskRes.data));
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to load workspace.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem("employee");
    if (!stored) return setLoading(false);

    const emp = JSON.parse(stored);
    setEmployee(emp);
    loadWorkspace(emp);
  }, []);

  // ---------------- STATUS UPDATE ----------------
  const updateTaskStatus = async (id, status) => {
    try {
      await axios.put(`${API}/api/tasks/${id}/status`, { status });

      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status } : t))
      );
    } catch {
      alert("Failed to update task");
    }
  };

  const deleteTask = async (task) => {
    const confirmed = window.confirm(
      `Delete TASK-${task.id}? This task will be removed permanently.`
    );

    if (!confirmed) return;

    try {
      await axios.delete(`${API}/api/tasks/${task.id}`);
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
      alert("Task deleted successfully.");
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to delete task.");
    }
  };

  const handleLeadConverted = (leadId) => {
    setLeads((prev) =>
      prev.map((lead) =>
        String(lead.id) === String(leadId)
          ? { ...lead, is_customer: true, status: "won" }
          : lead
      )
    );
  };

  // ---------------- FILTERS ----------------
  const activeWorks = useMemo(
    () => leads.filter((lead) => !isConvertedLead(lead)),
    [leads]
  );

  const doneWorks = useMemo(
    () => leads.filter((lead) => isConvertedLead(lead)),
    [leads]
  );

  const filteredTasks = useMemo(() => {
    if (taskFilter === "All") return tasks;
    return tasks.filter((t) => (t.status || "Open") === taskFilter);
  }, [tasks, taskFilter]);

  const filteredLeads = useMemo(() => {
    if (leadFilter === "All") return activeWorks;
    return activeWorks.filter((l) => (l.status || "new") === leadFilter);
  }, [activeWorks, leadFilter]);

  const displayedWorks = workHistoryTab === "Active Works" ? activeWorks : doneWorks;

  // ---------------- PROFILE ----------------
  const avatar =
    employee?.profile_image
      ? `${API}/uploads/${employee.profile_image}`
      : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-400">
        Please log in
      </div>
    );
  }

  // ---------------- UI ----------------
  return (
    <div className="p-6 bg-gray-50 min-h-screen">

      {/* HEADER */}
      <div className="bg-white p-4 rounded-xl border flex justify-between items-center mb-6">

        {/* PROFILE */}
        <div className="flex items-center gap-3">
          {avatar ? (
            <img
              src={avatar}
              className="w-12 h-12 rounded-full object-cover border"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-yellow-400 flex items-center justify-center font-bold">
              {employee.name?.[0]}
            </div>
          )}

          <div>
            <h2 className="font-bold">My Workspace</h2>
            <p className="text-sm text-gray-500">{employee.name}</p>
          </div>
        </div>

        {/* STATS */}
        <div className="flex gap-3">
          <div className="px-3 py-2 bg-yellow-50 rounded-lg text-sm">
            Leads: {leads.length}
          </div>
          <div className="px-3 py-2 bg-blue-50 rounded-lg text-sm">
            Tasks: {tasks.length}
          </div>

          <button
            onClick={() => loadWorkspace(employee)}
            className="flex items-center gap-2 px-3 py-2 border rounded-lg text-sm"
          >
            <FiRefreshCw /> Refresh
          </button>

          {/* VIEW SWITCH */}
          <div className="relative">
            <button
              onClick={() => setOpen(!open)}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              {view === "leads" ? "Leads" : "Tasks"} ▼
            </button>

            {open && (
              <div className="absolute right-0 mt-2 bg-white border rounded-lg shadow w-32 z-50">
                <button
                  onClick={() => {
                    setView("leads");
                    setOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 hover:bg-gray-100"
                >
                  Leads
                </button>

                <button
                  onClick={() => {
                    setView("tasks");
                    setOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 hover:bg-gray-100"
                >
                  Tasks
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FILTER CHIPS */}
      <div className="flex gap-2 mb-4 flex-wrap">

        {view === "leads" &&
          ["All", "new", "contacted", "qualified", "won", "lost"].map((f) => (
            <button
              key={f}
              onClick={() => setLeadFilter(f)}
              className={`px-3 py-1 rounded-full text-xs border ${
                leadFilter === f ? "bg-yellow-400 text-black" : "bg-white"
              }`}
            >
              {f}
            </button>
          ))}

        {view === "tasks" &&
          ["All", "Open", "In Progress", "Resolved", "Closed"].map((f) => (
            <button
              key={f}
              onClick={() => setTaskFilter(f)}
              className={`px-3 py-1 rounded-full text-xs border ${
                taskFilter === f ? "bg-yellow-400 text-black" : "bg-white"
              }`}
            >
              {f}
            </button>
          ))}
      </div>

      {/* BODY */}
      {error && (
        <div className="bg-red-100 text-red-600 p-3 rounded mb-4">
          {error}
        </div>
      )}

      {view === "leads" && (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredLeads.map((lead) => (
            <LeadPipelineColumn key={lead.id} lead={lead} onConverted={handleLeadConverted} />
          ))}
          {filteredLeads.length === 0 && (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center text-sm text-gray-400">
              No active leads match this filter.
            </div>
          )}
        </div>
      )}

      {view === "tasks" && (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onStatusChange={updateTaskStatus}
              onView={setViewTask}
              onEdit={setEditTask}
              onDelete={deleteTask}
            />
          ))}
          {filteredTasks.length === 0 && (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center text-sm text-gray-400">
              No tasks match this filter.
            </div>
          )}
        </div>
      )}

      <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-800">Work History</h3>
            <p className="text-xs text-gray-400">Track assigned lead work and completed conversions.</p>
          </div>
          <div className="inline-flex rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
            {WORK_HISTORY_TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setWorkHistoryTab(tab)}
                className={`h-9 rounded-lg px-4 text-sm font-bold transition-colors ${
                  workHistoryTab === tab
                    ? "bg-[#F5C518] text-black"
                    : "text-gray-500 hover:bg-[#FFFBF0]"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {displayedWorks.length > 0 ? (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {displayedWorks.map((lead) => (
              <LeadPipelineColumn
                key={lead.id}
                lead={lead}
                onConverted={handleLeadConverted}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-200 p-10 text-center text-sm text-gray-400">
            {workHistoryTab === "Active Works"
              ? "No active works assigned."
              : "No completed conversions yet."}
          </div>
        )}
      </section>

      <TaskDetailsModal task={viewTask} employee={employee} onClose={() => setViewTask(null)} />

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
