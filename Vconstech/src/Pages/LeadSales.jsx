import { API_BASE_URL } from "../config/api";


import LeadStatsSection from "../components/leads/LeadStatsSection";
import LeadFilterBar from "../components/leads/LeadFilterBar";
import LeadPipelineSection from "../components/leads/LeadPipelineSection";

import { useEffect, useState } from "react";
import axios from "axios";

const WORK_FILTERS = ["All Works", "Active Works", "Done Works", "Unassigned Works"];
const CONVERTED_STAGE = "Converted Lead";
const STAGE_FILTERS = ["All", "New", "Contacted", "Qualified", "Proposal", "Won", "Lost", CONVERTED_STAGE];
const DONE_STATUSES = ["completed", "converted", "done"];

const normalizeFilterValue = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  return normalized === "trail" ? "trial" : normalized;
};

const getLeadStatus = (lead) => String(lead?.status || "").toLowerCase();
const isConverted = (lead) => lead?.is_customer === true || lead?.is_customer === "true";
const isCustomerRecord = (item) => item?.record_type === "customer";
const isDoneLead = (lead) =>isConverted(lead) || DONE_STATUSES.includes(getLeadStatus(lead));
const isActiveLead = (lead) => !isDoneLead(lead) && getLeadStatus(lead) !== "lost";
const isUnassignedLead = (lead) => String(lead?.assigned_to ?? "").trim() === "";
const includesSearch = (value, search) =>
  String(value ?? "").toLowerCase().includes(search);

const uniqueLeadsById = (items) => {
  const seen = new Set();

  return items.filter((lead) => {
    if (lead?.id === undefined || lead?.id === null) return true;
    if (seen.has(lead.id)) return false;
    seen.add(lead.id);
    return true;
  });
};

const matchesWorkFilter = (lead, workFilter) => {
  if (workFilter === "Active Works") return isActiveLead(lead);
  if (workFilter === "Done Works") return isDoneLead(lead);
  if (workFilter === "Unassigned Works") return isUnassignedLead(lead);
  return true;
};

const mapCustomerToPipelineItem = (customer) => ({
  ...customer,
  id: `customer-${customer.id}`,
  customer_id: customer.id,
  record_type: "customer",
  is_customer: true,
  name: customer.customer_name || customer.name,
  full_name: customer.customer_name || customer.name,
  company: customer.company_name || customer.company,
  plan: customer.subscription_plan,
  status: "converted",
});

const buildStageData = (leads, convertedCustomers) =>
  STAGE_FILTERS.map((stage) => ({
    stage,
    leads:
      stage === "All"
        ? leads
        : stage === CONVERTED_STAGE
        ? convertedCustomers.map(mapCustomerToPipelineItem)
        : stage === "Won"
        ? leads.filter((lead) => getLeadStatus(lead) === "won" && !isConverted(lead))
        : leads.filter((lead) => getLeadStatus(lead) === stage.toLowerCase()),
  }));

const buildWorkCounts = (leads) =>
  WORK_FILTERS.map((label) => ({
    label,
    count: leads.filter((lead) => matchesWorkFilter(lead, label)).length,
  }));

const LeadSales = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchLeads = async () => {
  try {
    const [leadsRes, convertedCustomersRes] = await Promise.all([
      axios.get(`${API_BASE_URL}/api/leads`),
      axios.get(`${API_BASE_URL}/api/customers/converted-leads`),
    ]);

    setLeads(uniqueLeadsById(leadsRes.data || []));
    setConvertedCustomers(convertedCustomersRes.data || []);
    setRefreshKey((k) => k + 1);
  } catch (err) {
    console.log(err);
  }
};
  useEffect(() => {
  fetchLeads();
}, []);
  const [searchTerm,  setSearchTerm]  = useState("");
  const [activeWorkFilter, setActiveWorkFilter] = useState("All Works");
  const [activeStage, setActiveStage] = useState("All");
  const [activePlan,  setActivePlan]  = useState("All");
const [leads, setLeads] = useState([]);
const [convertedCustomers, setConvertedCustomers] = useState([]);

const workCounts = buildWorkCounts(leads);
const leadsData = buildStageData(leads, convertedCustomers);

 const filteredLeads = leadsData
  .map((stageData) => ({
    ...stageData,
    leads: stageData.leads.filter((lead) => {

      const search = searchTerm.trim().toLowerCase();

      const matchesSearch =
        !search ||
        [
          lead.full_name,
          lead.company,
          lead.email,
          lead.phone,
          lead.plan,
          lead.subscription_plan,
          lead.status,
          lead.channel,
          lead.address,
          lead.location,
          lead.requirements,
        ].some((value) => includesSearch(value, search));

      const matchesWork = matchesWorkFilter(lead, activeWorkFilter);
      const matchesCustomerStage = activeStage === CONVERTED_STAGE && isCustomerRecord(lead);

      let matchesStage = matchesCustomerStage || activeStage === "All" || stageData.stage === activeStage;

// Special handling for Won stage
if (activeStage === "Won") {
  if (activeWorkFilter === "Active Works") {
    // Show only Won leads that are NOT converted
    matchesStage =
      stageData.stage === "Won" &&
      !isConverted(lead);
  }

  if (activeWorkFilter === "Done Works") {
    // Show only converted customers
    matchesStage =
      stageData.stage === "Won" &&
      isConverted(lead);
  }
}

      const matchesPlan =
        activePlan === "All" ||
        normalizeFilterValue(lead.plan || lead.subscription_plan) === normalizeFilterValue(activePlan);

      return (matchesCustomerStage || matchesWork) && matchesSearch && matchesStage && matchesPlan;
    }),
  }))
  .filter((stage) => activeStage === "All" || stage.stage === activeStage);
  return (
    // ✅ removed overflow-x-hidden (clips modals/dropdowns), added responsive padding
    // <div className="space-y-4 md:space-y-6 p-1">
<div className="space-y-4 md:space-y-6 p-1 w-full max-w-full">
      {/* ✅ responsive title size */}
      <div>
        <h1 className="text-[22px] sm:text-[28px] md:text-[32px] font-bold text-[#111111]">
          Lead & Sales
        </h1>
      
      </div>

      <LeadStatsSection refreshKey={refreshKey} />
<div
  className="
    bg-white
    rounded-[28px]
    border border-gray-100
    shadow-[0_8px_30px_rgba(0,0,0,0.04)]
    
  "
>

  {/* TOP FILTER AREA */}
  <div className="px-3 sm:px-5 md:px-6 pt-4 sm:pt-5">
  <LeadFilterBar
  searchTerm={searchTerm}
  setSearchTerm={setSearchTerm}
  workCounts={workCounts}
  activeWorkFilter={activeWorkFilter}
  setActiveWorkFilter={setActiveWorkFilter}
  activeStage={activeStage}
  setActiveStage={setActiveStage}
  activePlan={activePlan}
  setActivePlan={setActivePlan}
  onLeadCreated={fetchLeads}
  leadsData={leadsData}
/>
  </div>



  {/* PIPELINE AREA */}
  <div className="p-2 sm:p-4 md:p-5">
      <LeadPipelineSection
        leadsData={filteredLeads}
        activeStage={activeStage}
        onRefresh={fetchLeads}
      />
  </div>

</div>

    </div>
  );
};

export default LeadSales;
