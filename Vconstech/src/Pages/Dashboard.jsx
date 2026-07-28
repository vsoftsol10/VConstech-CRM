import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config/api";

import StatsCards from "../components/dashboard/StatsCards";
import PlanUsageSection from "../components/dashboard/PlanUsageSection";
import ActiveUsersChart from "../components/dashboard/ActiveUsersChart";
import RecentCustomers from "../components/dashboard/RecentCustomers";

const Dashboard = () => {
  const [customers, setCustomers] = useState([]);
  const [stats, setStats] = useState(null);
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [chartData, setChartData] = useState([]);
  const yearOptions = Array.from({ length: 6 }, (_, index) => currentYear - index);

useEffect(() => {
  const load = async () => {
    try {
      const customersRes = await axios.get(
        `${API_BASE_URL}/api/customers`
      );

      const statsRes = await axios.get(
        `${API_BASE_URL}/api/customers/stats/monthly?year=${selectedYear}`
      );

      const dashboardStatsRes = await axios.get(
        `${API_BASE_URL}/api/dashboard/stats`
      );

      setCustomers(customersRes.data);
      setChartData(statsRes.data);
      setStats(dashboardStatsRes.data?.data || null);
    } catch (err) {
      console.error(err);
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

      <RecentCustomers customers={customers} />
    </div>
  );
};

export default Dashboard;
