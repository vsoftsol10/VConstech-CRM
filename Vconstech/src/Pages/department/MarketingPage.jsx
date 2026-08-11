import { useState } from "react";
import StatsCards  from "../../components/department/marketing/StatsCards";
import FilterTabs  from "../../components/department/marketing/FilterTabs";
import TicketBoard from "../../components/department/marketing/TicketBoard";

export default function MarketingPage() {
  const [activeTab,            setActiveTab]            = useState("All");
  const [selectedMedia,        setSelectedMedia]        = useState("All");
  const [selectedAvailability, setSelectedAvailability] = useState("All");
  const [selectedAction,       setSelectedAction]       = useState("All");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[32px] font-bold text-[#111111]">Marketing</h1>
      </div>

      <StatsCards />

      <FilterTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedMedia={selectedMedia}
        setSelectedMedia={setSelectedMedia}
        selectedAvailability={selectedAvailability}
        setSelectedAvailability={setSelectedAvailability}
        selectedAction={selectedAction}
        setSelectedAction={setSelectedAction}
      />

      {/* ✅ All 4 filter values passed to TicketBoard */}
      <TicketBoard
        activeTab={activeTab}
        selectedMedia={selectedMedia}
        selectedAvailability={selectedAvailability}
        selectedAction={selectedAction}
      />
    </div>
  );
}