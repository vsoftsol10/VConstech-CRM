import { AnimatePresence, motion } from "framer-motion";

import { YELLOW } from "../../../constants/subscriptionConstants";

export default function FilterChips({
  activeFilters,
  setActiveFilters,
  activeCount,
}) {
  const hasDateFilter =
    activeFilters.expireFrom || activeFilters.expireTo;

  return (
    <AnimatePresence>

      {activeCount > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="flex flex-wrap gap-2 px-4 py-2 border-b border-gray-100 overflow-hidden"
        >

          {/* PLAN CHIPS */}
          {activeFilters.plans.map((p) => (
            <motion.span
              key={p}
              className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{
                background: "#FFFDE7",
                color: "#92660a",
                border: `1px solid ${YELLOW}`,
              }}
            >
              {p}

              <button
                onClick={() =>
                  setActiveFilters((f) => ({
                    ...f,
                    plans: f.plans.filter((x) => x !== p),
                  }))
                }
              >
                ✕
              </button>
            </motion.span>
          ))}

        </motion.div>
      )}

    </AnimatePresence>
  );
}