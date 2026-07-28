import { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { FiX } from "react-icons/fi";
import Select from "react-select";
import { API_BASE_URL } from "../../config/api";

const PRIORITIES = ["High", "Medium", "Low"].map((v) => ({ value: v, label: v }));
const STATUSES = ["Open", "In Progress", "Completed", "Done", "Closed"].map((v) => ({ value: v, label: v }));
const MIN_TITLE_LENGTH = 3;
const MAX_TITLE_LENGTH = 120;
const MIN_DESCRIPTION_LENGTH = 10;

const selectStyles = {
  control: (base, state) => ({
    ...base,
    borderRadius: "0.75rem",
    borderColor: state.isFocused ? "#F5C518" : "#e5e7eb",
    boxShadow: "none",
    backgroundColor: "#f9fafb",
    minHeight: "42px",
    fontSize: "0.875rem",
    cursor: "pointer",
    "&:hover": { borderColor: "#F5C518" },
  }),
  placeholder: (base) => ({ ...base, color: "#9ca3af", fontSize: "0.875rem" }),
  singleValue: (base) => ({ ...base, color: "#111111", fontSize: "0.875rem" }),
  indicatorSeparator: () => ({ display: "none" }),
  dropdownIndicator: (base, state) => ({
    ...base,
    color: state.isFocused ? "#F5C518" : "#9ca3af",
    transition: "transform 0.2s",
    transform: state.selectProps.menuIsOpen ? "rotate(180deg)" : "rotate(0deg)",
  }),
  menu: (base) => ({
    ...base,
    borderRadius: "0.75rem",
    overflow: "hidden",
    zIndex: 99,
    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
    border: "1px solid #e5e7eb",
  }),
  menuList: (base) => ({ ...base, padding: "4px" }),
  option: (base, state) => ({
    ...base,
    fontSize: "0.875rem",
    borderRadius: "0.5rem",
    backgroundColor: state.isSelected
      ? "#FEF3C7"
      : state.isFocused
      ? "#FFFBEB"
      : "transparent",
    color: "#111111",
    fontWeight: state.isSelected ? "600" : "400",
    cursor: "pointer",
    margin: "1px 0",
  }),
};

const ErrorText = ({ children }) =>
  children ? <p className="mt-1.5 text-xs font-medium text-red-500">{children}</p> : null;

const getTodayInput = () => new Date().toISOString().split("T")[0];

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

export default function AssignTaskModal({
  member,
  onClose,
  onAssign,
  editTask = null,
  enableWorkNotes = false,
  currentEmployee = null,
}) {
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [workNotes, setWorkNotes] = useState([]);
  const [workNote, setWorkNote] = useState("");
  const [workNotesLoading, setWorkNotesLoading] = useState(false);
  const [workNoteSaving, setWorkNoteSaving] = useState(false);
  const [workNoteError, setWorkNoteError] = useState("");
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [assignees, setAssignees] = useState([]);
  const [form, setForm] = useState({
    task:        "",
    assignee:    null,
    priority:    null,
    status:      { value: "Open", label: "Open" },
    due:         "",
    description: "",
  });

  useEffect(() => {
    if (!editTask) return;
    setForm({
      task: editTask.title || "",
      assignee: null,
      priority: editTask.priority ? { value: editTask.priority, label: editTask.priority } : null,
      status: editTask.status ? { value: editTask.status, label: editTask.status } : { value: "Open", label: "Open" },
      due: editTask.due_date ? editTask.due_date.split("T")[0] : "",
      description: editTask.description || "",
    });
  }, [editTask]);

  const set = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    setErrors((prev) => {
      if (!prev[k]) return prev;
      const next = { ...prev };
      delete next[k];
      return next;
    });
    setSubmitError("");
  };

  const employeeForNotes = currentEmployee || member || {};
  const employeeId = employeeForNotes.employee_id || employeeForNotes.id || editTask?.assigned_to || "";
  const employeeName = employeeForNotes.name || employeeForNotes.full_name || editTask?.employee_name || "";
  const showWorkNotes = Boolean(enableWorkNotes && editTask?.id);

  const loadWorkNotes = async () => {
    if (!showWorkNotes) return;
    setWorkNotesLoading(true);
    setWorkNoteError("");
    try {
      const response = await axios.get(`${API_BASE_URL}/api/tasks/${editTask.id}/updates`, {
        params: { employee_id: employeeId },
      });
      setWorkNotes(response.data?.data || response.data || []);
    } catch (err) {
      setWorkNoteError(err.response?.data?.message || "Failed to load task updates.");
    } finally {
      setWorkNotesLoading(false);
    }
  };

  useEffect(() => {
    setWorkNote("");
    setWorkNotes([]);
    if (showWorkNotes) loadWorkNotes();
  }, [showWorkNotes, editTask?.id, employeeId]);

  useEffect(() => {
    fetchTeamMembers();
  }, [editTask]);

  const fetchTeamMembers = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/team`);
      const teamMembers = res.data;
      const uniqueDepartments = [...new Set(teamMembers.map((member) => member.department))];
      const deptOptions = uniqueDepartments.map((dept) => ({ value: dept, label: dept }));
      setDepartments(deptOptions);

      if (editTask) {
        const assignedMember = teamMembers.find(
          (emp) =>
            String(emp.employee_id) === String(editTask.assigned_to) ||
            String(emp.id) === String(editTask.assigned_to) ||
            emp.name === editTask.employee_name
        );

        if (assignedMember) {
          const dept = { value: assignedMember.department, label: assignedMember.department };
          const filtered = teamMembers
            .filter((emp) => emp.department === assignedMember.department)
            .map((emp) => ({ value: emp.employee_id, label: emp.name, employee_name: emp.name }));
          setSelectedDepartment(dept);
          setAssignees(filtered);
          set("assignee", {
            value: assignedMember.employee_id,
            label: assignedMember.name,
            employee_name: assignedMember.name,
          });
        } else {
          setAssignees([]);
        }
      } else {
        setAssignees([]);
      }
    } catch {
      setSubmitError("Unable to load team members. Please try again.");
    }
  };

  const handleDepartmentChange = async (dept) => {
    setSelectedDepartment(dept);
    setErrors((prev) => {
      if (!prev.department && !prev.assignee) return prev;
      const next = { ...prev };
      delete next.department;
      delete next.assignee;
      return next;
    });
    setSubmitError("");

    try {
      const res = await axios.get(`${API_BASE_URL}/api/team`);
      const filtered = res.data
        .filter((emp) => emp.department === dept.value)
        .map((emp) => ({ value: emp.employee_id, label: emp.name, employee_name: emp.name }));
      setAssignees(filtered);
      set("assignee", null);
    } catch {
      setSubmitError("Unable to load employees for this department.");
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const title = form.task.trim();
    const description = form.description.trim();
    const today = getTodayInput();
    const validPriorities = PRIORITIES.map((item) => item.value);
    const validStatuses = STATUSES.map((item) => item.value);

    if (!title) newErrors.task = "Task title is required.";
    else if (title.length < MIN_TITLE_LENGTH) newErrors.task = `Task title must be at least ${MIN_TITLE_LENGTH} characters.`;
    else if (title.length > MAX_TITLE_LENGTH) newErrors.task = `Task title must be ${MAX_TITLE_LENGTH} characters or less.`;

    if (!selectedDepartment) newErrors.department = "Department is required.";
    if (!form.assignee) newErrors.assignee = "Employee is required.";

    if (!form.priority) newErrors.priority = "Please select a priority.";
    else if (!validPriorities.includes(form.priority.value)) newErrors.priority = "Invalid priority selected.";

    if (!form.status) newErrors.status = "Please select a status.";
    else if (!validStatuses.includes(form.status.value)) newErrors.status = "Invalid status selected.";

    if (!form.due) newErrors.due = "Due date is required.";
    else {
      const year = new Date(form.due).getFullYear();
      if (year < 1000 || year > 9999) newErrors.due = "Please enter a valid 4-digit year.";
      else if (Number.isNaN(new Date(form.due).getTime())) newErrors.due = "Invalid due date.";
      else if (form.due < today) newErrors.due = "Due date cannot be in the past.";
    }

    if (!description) newErrors.description = "Task description is required.";
    else if (description.length < MIN_DESCRIPTION_LENGTH) {
      newErrors.description = `Task description must be at least ${MIN_DESCRIPTION_LENGTH} characters.`;
    }

    return newErrors;
  };

  const handleAssign = async () => {
    if (isSubmitting) return;
    const newErrors = validateForm();
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      setIsSubmitting(true);
      setSubmitError("");

      const payload = {
        title: form.task.trim(),
        description: form.description.trim(),
        assigned_to: form.assignee?.value,
        employee_name: form.assignee?.employee_name,
        department: selectedDepartment?.value,
        priority: form.priority?.value,
        due_date: form.due,
        status: form.status?.value,
      };

      if (editTask) {
        const response = await axios.put(`${API_BASE_URL}/api/tasks/${editTask.id}`, payload);
        onAssign?.(response.data?.task || response.data?.data || response.data);
      } else {
        const response = await axios.post(`${API_BASE_URL}/api/tasks`, payload);
        onAssign?.(response.data?.task || response.data?.data || response.data);
      }

      onClose();
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      if (apiErrors) {
        setErrors({
          task: apiErrors.title,
          description: apiErrors.description,
          assignee: apiErrors.assigned_to,
          priority: apiErrors.priority,
          due: apiErrors.due_date,
          status: apiErrors.status,
        });
      }
      setSubmitError(err.response?.data?.message || "Failed to save task. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddWorkNote = async () => {
    const note = workNote.trim();
    if (!note || !showWorkNotes || workNoteSaving) return;

    setWorkNoteSaving(true);
    setWorkNoteError("");
    try {
      const response = await axios.post(`${API_BASE_URL}/api/tasks/${editTask.id}/updates`, {
        employee_id: employeeId,
        employee_name: employeeName,
        work_note: note,
      });
      const saved = response.data?.data || response.data;
      setWorkNotes((current) => [...current, saved].sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0)));
      setWorkNote("");
    } catch (err) {
      setWorkNoteError(err.response?.data?.message || "Failed to add work note.");
    } finally {
      setWorkNoteSaving(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Panel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="relative bg-white w-full sm:w-[520px] h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 shrink-0">
          <h2 className="text-[18px] font-bold text-[#111111]">{editTask ? "Edit Task" : "Assign A Task"}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
          >
            <FiX size={16} />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* Task */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Task</label>
            <input
              type="text"
              value={form.task}
              onChange={(e) => set("task", e.target.value)}
              maxLength={MAX_TITLE_LENGTH}
              className={`w-full px-3 py-2.5 text-sm border rounded-xl bg-gray-50 outline-none focus:border-[#F5C518] transition-colors ${
                errors.task ? "border-red-300" : "border-gray-200"
              }`}
            />
            <ErrorText>{errors.task}</ErrorText>
          </div>

          {/* Department */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Department</label>
            <Select
              options={departments}
              value={selectedDepartment}
              onChange={handleDepartmentChange}
              placeholder="Select Department"
              isSearchable={false}
              styles={selectStyles}
            />
            <ErrorText>{errors.department}</ErrorText>
          </div>

          {/* Assignee */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Assignee</label>
            <Select
              options={assignees}
              value={form.assignee}
              onChange={(v) => set("assignee", v)}
              placeholder="Select Assignee"
              isSearchable={false}
              styles={selectStyles}
            />
            <ErrorText>{errors.assignee}</ErrorText>
          </div>

          {/* Priority + Due */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Priority</label>
              <Select
                options={PRIORITIES}
                value={form.priority}
                onChange={(v) => set("priority", v)}
                placeholder="Select Priority"
                isSearchable={false}
                styles={selectStyles}
              />
              <ErrorText>{errors.priority}</ErrorText>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Due</label>
              <input
                type="date"
                min={getTodayInput()}
                max="9999-12-31"
                value={form.due || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val) {
                    const year = new Date(val).getFullYear();
                    if (year > 9999 || year < 1000) return;
                  }
                  set("due", val);
                }}
                onKeyDown={(e) => {
                  const input = e.target;
                  const val = input.value;
                  if (val) {
                    const year = val.split("-")[0];
                    if (year && year.length >= 4 && e.key >= "0" && e.key <= "9") {
                      const section = input.selectionStart;
                      if (section <= 4) e.preventDefault();
                    }
                  }
                }}
                className={`w-full px-3 py-2.5 text-sm border rounded-xl bg-gray-50 outline-none focus:border-[#F5C518] transition-colors ${
                  errors.due ? "border-red-300" : "border-gray-200"
                }`}
              />
              <ErrorText>{errors.due}</ErrorText>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
            <Select
              options={STATUSES}
              value={form.status}
              onChange={(v) => set("status", v)}
              placeholder="Select Status"
              isSearchable={false}
              styles={selectStyles}
            />
            <ErrorText>{errors.status}</ErrorText>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea
              rows={5}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              className={`w-full px-3 py-2.5 text-sm border rounded-xl bg-gray-50 outline-none focus:border-[#F5C518] transition-colors resize-none ${
                errors.description ? "border-red-300" : "border-gray-200"
              }`}
            />
            <ErrorText>{errors.description}</ErrorText>
          </div>

          {showWorkNotes && (
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="mb-3">
                <h3 className="text-sm font-bold text-gray-900">Task Updates</h3>
                <p className="text-xs text-gray-400">Add work notes for this assigned task.</p>
              </div>

              <textarea
                rows={4}
                value={workNote}
                onChange={(event) => {
                  setWorkNote(event.target.value);
                  setWorkNoteError("");
                }}
                placeholder="Enter work note..."
                className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none transition-colors focus:border-[#F5C518]"
              />
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleAddWorkNote}
                  disabled={workNoteSaving || !workNote.trim()}
                  className="rounded-xl bg-[#F5C518] px-4 py-2 text-sm font-bold text-black transition-all hover:bg-yellow-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {workNoteSaving ? "Adding..." : "Add Work Note"}
                </button>
              </div>

              {workNoteError && <p className="mt-2 text-xs font-medium text-red-500">{workNoteError}</p>}

              <div className="mt-4">
                {workNotesLoading ? (
                  <div className="rounded-xl border border-dashed border-gray-200 p-4 text-center text-sm text-gray-400">
                    Loading task updates...
                  </div>
                ) : workNotes.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gray-200 p-4 text-center text-sm text-gray-400">
                    No work notes yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {workNotes.map((item) => (
                      <div key={item.id || item.created_at} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-bold text-gray-800">
                            {item.employee_name || item.employee_id || "Employee"}
                          </p>
                          <p className="text-xs text-gray-400">{formatDateTime(item.created_at)}</p>
                        </div>
                        <p className="whitespace-pre-wrap text-sm leading-5 text-gray-700">{item.work_note}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <ErrorText>{submitError}</ErrorText>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 shrink-0">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleAssign}
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-black transition-all bg-[#F5C518] hover:bg-yellow-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Saving..." : editTask ? "Update Task" : "Assign Task"}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
