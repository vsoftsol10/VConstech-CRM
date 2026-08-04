import { motion } from "framer-motion";
import LeadPipelineColumn from "./LeadPipelineColumn";

const LeadPipelineSection = ({ leadsData, activeStage, onRefresh }) => {
  const hasLeads = leadsData.some(
    (stage) => stage.leads.length > 0
  );

  if (!hasLeads) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <p>No leads found</p>
      </div>
    );
  }
const seenLeadIds = new Set();
const sortedLeads = leadsData
  .flatMap((stageData) => stageData.leads)
  .filter((lead) => {
    if (lead?.id === undefined || lead?.id === null) return true;
    if (seenLeadIds.has(lead.id)) return false;
    seenLeadIds.add(lead.id);
    return true;
  })
  .sort((a, b) => {
    const aPriority =
      a.status?.toLowerCase() === "won" &&
      !(a.is_customer === true || a.is_customer === "true")
        ? 0
        : 1;

    const bPriority =
      b.status?.toLowerCase() === "won" &&
      !(b.is_customer === true || b.is_customer === "true")
        ? 0
        : 1;

    return aPriority - bPriority;
  });
 return (
  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
    {sortedLeads.map((lead, i) => (
      <motion.div
        key={lead.id}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.3,
          delay: i * 0.06,
        }}
      >
        <LeadPipelineColumn
          lead={lead}
          stage={lead.status}
          activeStage={activeStage}
          onRefresh={onRefresh}
        />
      </motion.div>
    ))}
  </div>
);
};

export default LeadPipelineSection;
