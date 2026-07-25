import { AnimatePresence } from "framer-motion";

import {
  SearchIcon,
  FilterIcon,
} from "../icons/SubscriptionIcons";

import FilterPanel from "./FilterPanel";

import { YELLOW, EMPTY_FILTERS } from "../../../constants/subscriptionConstants";

export default function SearchBar({
  tableSearch,
  setTableSearch,
  activeCount,
  showFilter,
  setShowFilter,
  filterBtnRef,
  activeFilters,
  setActiveFilters,
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative w-full sm:max-w-md">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <SearchIcon />
        </span>

        <input
          type="text"
          placeholder="Search customer or plan..."
          value={tableSearch}
          onChange={(e) => setTableSearch(e.target.value)}
          className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm outline-none transition-colors focus:border-yellow-400 focus:bg-white"
        />
      </div>

      <div className="relative flex gap-2 sm:flex-shrink-0">
        <button
          ref={filterBtnRef}
          type="button"
          onClick={() => setShowFilter((v) => !v)}
          className="flex h-10 items-center justify-center gap-1.5 rounded-xl border px-4 text-sm font-semibold transition-all duration-150 active:scale-95"
          style={
            activeCount > 0
              ? {
                  borderColor: YELLOW,
                  background: "#FFFDE7",
                  color: "#1f2937",
                }
              : {
                  borderColor: "#e5e7eb",
                  background: "#fff",
                  color: "#6b7280",
                }
          }
        >
          <FilterIcon />
          <span>Filters</span>

          {activeCount > 0 && (
            <span
              className="flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold"
              style={{
                background: YELLOW,
                color: "#1f2937",
              }}
            >
              {activeCount}
            </span>
          )}
        </button>

        <AnimatePresence>
          {showFilter && (
            <FilterPanel
              filters={activeFilters}
              onApply={(f) => setActiveFilters(f)}
              onReset={() => setActiveFilters(EMPTY_FILTERS)}
              onClose={() => setShowFilter(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
