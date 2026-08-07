import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL, unwrapCustomerList } from "../config/api";

import StatsCards from "../components/dashboard/StatsCards";
import PlanUsageSection from "../components/dashboard/PlanUsageSection";
import ActiveUsersChart from "../components/dashboard/ActiveUsersChart";
import RecentCustomers from "../components/dashboard/RecentCustomers";
import RecentLeads from "../components/dashboard/RecentLeads";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const isCustomerLead = (lead) => {
  const status = String(lead?.status || "").trim().toLowerCase();
  return Boolean(lead?.is_customer) || status === "won" || status === "converted";
};

const leadToCustomer = (lead) => ({
  id: lead.id,
  customer_name: lead.full_name || lead.company || "Unnamed customer",
  company_name: lead.company || "",
  email: lead.email || "",
  phone: lead.phone || "",
  channel: lead.channel || "",
  subscription_plan: lead.plan || "Unknown",
  active: true,
  start_date: lead.lead_date || lead.created_at || "",
  renewal_date: "",
  created_at: lead.created_at || lead.lead_date || "",
});

const buildMonthlyData = (rows, selectedYear) => {
  const counts = new Map();

  rows.forEach((row) => {
    const date = new Date(
      row.created_at ||
      row.createdAt ||
      row.start_date ||
      row.lead_date ||
      row.subscription_start_date
    );

    if (Number.isNaN(date.getTime()) || date.getFullYear() !== selectedYear) return;

    const month = date.getMonth();
    counts.set(month, (counts.get(month) || 0) + 1);
  });

  return Array.from(counts.entries())
    .sort(([left], [right]) => left - right)
    .map(([month, users]) => ({
      month: MONTHS[month],
      month_num: month + 1,
      users,
    }));
};

const Dashboard = () => {
  const [customers, setCustomers] = useState([]);
  const [erpCustomers, setErpCustomers] = useState([]);
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState(null);
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [chartData, setChartData] = useState([]);
  const yearOptions = Array.from({ length: 6 }, (_, index) => currentYear - index);

useEffect(() => {
  const load = async () => {
    const [customersResult, erpCustomersResult, dashboardStatsResult, leadsResult] =
      await Promise.allSettled([
        axios.get(`${API_BASE_URL}/api/customers/converted-leads`),
        axios.get(`${API_BASE_URL}/api/customers`, { params: { source: "erp" } }),
        axios.get(`${API_BASE_URL}/api/dashboard/stats`),
        axios.get(`${API_BASE_URL}/api/leads`),
      ]);

    const leadRows =
      leadsResult.status === "fulfilled" && Array.isArray(leadsResult.value.data)
        ? leadsResult.value.data
        : [];

    const customerRows =
      customersResult.status === "fulfilled"
        ? unwrapCustomerList(customersResult.value.data)
        : leadRows.filter(isCustomerLead).map(leadToCustomer);

    if (customersResult.status === "fulfilled") {
      setCustomers(customerRows);
    } else {
      setCustomers(customerRows);
    }

    setErpCustomers(
      erpCustomersResult.status === "fulfilled"
        ? unwrapCustomerList(erpCustomersResult.value.data)
        : []
    );

    setChartData(buildMonthlyData(customerRows, selectedYear));

    if (dashboardStatsResult.status === "fulfilled") {
      setStats(dashboardStatsResult.value.data?.data || null);
    } else {
      console.error(dashboardStatsResult.reason);
    }

    setLeads(leadRows);
  };

  load();
}, [selectedYear]);

  return (
    <div className="space-y-4 md:space-y-6 p-1">
      <h1 className="text-[22px] sm:text-[28px] md:text-[32px] font-bold text-[#111111]">
        Dashboard
      </h1>

      <StatsCards customers={erpCustomers} leads={leads} stats={stats} />

      <PlanUsageSection customers={customers} leads={leads} />

      <ActiveUsersChart
        data={chartData}
        selectedYear={selectedYear}
        yearOptions={yearOptions}
        onYearChange={setSelectedYear}
      />

      {/* <RecentLeads leads={leads} /> */}

      <RecentCustomers customers={customers} />
    </div>
  );
};

export default Dashboard;
