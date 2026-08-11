import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

import {
  PLANS,
  STATUSES,
  YELLOW,
  EMPTY_FILTERS,
} from "../../../constants/subscriptionConstants";

export default function FilterPanel({
  filters,
  onApply,
  onReset,
  onClose,
}) {
  const ref = useRef(null);

 const [local, setLocal] = useState(
  filters || EMPTY_FILTERS
);
useEffect(() => {
  setLocal(filters || EMPTY_FILTERS);
}, [filters]);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handler);

    return () =>
      document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const togglePlan = (p) => {
    setLocal((prev) => ({
      ...prev,
      plans: prev.plans.includes(p)
        ? prev.plans.filter((x) => x !== p)
        : [...prev.plans, p],
    }));
  };

  const toggleStatus = (s) => {
    setLocal((prev) => ({
      ...prev,
      statuses: prev.statuses.includes(s)
        ? prev.statuses.filter((x) => x !== s)
        : [...prev.statuses, s],
    }));
  };

  return (

<motion.div
  ref={ref}
  initial={{ opacity: 0, scale: 0.93, y: -8 }}
  animate={{ opacity: 1, scale: 1, y: 0 }}
  exit={{ opacity: 0, scale: 0.93, y: -8 }}
  className="absolute right-0 top-12 z-50 bg-white border border-gray-100 rounded-2xl p-4 w-80 shadow-xl"
>
  <div className="flex items-center justify-between mb-3">
    <span className="text-sm font-bold text-gray-900">
      Filters
    </span>

    <button
      onClick={() => {
        setLocal(EMPTY_FILTERS);
        onReset();
      }}
      className="text-xs text-red-500 font-semibold hover:underline"
    >
      Clear all
    </button>
  </div>

  {/* PLAN */}
  <div className="mb-4">
    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
      Plan
    </p>

    <div className="flex flex-wrap gap-2">
      {PLANS.map((p) => {
        const active = local.plans.includes(p);

        return (
          <button
            key={p}
            onClick={() => togglePlan(p)}
            className="px-3 py-1 rounded-full text-xs font-semibold border transition-all"
            style={
              active
                ? {
                    background: YELLOW,
                    borderColor: YELLOW,
                    color: "#1f2937",
                  }
                : {
                    background: "#f9fafb",
                    borderColor: "#e5e7eb",
                    color: "#6b7280",
                  }
            }
          >
            {p}
          </button>
        );
      })}
    </div>
  </div>

  {/* STATUS */}
  <div className="mb-5">
    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
      Status
    </p>

    <div className="flex gap-2">
      {STATUSES.map((s) => {
        const active = local.statuses.includes(s);

        return (
          <button
            key={s}
            onClick={() => toggleStatus(s)}
            className="px-3 py-1 rounded-full text-xs font-semibold border transition-all"
            style={
              active
                ? {
                    background: YELLOW,
                    borderColor: YELLOW,
                    color: "#1f2937",
                  }
                : {
                    background: "#f9fafb",
                    borderColor: "#e5e7eb",
                    color: "#6b7280",
                  }
            }
          >
            {s}
          </button>
        );
      })}
    </div>
  </div>
{/* EXPIRY DATE */}
<div className="mb-5">
  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
    Expiry Date
  </p>

  <div className="grid grid-cols-2 gap-2">
  {/* FROM DATE */}
  <input
    type="date"
    value={local.expireFrom}
    max={local.expireTo || ""}
    onChange={(e) =>
      setLocal((prev) => ({
        ...prev,
        expireFrom: e.target.value,
      }))
    }
    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-gray-50 outline-none focus:border-yellow-400"
  />

  {/* TO DATE */}
  <input
    type="date"
    value={local.expireTo}
    min={local.expireFrom || ""}
    onChange={(e) =>
      setLocal((prev) => ({
        ...prev,
        expireTo: e.target.value,
      }))
    }
    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-gray-50 outline-none focus:border-yellow-400"
  />
</div>
</div>
  {/* BUTTONS */}
  <div className="flex gap-2">
    <button
      onClick={onClose}
      className="flex-1 py-2 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50"
    >
      Cancel
    </button>

    <button
      onClick={() => {
        onApply(local);
        onClose();
      }}
      className="flex-1 py-2 rounded-lg text-xs font-bold text-gray-900"
      style={{ background: YELLOW }}
    >
      Apply Filters
    </button>
  </div>
</motion.div>
  );
}