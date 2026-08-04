import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL, unwrapCustomerList } from "../config/api";

import StatsCards from "../components/dashboard/StatsCards";
import PlanUsageSection from "../components/dashboard/PlanUsageSection";
import ActiveUsersChart from "../components/dashboard/ActiveUsersChart";
import RecentCustomers from "../components/dashboard/RecentCustomers";
import RecentLeads from "../components/dashboard/RecentLeads";

const Dashboard = () => {
  const [customers, setCustomers] = useState([]);
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState(null);
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [chartData, setChartData] = useState([]);
  const yearOptions = Array.from({ length: 6 }, (_, index) => currentYear - index);

useEffect(() => {
  const load = async () => {
    const [customersResult, statsResult, dashboardStatsResult, leadsResult] =
      await Promise.allSettled([
        axios.get(`${API_BASE_URL}/api/customers`),
        axios.get(`${API_BASE_URL}/api/customers/stats/monthly?year=${selectedYear}`),
        axios.get(`${API_BASE_URL}/api/dashboard/stats`),
        axios.get(`${API_BASE_URL}/api/leads`),
      ]);

    if (customersResult.status === "fulfilled") {
      setCustomers(unwrapCustomerList(customersResult.value.data));
    } else {
      console.error(customersResult.reason);
    }

    if (statsResult.status === "fulfilled") {
      setChartData(Array.isArray(statsResult.value.data) ? statsResult.value.data : []);
    } else {
      setChartData([]);
      console.error(statsResult.reason);
    }

    if (dashboardStatsResult.status === "fulfilled") {
      setStats(dashboardStatsResult.value.data?.data || null);
    } else {
      console.error(dashboardStatsResult.reason);
    }

    if (leadsResult.status === "fulfilled") {
      setLeads(Array.isArray(leadsResult.value.data) ? leadsResult.value.data : []);
    } else {
      setLeads([]);
      console.error(leadsResult.reason);
    }
  };

  load();
}, [selectedYear]);

  return (
    <div className="space-y-4 md:space-y-6 p-1">
      <h1 className="text-[22px] sm:text-[28px] md:text-[32px] font-bold text-[#111111]">
        Dashboard
      </h1>

      <StatsCards customers={customers} stats={stats} />

      <PlanUsageSection customers={customers} />

      <ActiveUsersChart
        data={chartData}
        selectedYear={selectedYear}
        yearOptions={yearOptions}
        onYearChange={setSelectedYear}
      />

      <RecentLeads leads={leads} />

      <RecentCustomers customers={customers} />
    </div>
  );
};

export default Dashboard;
