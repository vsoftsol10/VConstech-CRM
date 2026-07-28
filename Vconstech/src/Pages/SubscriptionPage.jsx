import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import SubscriptionStats from "../components/subscription/stats/SubscriptionStats";
import SearchBar from "../components/subscription/filters/SearchBar";
import FilterChips from "../components/subscription/filters/FilterChips";
import SubscriptionTable from "../components/subscription/table/SubscriptionTable";
import SubscriptionMobileCards from "../components/subscription/table/SubscriptionMobileCards";
import { API_BASE_URL } from "../config/api";

import { EMPTY_FILTERS } from "../constants/subscriptionConstants";
import { parseExpire } from "../utils/subscriptionUtils";

export default function SubscriptionPage() {
  const [tableSearch, setTableSearch] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [activeFilters, setActiveFilters] = useState(EMPTY_FILTERS);
  const navigate = useNavigate();
  const filterBtnRef = useRef(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const hasDateFilter = activeFilters.expireFrom || activeFilters.expireTo;

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/customers`);
        setSubscriptions(res.data);
      } catch (err) {
        console.log("API error:", err);
      }
    };

    loadCustomers();
  }, []);

  const activeCount =
    activeFilters.plans.length +
    activeFilters.statuses.length +
    (hasDateFilter ? 1 : 0);

  const filtered = subscriptions.filter((s) => {
    const name = (s.customer_name || "").toLowerCase();
    const plan = (s.subscription_plan || "").toLowerCase();
    const search = tableSearch.toLowerCase();
    const matchSearch =
      name.includes(search) ||
      plan.includes(search);
    const matchPlan =
      activeFilters.plans.length === 0 ||
      activeFilters.plans.includes(s.subscription_plan || s.plan);

    const matchStatus =
      activeFilters.statuses.length === 0 ||
      activeFilters.statuses.includes(s.active ? "Active" : "Expiring");

    let matchDate = true;

    if (activeFilters.expireFrom || activeFilters.expireTo) {
      const exp = parseExpire(s.renewal_date || s.expire);

      if (activeFilters.expireFrom)
        matchDate =
          matchDate &&
          exp >= new Date(activeFilters.expireFrom);

      if (activeFilters.expireTo)
        matchDate =
          matchDate &&
          exp <= new Date(activeFilters.expireTo);
    }

    return (
      matchSearch &&
      matchPlan &&
      matchStatus &&
      matchDate
    );
  });

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 p-4 md:p-1">

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-[22px] font-bold text-[#111111] sm:text-[28px] md:text-[32px]">
            Subscription
          </h1>

          <button
            onClick={() => navigate("/SubscriptionPlans")}
            className="h-10 rounded-xl bg-yellow-400 px-4 text-sm font-semibold text-black shadow-md shadow-yellow-200 transition-all hover:scale-[1.02] hover:bg-yellow-500 active:scale-95"
          >
            Plans
          </button>
        </div>

        <SubscriptionStats customers={subscriptions} />

        <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">

          <SearchBar
            tableSearch={tableSearch}
            setTableSearch={setTableSearch}
            activeCount={activeCount}
            showFilter={showFilter}
            setShowFilter={setShowFilter}
            filterBtnRef={filterBtnRef}
            activeFilters={activeFilters}
            setActiveFilters={setActiveFilters}
          />

          <FilterChips
            activeFilters={activeFilters}
            setActiveFilters={setActiveFilters}
            activeCount={activeCount}
          />

          <SubscriptionTable
            filtered={filtered}
            onReminderSent={(updatedRow) =>
              setSubscriptions((prev) =>
                prev.map((item) =>
                  item.id === updatedRow.id ? { ...item, ...updatedRow } : item
                )
              )
            }
          />
          <SubscriptionMobileCards
            filtered={filtered}
            onReminderSent={(updatedRow) =>
              setSubscriptions((prev) =>
                prev.map((item) =>
                  item.id === updatedRow.id ? { ...item, ...updatedRow } : item
                )
              )
            }
          />

        </div>
      </main>
    </div>
  );
}
