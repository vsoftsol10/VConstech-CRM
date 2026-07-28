import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiClock, FiPlus, FiChevronDown } from "react-icons/fi";
import { API_BASE_URL } from "../../config/api";

const API = `${API_BASE_URL}`;
const ACTIVITY_TYPES = ["Work Note", "Follow Up", "Status Update", "Customer Reply"];
const STATUS_OPTIONS = ["Open", "In Progress", "Resolved", "Closed"];

const formatDateTime = (value) => {
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
};

const Field = ({ label, value }) => (
  <div>
    <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">{label}</p>
    <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">{value === true ? "Yes" : value === false ? "No" : value || "-"}</p>
  </div>
);

const getPreviousStatus = (item) =>
  item?.metadata?.previous_status ||
  item?.metadata?.previousStatus ||
  item?.previous_status ||
  null;

const getChangedBy = (item) =>
  item?.created_by_name ||
  item?.sender ||
  item?.created_by_employee_id ||
  item?.created_by ||
  "Unknown";

export default function TicketHistoryDrawer({
  ticketId,
  ticket,
  open,
  onClose,
  currentUser,
  statusUpdateOnly = false,
  onStatusUpdated,
}) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);
  const [error, setError] = useState("");
  const [selectedStatus, setSelectedStatus] = useState(ticket?.state || "Open");
  const [workNotes, setWorkNotes] = useState("");
  const [form, setForm] = useState({
    activity_type: "Work Note",
    title: "",
    Worknotes: "",
  });

  const loadHistory = async () => {
    if (!ticketId) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/tickets/${ticketId}/history`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Failed to load work history.");
      const entries = json.data || [];
      setHistory(
        statusUpdateOnly
          ? [...entries].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
          : entries
      );
    } catch (err) {
      setError(err.message || "Failed to load work history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) loadHistory();
  }, [open, ticketId]);

  useEffect(() => {
    if (open) {
      setSelectedStatus(ticket?.state || "Open");
      setWorkNotes("");
    }
  }, [open, ticket?.state]);

  const updateStatus = async (event) => {
    event.preventDefault();
    if (!ticketId || !selectedStatus) return;

    setStatusSaving(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/tickets/${ticketId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          state: selectedStatus,
          Worknotes: workNotes,
          updated_by: currentUser?.id || currentUser?.employee_id || null,
          history_activity_type: "STATUS_UPDATED",
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Failed to update ticket status.");

      onStatusUpdated?.(json.data);
      setWorkNotes("");
      await loadHistory();
    } catch (err) {
      setError(err.message || "Failed to update ticket status.");
    } finally {
      setStatusSaving(false);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!form.Worknotes.trim()) {
      setError("Worknotes is required.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/tickets/${ticketId}/history`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          created_by: currentUser?.id || null,
          sender: currentUser?.name || currentUser?.full_name || currentUser?.employee_id || null,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Failed to add work note.");

      setHistory((prev) => [...prev, json.data]);
      setForm({ activity_type: "Work Note", title: "", Worknotes: "" });
    } catch (err) {
      setError(err.message || "Failed to add work note.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[80]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/30" onClick={onClose} />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className="absolute right-0 top-0 flex h-full w-full max-w-[520px] flex-col bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[#C89B00]">Work History</p>
                <h2 className="text-lg font-bold text-gray-900">Ticket activity</h2>
              </div>
              <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-700" aria-label="Close work history">
                <FiX />
              </button>
            </div>

            {statusUpdateOnly ? (
              <form onSubmit={updateStatus} className="border-b border-gray-100 p-5">
                <label className="block text-sm font-semibold text-gray-700">
                  Status
                  <div className="relative mt-1">
                    <select
                      value={selectedStatus}
                      onChange={(event) => setSelectedStatus(event.target.value)}
                      className="
                        h-11 w-full appearance-none rounded-xl border border-[#F5C518]/70 bg-white
                        px-3 pr-10 text-sm font-semibold text-gray-800 outline-none
                        transition-all duration-200
                        hover:border-[#F5C518] hover:bg-[#FFFBF0]
                        focus:border-[#F5C518] focus:bg-[#FFF9E0] focus:ring-2 focus:ring-[#F5C518]/20
                      "
                      required
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status} className="bg-white text-gray-800">
                          {status}
                        </option>
                      ))}
                    </select>
                    <FiChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#C89B00]" size={16} />
                  </div>
                </label>
                <label className="mt-4 block text-sm font-semibold text-gray-700">
                  Work Notes
                  <textarea
                    value={workNotes}
                    onChange={(event) => setWorkNotes(event.target.value)}
                    className="
                      mt-1 min-h-[104px] w-full rounded-xl border border-[#F5C518]/50 bg-white
                      px-3 py-2.5 text-sm text-gray-800 outline-none resize-none
                      transition-all duration-200 placeholder:text-gray-400
                      hover:border-[#F5C518] hover:bg-[#FFFBF0]
                      focus:border-[#F5C518] focus:bg-[#FFF9E0] focus:ring-2 focus:ring-[#F5C518]/20
                    "
                    placeholder="Enter work notes..."
                  />
                </label>
                {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
                <button
                  type="submit"
                  disabled={statusSaving}
                  className="mt-3 inline-flex h-10 items-center gap-2 rounded-xl bg-[#F5C518] px-4 text-sm font-bold text-black transition-colors hover:bg-yellow-400 disabled:opacity-60"
                >
                  {statusSaving ? "Updating..." : "Update"}
                </button>
              </form>
            ) : (
              <form onSubmit={submit} className="border-b border-gray-100 p-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Activity type
                    <select
                      value={form.activity_type}
                      onChange={(event) => setForm((prev) => ({ ...prev, activity_type: event.target.value }))}
                      className="mt-1 h-10 w-full rounded-xl border border-[#F5C518] bg-white px-3 text-sm outline-none focus:bg-[#FFF9E0]"
                      required
                    >
                      {ACTIVITY_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                    </select>
                  </label>
                  <label className="text-sm font-semibold text-gray-700">
                    Title
                    <input
                      value={form.title}
                      onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                      className="mt-1 h-10 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-[#F5C518]"
                      placeholder="Optional"
                    />
                  </label>
                </div>
                <label className="mt-3 block text-sm font-semibold text-gray-700">
                  Worknotes
                  <textarea
                    value={form.Worknotes}
                    onChange={(event) => setForm((prev) => ({ ...prev, Worknotes: event.target.value }))}
                    className="mt-1 min-h-[96px] w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#F5C518]"
                    placeholder="Add work notes..."
                    required
                  />
                </label>
                {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-3 inline-flex h-10 items-center gap-2 rounded-xl bg-[#F5C518] px-4 text-sm font-bold text-black transition-colors hover:bg-yellow-400 disabled:opacity-60"
                >
                  <FiPlus /> {submitting ? "Adding..." : "Add Work Note"}
                </button>
              </form>
            )}

            <div className="flex-1 overflow-y-auto p-5">
              {loading ? (
                <div className="py-16 text-center text-sm text-gray-400">Loading work history...</div>
              ) : history.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-400">
                  No work history found for this ticket
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((item) => {
                    const isStatusChange = ["STATUS_CHANGED", "STATUS_UPDATED"].includes(item.activity_type);
                    const employeeHistory = (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="Status" value={item.status_snapshot} />
                        <Field label="Work notes" value={item.Worknotes} />
                        <Field label="Updated by" value={getChangedBy(item)} />
                        <Field label="Date & time" value={formatDateTime(item.created_at)} />
                      </div>
                    );

                    return (
                      <div key={item.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                        {!statusUpdateOnly && (
                          <div className="mb-3 flex items-start justify-between gap-3">
                            <div>
                              <p className="text-xs font-bold uppercase tracking-wide text-[#C89B00]">{item.activity_type}</p>
                              <h3 className="mt-1 text-sm font-bold text-gray-900">{item.title || "Work history"}</h3>
                            </div>
                            <span className="inline-flex items-center gap-1 text-[11px] text-gray-400">
                              <FiClock /> {formatDateTime(item.created_at)}
                            </span>
                          </div>
                        )}
                        {statusUpdateOnly ? employeeHistory : isStatusChange ? (
                          <div className="grid gap-3 sm:grid-cols-2">
                            <Field label="Previous status" value={getPreviousStatus(item)} />
                            <Field label="New status" value={item.status_snapshot} />
                            <Field label="Changed by" value={getChangedBy(item)} />
                            <Field label="Changed date & time" value={formatDateTime(item.created_at)} />
                          </div>
                        ) : (
                          <div className="grid gap-3 sm:grid-cols-2">
                            <Field label="Worknotes" value={item.Worknotes} />
                            <Field label="Sender" value={item.sender} />
                            <Field label="Receiver" value={item.receiver} />
                            <Field label="Follow-up date" value={item.follow_up_date} />
                            <Field label="Follow-up time" value={item.follow_up_time} />
                            <Field label="Reminder" value={item.reminder} />
                            <Field label="Status" value={item.status_snapshot} />
                            <Field label="Created at" value={formatDateTime(item.created_at)} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
