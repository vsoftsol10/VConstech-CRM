import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import { FiEdit2, FiSave, FiSearch, FiX } from "react-icons/fi";
import ActionDropdown from "../../TeamMember/ActionDropdown";

const API = "http://localhost:5000";

const DEPARTMENT_OPTIONS = ["Sales", "Support", "Technical", "Marketing"];
const STATUS_OPTIONS = ["Open", "In Progress", "Completed", "On Hold", "Done", "Closed"];
const EDIT_STATUS_OPTIONS = ["Open", "In Progress", "Completed", "Done", "Closed"];
const FILTER_PRIORITY_OPTIONS = ["Low", "Medium", "High", "Critical"];
const EDIT_PRIORITY_OPTIONS = ["High", "Medium", "Low"];
const ROW_OPTIONS = [10, 15, 25, 50, 100];

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

const priorityColors = {
  Low: "bg-green-100 text-green-700",
  Medium: "bg-yellow-100 text-yellow-700",
  High: "bg-red-100 text-red-700",
  Critical: "bg-purple-100 text-purple-700",
};

const statusColors = {
  Open: "bg-blue-50 text-blue-700",
  "In Progress": "bg-yellow-50 text-yellow-700",
  Completed: "bg-green-50 text-green-700",
  "On Hold": "bg-gray-100 text-gray-700",
  Done: "bg-green-50 text-green-700",
  Closed: "bg-gray-100 text-gray-700",
};

const normalize = (value) => String(value || "").trim();
const normalizeFilterValue = (value) => normalize(value).toLowerCase();

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
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

function inputDate(value) {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
}

function todayInput() {
  return new Date().toISOString().split("T")[0];
}

function getApiErrorMessage(err) {
  const errors = err.response?.data?.errors;
  if (errors && typeof errors === "object") {
    return Object.values(errors).filter(Boolean).join(" ");
  }
  return err.response?.data?.message || err.response?.data?.error || "Failed to update task.";
}

function getEditValidationMessage(form) {
  if (form.title.trim().length < 3) return "Task title must be at least 3 characters.";
  if (form.description.trim().length < 10) return "Task description must be at least 10 characters.";
  if (!form.assigned_to) return "Employee is required.";
  if (!EDIT_PRIORITY_OPTIONS.includes(form.priority)) return "Please select a supported priority: High, Medium, or Low.";
  if (!EDIT_STATUS_OPTIONS.includes(form.status)) return "Please select a supported status.";
  if (!form.due_date) return "Due date is required.";
  if (form.due_date < todayInput()) return "Due date cannot be in the past.";
  return "";
}

function parseTasks(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.tasks)) return data.tasks;
  return [];
}

function getTaskId(task) {
  return task?.task_id || task?.taskId || task?.id || "-";
}

function getEmployeeName(task) {
  return task?.employee_name || task?.assigned_to_name || task?.assignee_name || task?.assigned_to || "Unassigned";
}

function getTaskUpdates(task) {
  const candidates = [
    task?.updates,
    task?.task_updates,
    task?.taskUpdates,
    task?.history,
    task?.work_notes,
    task?.workNotes,
  ];

  const found = candidates.find((value) => Array.isArray(value) && value.length);
  if (found) return found;

  const note = normalize(task?.work_note || task?.workNote || task?.Worknotes);
  if (!note) return [];

  return [{
    id: `${getTaskId(task)}-work-note`,
    work_note: note,
    updated_by: task?.updated_by || task?.employee_name || task?.assigned_to_name,
    created_at: task?.updated_at || task?.created_at,
  }];
}

function getUpdateNote(item) {
  return item?.work_note || item?.workNote || item?.Worknotes || item?.note || item?.notes || item?.description || "-";
}

function getUpdatedBy(item) {
  return item?.updated_by_name || item?.updated_by || item?.created_by_name || item?.sender || item?.employee_name || "Unknown";
}

function getUpdateTime(item) {
  return item?.created_at || item?.updated_at || item?.date_time || item?.date || item?.timestamp;
}

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
      className="fixed z-[999] w-[240px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl shadow-black/10"
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

function SortableHeader({ label, field, sort, onSort }) {
  const active = sort.field === field;
  const direction = active ? sort.direction : "asc";

  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      className="inline-flex items-center gap-1 text-left transition-colors hover:text-yellow-700"
    >
      <span>{label}</span>
      <span className={`text-[10px] ${active ? "text-yellow-700" : "text-gray-300"}`}>
        {direction === "asc" ? "▲" : "▼"}
      </span>
    </button>
  );
}

function DetailField({ label, value }) {
  return (
    <div className="rounded-xl bg-gray-50 px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-1 text-sm font-medium text-gray-800 break-words">{value || "-"}</p>
    </div>
  );
}

function TaskUpdates({ task }) {
  const [dbUpdates, setDbUpdates] = useState([]);
  const [loadingUpdates, setLoadingUpdates] = useState(false);
  const [updatesError, setUpdatesError] = useState("");

  useEffect(() => {
    if (!task?.id) return;

    const loadTaskUpdates = async () => {
      setLoadingUpdates(true);
      setUpdatesError("");
      try {
        const response = await axios.get(`${API}/api/tasks/${task.id}/updates`);
        setDbUpdates(response.data?.data || response.data || []);
      } catch (err) {
        setUpdatesError(err.response?.data?.message || err.response?.data?.error || "Failed to load task updates.");
      } finally {
        setLoadingUpdates(false);
      }
    };

    loadTaskUpdates();
  }, [task?.id]);

  const updates = useMemo(
    () =>
      [...getTaskUpdates(task), ...dbUpdates].sort((a, b) => {
        const aTime = new Date(getUpdateTime(a) || 0).getTime();
        const bTime = new Date(getUpdateTime(b) || 0).getTime();
        return aTime - bTime;
      }),
    [task, dbUpdates]
  );

  return (
    <section className="mt-5 rounded-2xl border border-gray-100 bg-white p-4">
      <div className="mb-3">
        <h3 className="text-sm font-bold text-gray-900">Task Updates</h3>
        <p className="text-xs text-gray-400">Work notes are shown in chronological order.</p>
      </div>

      {updatesError && <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-500">{updatesError}</p>}

      {loadingUpdates ? (
        <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-400">
          Loading task updates...
        </div>
      ) : updates.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-400">
          No task updates found.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-3 py-2 text-left text-[12px] font-semibold text-gray-600">Work Note</th>
                <th className="px-3 py-2 text-left text-[12px] font-semibold text-gray-600">Updated By</th>
                <th className="px-3 py-2 text-left text-[12px] font-semibold text-gray-600">Date & Time</th>
              </tr>
            </thead>
            <tbody>
              {updates.map((item, index) => (
                <tr key={item.id || index} className="border-t border-gray-100">
                  <td className="px-3 py-3 text-gray-700">
                    <p className="whitespace-pre-wrap">{getUpdateNote(item)}</p>
                  </td>
                  <td className="px-3 py-3 text-gray-600 whitespace-nowrap">{getUpdatedBy(item)}</td>
                  <td className="px-3 py-3 text-gray-600 whitespace-nowrap">{formatDateTime(getUpdateTime(item))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function TaskModal({ task, initialMode, teamMembers, onClose, onSaved }) {
  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState(() => ({
    title: task?.title || task?.task_title || "",
    description: task?.description || "",
    department: task?.department || "",
    assigned_to: task?.assigned_to || "",
    employee_name: getEmployeeName(task),
    priority: task?.priority || "Medium",
    due_date: inputDate(task?.due_date || task?.date),
    status: task?.status || "Open",
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isEdit = mode === "edit";
  const filteredMembers = useMemo(
    () =>
      teamMembers.filter((member) => {
        if (!form.department) return true;
        return normalize(member.department).toLowerCase() === normalize(form.department).toLowerCase();
      }),
    [teamMembers, form.department]
  );

  const set = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setError("");
  };

  const handleAssigneeChange = (value) => {
    const selected = teamMembers.find(
      (member) => String(member.employee_id) === String(value) || String(member.id) === String(value)
    );
    setForm((current) => ({
      ...current,
      assigned_to: value,
      employee_name: selected?.name || current.employee_name,
      department: current.department || selected?.department || "",
    }));
    setError("");
  };

  const save = async () => {
    if (saving) return;
    const validationMessage = getEditValidationMessage(form);
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    setSaving(true);
    setError("");
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        assigned_to: form.assigned_to,
        employee_name: form.employee_name,
        department: form.department,
        priority: form.priority,
        due_date: form.due_date,
        status: form.status,
      };
      const response = await axios.put(`${API}/api/tasks/${task.id}`, payload);
      const updated = response.data?.task || response.data?.data || response.data;
      onSaved(updated);
      setMode("view");
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[80] flex items-center justify-center px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.22 }}
          className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        >
          <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
            <div>
              <p className="text-xs font-mono font-bold text-[#C89B00]">TASK-{getTaskId(task)}</p>
              <h2 className="mt-1 text-xl font-bold text-gray-900">
                {isEdit ? "Edit Task" : form.title || "Task Details"}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition-all hover:bg-gray-100 hover:text-gray-700"
              aria-label="Close task popup"
            >
              <FiX />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5 pb-24">
            {isEdit ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="sm:col-span-2 text-sm font-semibold text-gray-700">
                  Task Title
                  <input
                    value={form.title}
                    onChange={(event) => set("title", event.target.value)}
                    className="mt-1 h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm outline-none transition-colors focus:border-[#F5C518]"
                  />
                </label>

                <label className="text-sm font-semibold text-gray-700">
                  Department
                  <select
                    value={form.department}
                    onChange={(event) => set("department", event.target.value)}
                    className="mt-1 h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm outline-none transition-colors focus:border-[#F5C518]"
                  >
                    <option value="">Select Department</option>
                    {DEPARTMENT_OPTIONS.map((department) => (
                      <option key={department} value={department}>{department}</option>
                    ))}
                  </select>
                </label>

                <label className="text-sm font-semibold text-gray-700">
                  Assigned Employee
                  <select
                    value={form.assigned_to}
                    onChange={(event) => handleAssigneeChange(event.target.value)}
                    className="mt-1 h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm outline-none transition-colors focus:border-[#F5C518]"
                  >
                    <option value="">Select Employee</option>
                    {filteredMembers.map((member) => (
                      <option key={member.employee_id || member.id} value={member.employee_id || member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-sm font-semibold text-gray-700">
                  Priority
                  <select
                    value={form.priority}
                    onChange={(event) => set("priority", event.target.value)}
                    className="mt-1 h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm outline-none transition-colors focus:border-[#F5C518]"
                  >
                    {EDIT_PRIORITY_OPTIONS.map((priority) => (
                      <option key={priority} value={priority}>{priority}</option>
                    ))}
                  </select>
                </label>

                <label className="text-sm font-semibold text-gray-700">
                  Due Date
                  <input
                    type="date"
                    min={todayInput()}
                    value={form.due_date}
                    onChange={(event) => set("due_date", event.target.value)}
                    className="mt-1 h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm outline-none transition-colors focus:border-[#F5C518]"
                  />
                </label>

                <label className="text-sm font-semibold text-gray-700">
                  Status
                  <select
                    value={form.status}
                    onChange={(event) => set("status", event.target.value)}
                    className="mt-1 h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm outline-none transition-colors focus:border-[#F5C518]"
                  >
                    {EDIT_STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </label>

                <label className="sm:col-span-2 text-sm font-semibold text-gray-700">
                  Description
                  <textarea
                    rows={5}
                    value={form.description}
                    onChange={(event) => set("description", event.target.value)}
                    className="mt-1 w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none transition-colors focus:border-[#F5C518]"
                  />
                </label>
              </div>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <DetailField label="Task ID" value={`TASK-${getTaskId(task)}`} />
                  <DetailField label="Task Title" value={form.title} />
                  <DetailField label="Department" value={form.department} />
                  <DetailField label="Assigned Employee" value={form.employee_name} />
                  <DetailField label="Priority" value={form.priority} />
                  <DetailField label="Due Date" value={formatDate(form.due_date)} />
                  <DetailField label="Status" value={form.status} />
                  <DetailField label="Created Date" value={formatDateTime(task.created_at)} />
                  <DetailField label="Last Updated" value={formatDateTime(task.updated_at)} />
                </div>

                <div className="mt-4 rounded-xl bg-gray-50 px-3 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Description</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                    {form.description || "No description"}
                  </p>
                </div>
              </>
            )}

            <TaskUpdates task={task} />
            {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-500">{error}</p>}
          </div>

          {isEdit ? (
            <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
              <button
                type="button"
                onClick={() => setMode("view")}
                disabled={saving}
                className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-600 transition-all hover:bg-gray-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-[#F5C518] px-5 py-2.5 text-sm font-bold text-black transition-all hover:bg-yellow-400 disabled:opacity-60"
              >
                <FiSave /> {saving ? "Saving..." : "Save"}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setMode("edit")}
              className="absolute bottom-5 right-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#F5C518] text-black shadow-xl shadow-yellow-200 transition-all hover:scale-105 hover:bg-yellow-400"
              aria-label="Edit task"
            >
              <FiEdit2 size={20} />
            </button>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}

export default function SalesTasks() {
  const [tasks, setTasks] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [headerFilterOpen, setHeaderFilterOpen] = useState(null);
  const [filterDepartment, setFilterDepartment] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [sort, setSort] = useState({ field: "created_at", direction: "desc" });
  const [modalTask, setModalTask] = useState(null);
  const [modalMode, setModalMode] = useState("view");

  const departmentBtnRef = useRef(null);
  const statusBtnRef = useRef(null);
  const priorityBtnRef = useRef(null);

  // --- Synced horizontal scrollbar refs/state ---
  const tableScrollRef = useRef(null); // the actual horizontally-scrolling container
  const tableElRef = useRef(null); // the <table> element, used to measure content width
  const bottomScrollRef = useRef(null); // the dedicated sticky horizontal scrollbar
  const isSyncingRef = useRef(false); // guards against feedback loop between the two scroll listeners
  const [scrollWidth, setScrollWidth] = useState(0);

  const fetchTasks = async () => {
    setLoading(true);
    setError("");
    try {
      const [taskRes, teamRes] = await Promise.all([
        axios.get(`${API}/api/tasks`),
        axios.get(`${API}/api/team`),
      ]);
      setTasks(parseTasks(taskRes.data));
      setTeamMembers(Array.isArray(teamRes.data) ? teamRes.data : teamRes.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || "Failed to load tasks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const activeFilterCount = [filterDepartment, filterStatus, filterPriority].filter(Boolean).length;

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return tasks.filter((task) => {
      const haystack = [
        getTaskId(task),
        task.title,
        task.task_title,
        getEmployeeName(task),
        task.department,
        task.priority,
        task.status,
      ]
        .map((value) => String(value || "").toLowerCase())
        .join(" ");

      const matchSearch = !term || haystack.includes(term);
      const matchDepartment =
        !filterDepartment || normalizeFilterValue(task.department) === normalizeFilterValue(filterDepartment);
      const matchStatus =
        !filterStatus || normalizeFilterValue(task.status || "Open") === normalizeFilterValue(filterStatus);
      const matchPriority =
        !filterPriority || normalizeFilterValue(task.priority) === normalizeFilterValue(filterPriority);
      return matchSearch && matchDepartment && matchStatus && matchPriority;
    });
  }, [tasks, search, filterDepartment, filterStatus, filterPriority]);

  const sorted = useMemo(() => {
    const direction = sort.direction === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const read = (task) => {
        if (sort.field === "id") return Number(getTaskId(task)) || 0;
        if (sort.field === "title") return normalize(task.title || task.task_title).toLowerCase();
        if (sort.field === "employee") return normalize(getEmployeeName(task)).toLowerCase();
        if (sort.field === "department") return normalize(task.department).toLowerCase();
        if (sort.field === "priority") return FILTER_PRIORITY_OPTIONS.indexOf(task.priority);
        if (sort.field === "due_date") return new Date(task.due_date || 0).getTime() || 0;
        if (sort.field === "status") return normalize(task.status || "Open").toLowerCase();
        return new Date(task.created_at || 0).getTime() || 0;
      };
      const aValue = read(a);
      const bValue = read(b);
      if (aValue < bValue) return -1 * direction;
      if (aValue > bValue) return 1 * direction;
      return 0;
    });
  }, [filtered, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / rowsPerPage));
  const paginated = sorted.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  // Measure the table's real width so the dedicated scrollbar's inner
  // spacer matches it exactly (keeps the thumb size/proportion correct).
  useLayoutEffect(() => {
    const tableEl = tableElRef.current;
    if (!tableEl || loading) return;

    const updateWidth = () => setScrollWidth(tableEl.scrollWidth);
    updateWidth();

    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(tableEl);
    window.addEventListener("resize", updateWidth);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateWidth);
    };
  }, [loading, paginated.length, rowsPerPage]);

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

  const handleSort = (field) => {
    setSort((current) => ({
      field,
      direction: current.field === field && current.direction === "asc" ? "desc" : "asc",
    }));
  };

  const openModal = (task, mode) => {
    setModalTask(task);
    setModalMode(mode);
  };

  const handleSaved = (updatedTask) => {
    setTasks((current) =>
      current.map((task) => (String(task.id) === String(updatedTask.id) ? { ...task, ...updatedTask } : task))
    );
    setModalTask((current) => (current ? { ...current, ...updatedTask } : current));
  };

  const deleteTask = async (task) => {
    const confirmed = window.confirm(`Delete TASK-${getTaskId(task)}? This task will be removed permanently.`);
    if (!confirmed) return;

    try {
      await axios.delete(`${API}/api/tasks/${task.id}`);
      setTasks((current) => current.filter((item) => String(item.id) !== String(task.id)));
      alert("Task deleted successfully.");
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data?.error || "Failed to delete task.");
    }
  };

  return (
    <>
      <style>{STYLE}</style>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-visible">
        <div className="p-4 flex flex-col gap-3 border-b border-gray-100 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-[16px] font-bold text-[#111111]">Tasks</h2>
            <p className="mt-1 text-xs text-gray-400">Assigned tasks created from Assign Task</p>
          </div>

          <div className="relative w-full sm:max-w-[420px]">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setCurrentPage(1);
              }}
              className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-4 text-sm outline-none transition-all focus:ring-2 focus:ring-yellow-400"
              placeholder="Search tasks by title, employee, status or ID..."
            />
          </div>
        </div>

        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 px-4 py-3 text-xs">
            <span className="font-semibold text-gray-500">Filters:</span>
            {filterDepartment && (
              <button
                type="button"
                onClick={() => {
                  setFilterDepartment("");
                  setCurrentPage(1);
                }}
                className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-2.5 py-1 font-semibold text-yellow-700 transition-colors hover:bg-yellow-100"
                title="Clear department filter"
              >
                Department: {filterDepartment}
                <FiX size={12} />
              </button>
            )}
            {filterStatus && (
              <button
                type="button"
                onClick={() => {
                  setFilterStatus("");
                  setCurrentPage(1);
                }}
                className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-2.5 py-1 font-semibold text-yellow-700 transition-colors hover:bg-yellow-100"
                title="Clear status filter"
              >
                Status: {filterStatus}
                <FiX size={12} />
              </button>
            )}
            {filterPriority && (
              <button
                type="button"
                onClick={() => {
                  setFilterPriority("");
                  setCurrentPage(1);
                }}
                className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-2.5 py-1 font-semibold text-yellow-700 transition-colors hover:bg-yellow-100"
                title="Clear priority filter"
              >
                Priority: {filterPriority}
                <FiX size={12} />
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setFilterDepartment("");
                setFilterStatus("");
                setFilterPriority("");
                setCurrentPage(1);
              }}
              className="rounded-full px-2.5 py-1 font-semibold text-red-500 transition-colors hover:bg-red-50"
            >
              Clear
            </button>
          </div>
        )}

        {error && (
          <div className="m-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-500">
            {error}
          </div>
        )}

        {loading ? (
          <div className="p-5 space-y-3">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="h-12 rounded-xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            <div
              ref={tableScrollRef}
              onScroll={handleTableScroll}
              className="table-scroll-container relative z-0 overflow-x-auto overflow-y-visible"
            >
              <table ref={tableElRef} className="w-full min-w-[980px] text-sm">
                <thead className="relative z-30">
                  <tr className="bg-gray-50">
                    <th className="px-4 md:px-5 py-2.5 text-left text-[14px] font-semibold text-black tracking-wide whitespace-nowrap">
                      <SortableHeader label="Task ID" field="id" sort={sort} onSort={handleSort} />
                    </th>
                    <th className="px-4 md:px-5 py-2.5 text-left text-[14px] font-semibold text-black tracking-wide whitespace-nowrap">
                      <SortableHeader label="Task Title" field="title" sort={sort} onSort={handleSort} />
                    </th>
                    <th className="px-4 md:px-5 py-2.5 text-left text-[14px] font-semibold text-black tracking-wide whitespace-nowrap">
                      <SortableHeader label="Employee Name" field="employee" sort={sort} onSort={handleSort} />
                    </th>
                    <th className="px-4 md:px-5 py-2.5 text-left text-[14px] font-semibold text-black tracking-wide whitespace-nowrap">
                      <FilterHeader
                        label="Department"
                        active={filterDepartment}
                        buttonRef={departmentBtnRef}
                        open={headerFilterOpen === "department"}
                        onToggle={() => setHeaderFilterOpen((open) => (open === "department" ? null : "department"))}
                      >
                        <HeaderFilterMenu
                          anchorRef={departmentBtnRef}
                          isOpen={headerFilterOpen === "department"}
                          onClose={() => setHeaderFilterOpen(null)}
                          allLabel="All Departments"
                          options={DEPARTMENT_OPTIONS}
                          selected={filterDepartment}
                          onSelect={(value) => {
                            setFilterDepartment(value);
                            setHeaderFilterOpen(null);
                            setCurrentPage(1);
                          }}
                        />
                      </FilterHeader>
                    </th>
                    <th className="px-4 md:px-5 py-2.5 text-left text-[14px] font-semibold text-black tracking-wide whitespace-nowrap">
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
                          options={FILTER_PRIORITY_OPTIONS}
                          selected={filterPriority}
                          onSelect={(value) => {
                            setFilterPriority(value);
                            setHeaderFilterOpen(null);
                            setCurrentPage(1);
                          }}
                        />
                      </FilterHeader>
                    </th>
                    <th className="px-4 md:px-5 py-2.5 text-left text-[14px] font-semibold text-black tracking-wide whitespace-nowrap">
                      <SortableHeader label="Due Date" field="due_date" sort={sort} onSort={handleSort} />
                    </th>
                    <th className="px-4 md:px-5 py-2.5 text-left text-[14px] font-semibold text-black tracking-wide whitespace-nowrap">
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
                          options={STATUS_OPTIONS}
                          selected={filterStatus}
                          onSelect={(value) => {
                            setFilterStatus(value);
                            setHeaderFilterOpen(null);
                            setCurrentPage(1);
                          }}
                        />
                      </FilterHeader>
                    </th>
                    <th className="px-4 md:px-5 py-2.5 text-left text-[14px] font-semibold text-black tracking-wide whitespace-nowrap">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="relative z-0">
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-gray-400">
                        <div className="flex flex-col items-center gap-2" style={{ animation: "fadeIn 0.4s ease" }}>
                          <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="text-gray-300">
                            <path d="M9 11l3 3L22 4" />
                            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                          </svg>
                          <p className="font-medium">No tasks found</p>
                          {(search || activeFilterCount > 0) && <p className="text-xs text-gray-300">Try clearing your search or filters</p>}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginated.map((task, index) => (
                      <tr
                        key={task.id}
                        className="border-t border-gray-50 transition-colors hover:bg-yellow-50/40"
                        style={{
                          opacity: 0,
                          animation: "rowIn 0.45s ease forwards",
                          animationDelay: `${index * 50}ms`,
                        }}
                      >
                        <td className="px-5 py-3.5 whitespace-nowrap font-mono text-xs font-bold text-[#C89B00]">
                          TASK-{getTaskId(task)}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <p className="max-w-[200px] truncate font-semibold text-gray-800">{task.title || task.task_title || "Untitled task"}</p>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-gray-600">{getEmployeeName(task)}</td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-gray-600">{task.department || "-"}</td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${priorityColors[task.priority] || priorityColors.Medium}`}>
                            {task.priority || "Medium"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-gray-600">{formatDate(task.due_date)}</td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusColors[task.status] || statusColors.Open}`}>
                            {task.status || "Open"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <ActionDropdown
                            onView={() => openModal(task, "view")}
                            onEdit={() => openModal(task, "edit")}
                            onDelete={() => deleteTask(task)}
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

        {!loading && sorted.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-500 text-xs text-gray-800 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Showing {(currentPage - 1) * rowsPerPage + 1} - {Math.min(currentPage * rowsPerPage, sorted.length)} of {sorted.length} task{sorted.length !== 1 ? "s" : ""}
            </span>
            <div className="flex items-center gap-2">
              <select
                value={rowsPerPage}
                onChange={(event) => {
                  setRowsPerPage(Number(event.target.value));
                  setCurrentPage(1);
                }}
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

      {modalTask && (
        <TaskModal
          key={`${modalTask.id}-${modalMode}`}
          task={modalTask}
          initialMode={modalMode}
          teamMembers={teamMembers}
          onClose={() => setModalTask(null)}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
