import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiSave } from "react-icons/fi";

const YELLOW   = "#F5C518";
const TYPES    = ["Request Ticket", "Incident Ticket"];
const STATUSES = ["Open", "In progress", "Resolved"];
const DATES    = ["Today", "This Week", "This Month"];

export default function EditTicketModal({ ticket, onClose, onSave }) {
  const [form, setForm] = useState({
    ticketInfo:  ticket?.ticketNo    || "",
    ticketType:  ticket?.type        || "",
    ticketType2: ticket?.type        || "",
    company:     ticket?.clientName  || "",
    date:        ticket?.date        || "",
    status:      ticket?.status      || "",
    description: ticket?.description || "",
  });

  const set = (field, value) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleSave = () => {
    onSave({ ...ticket, ...form });
    onClose();
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-end"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Slide-in Panel — right side like your image */}
      <motion.div
        initial={{ x: "100%"  }}
        animate={{ x: 0       }}
        exit={{   x: "100%"   }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="
          relative bg-white
          w-full sm:w-[520px]
          h-full
          shadow-2xl
          flex flex-col
          overflow-hidden
        "
      >

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 shrink-0">
          <h2 className="text-[18px] font-bold text-[#111111]">Edit Ticket</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
          >
            <FiX size={16} />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* Ticket Information */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Ticket Information
            </label>
            <input
              type="text"
              value={form.ticketInfo}
              onChange={(e) => set("ticketInfo", e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 outline-none focus:border-[#F5C518] transition-colors"
            />
          </div>

          {/* Ticket Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Ticket Type
            </label>
            <div className="relative">
              <select
                value={form.ticketType}
                onChange={(e) => set("ticketType", e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 outline-none focus:border-[#F5C518] transition-colors appearance-none cursor-pointer"
              >
                <option value="">Select Category</option>
                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">▾</span>
            </div>
          </div>

          {/* Ticket Type 2 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Ticket Type
            </label>
            <div className="relative">
              <select
                value={form.ticketType2}
                onChange={(e) => set("ticketType2", e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 outline-none focus:border-[#F5C518] transition-colors appearance-none cursor-pointer"
              >
                <option value="">Select Category</option>
                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">▾</span>
            </div>
          </div>

          {/* Company */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Company
            </label>
            <input
              type="text"
              value={form.company}
              onChange={(e) => set("company", e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 outline-none focus:border-[#F5C518] transition-colors"
            />
          </div>

          {/* Date + Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Date
              </label>
              <div className="relative">
                <select
                  value={form.date}
                  onChange={(e) => set("date", e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 outline-none focus:border-[#F5C518] transition-colors appearance-none cursor-pointer"
                >
                  <option value="">Select Category</option>
                  {DATES.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">▾</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Status
              </label>
              <div className="relative">
                <select
                  value={form.status}
                  onChange={(e) => set("status", e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 outline-none focus:border-[#F5C518] transition-colors appearance-none cursor-pointer"
                >
                  <option value="">Select Category</option>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">▾</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Description
            </label>
            <textarea
              rows={5}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 outline-none focus:border-[#F5C518] transition-colors resize-none"
            />
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-black transition-all"
            style={{ background: YELLOW }}
          >
            <FiSave size={14} />
            Save change
          </motion.button>
        </div>

      </motion.div>
    </motion.div>
  );
}