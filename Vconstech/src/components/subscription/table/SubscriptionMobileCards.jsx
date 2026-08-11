import { motion } from "framer-motion";
import ActionMenu from "./ActionMenu";

function titleCase(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

function getStatus(row) {
  const raw = titleCase(row.subscription_status || row.subscriptionStatus || row.status);
  if (["Active", "Expired", "Trial", "Cancelled"].includes(raw)) return raw;
  const renewal = new Date(row.renewal_date || row.expire || row.expires_at);
  if (!Number.isNaN(renewal.getTime())) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (renewal < today) return "Expired";
  }
  return "Active";
}

function formatDisplayDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function StatusBadge({ value }) {
  const classes = {
    Active: "bg-green-100 text-green-700",
    Expired: "bg-red-100 text-red-700",
    Trial: "bg-yellow-100 text-yellow-700",
    Cancelled: "bg-gray-100 text-gray-700",
  };

  return (
    <span className={`inline-flex h-7 items-center rounded-full px-2.5 text-[11px] font-bold ${classes[value] || "bg-gray-100 text-gray-700"}`}>
      {value}
    </span>
  );
}

export default function SubscriptionMobileCards({ filtered = [], onReminderSent }) {
  return (
    <div className="flex flex-col gap-3 md:hidden">
      {filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-gray-400">
          No records found
        </p>
      ) : (
        filtered.map((row, i) => {
          const customerName = row.customer_name || row.name || "-";
          const plan = row.subscription_plan || row.plan || "-";
          const status = getStatus(row);

          return (
            <motion.div
              key={row.id || i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-200 hover:border-yellow-200 hover:bg-yellow-50/30"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-800">{customerName}</p>
                  <p className="mt-0.5 truncate text-xs text-gray-400">{plan}</p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <StatusBadge value={status} />
                  <ActionMenu row={row} onReminderSent={onReminderSent} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 border-t border-gray-50 pt-3 text-xs text-gray-500">
                <div>
                  <span className="mb-0.5 block text-gray-400">Payment</span>
                  <span className="font-medium text-gray-700">{titleCase(row.payment_status || row.paymentStatus) || "Pending"}</span>
                </div>
                <div>
                  <span className="mb-0.5 block text-gray-400">Expires</span>
                  <span className="font-medium text-gray-700">{formatDisplayDate(row.renewal_date || row.expire || row.expires_at)}</span>
                </div>
                <div>
                  <span className="mb-0.5 block text-gray-400">Reminder</span>
                  <span className="font-medium text-gray-700">{row.reminder_sent ? "Sent" : "Pending"}</span>
                </div>
              </div>
            </motion.div>
          );
        })
      )}
    </div>
  );
}
