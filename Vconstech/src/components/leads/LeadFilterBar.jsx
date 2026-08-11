import { useEffect, useRef, useState } from "react";
import { FiCheck, FiFilter, FiSearch } from "react-icons/fi";
import AddLeadModal from "./AddleadForm";

const plans = ["All", "none", "trial", "basic", "premium", "advanced"];

const formatPlanLabel = (plan) =>
  plan === "All" ? plan : plan.charAt(0).toUpperCase() + plan.slice(1);

const chipClass = (active) => `
  h-9 sm:h-10 px-3 sm:px-4 rounded-full border
  inline-flex items-center gap-2 whitespace-nowrap shrink-0
  text-xs sm:text-sm font-semibold transition-all duration-200
  ${active
    ? "bg-[#F5C518] border-[#F5C518] text-black shadow-sm"
    : "bg-white border-gray-200 text-gray-600 hover:bg-[#FFFBF0] hover:border-[#F5C518]"
  }
`;

const LeadFilterBar = ({
  searchTerm,
  setSearchTerm,
  workCounts,
  activeWorkFilter,
  setActiveWorkFilter,
  activeStage,
  setActiveStage,
  activePlan,
  setActivePlan,
  onLeadCreated,
  leadsData,
}) => {
  const [showFilter, setShowFilter] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const dropdownRef = useRef(null);

  const stageCounts = leadsData.map((stage) => ({
    label: stage.stage,
    count: stage.leads.length,
  }));
  const workChipCounts = workCounts || [];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowFilter(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      {showModal && (
        <AddLeadModal
          onClose={() => setShowModal(false)}
          onSubmit={(formData) => {
            onLeadCreated?.(formData);
            setShowModal(false);
          }}
        />
      )}

      <div className="mb-5 sm:mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-4">
          <div className="
            flex items-center gap-2 h-11 sm:h-12 px-3 sm:px-4
            rounded-xl border border-gray-200 bg-white
            w-full lg:flex-1 min-w-0
            focus-within:border-[#F5C518] focus-within:ring-2 focus-within:ring-[#F5C518]/20
            transition-all
          ">
            <FiSearch className="text-gray-400 shrink-0" size={16} />
            <input
              type="text"
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="flex-1 bg-transparent outline-none text-sm text-gray-700 placeholder:text-gray-400 min-w-0"
            />
          </div>

          <div className="flex items-center gap-2 w-full lg:w-auto">
            <button
              onClick={() => setShowModal(true)}
              className="
                flex-1 sm:flex-none h-11 sm:h-12 px-4 sm:px-5
                rounded-xl bg-[#F5C518] text-black
                text-[13px] sm:text-sm font-semibold
                hover:bg-[#e4b700] active:scale-95
                transition-all duration-200 whitespace-nowrap shadow-sm
              "
            >
              + Add Lead
            </button>

            <div className="relative shrink-0" ref={dropdownRef}>
              <button
                onClick={() => setShowFilter((visible) => !visible)}
                className={`
                  h-11 sm:h-12 px-4 sm:px-5
                  rounded-xl border flex items-center gap-2
                  text-[13px] sm:text-sm font-medium
                  transition-all duration-200 whitespace-nowrap
                  ${showFilter
                    ? "bg-[#F5C518] border-[#F5C518] text-black"
                    : "border-yellow-300 bg-white text-gray-700 hover:bg-gray-50"
                  }
                `}
              >
                <FiFilter size={14} />
                Filters
                {activePlan !== "All" && (
                  <span className="ml-0.5 px-1.5 py-0.5 bg-black text-white text-[9px] font-bold rounded-full">
                    1
                  </span>
                )}
              </button>

              {showFilter && (
                <div className="
                  absolute right-0 top-[calc(100%+8px)]
                  w-44 sm:w-48 bg-white border border-gray-200
                  rounded-2xl shadow-xl z-50 overflow-hidden py-2
                ">
                  {plans.map((plan) => (
                    <button
                      key={plan}
                      onClick={() => {
                        setActivePlan(plan);
                        setShowFilter(false);
                      }}
                      className={`
                        w-full px-4 py-2.5 flex items-center justify-between
                        text-[13px] font-medium transition-all duration-200
                        ${activePlan === plan
                          ? "bg-[#FFF9E0] text-[#C89B00]"
                          : "text-gray-700 hover:bg-[#FFFBF0]"
                        }
                      `}
                    >
                      {formatPlanLabel(plan)}
                      {activePlan === plan && (
                        <FiCheck className="text-[#F5C518]" size={13} />
                      )}
                    </button>
                  ))}

                  {activePlan !== "All" && (
                    <>
                      <div className="mx-3 my-1.5 border-t border-gray-100" />
                      <button
                        onClick={() => {
                          setActivePlan("All");
                          setShowFilter(false);
                        }}
                        className="
                          w-full px-4 py-2 text-left
                          text-[12px] font-semibold text-red-500
                          hover:bg-red-50 transition-all duration-200
                        "
                      >
                        Clear filter
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3 rounded-2xl bg-gray-50/70 border border-gray-100 p-3 sm:p-4">
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wide text-gray-400">
              Work status
            </span>
            <div className="flex items-center gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
              {workChipCounts.map((work) => (
                <button
                  key={work.label}
                  onClick={() => setActiveWorkFilter(work.label)}
                  className={chipClass(activeWorkFilter === work.label)}
                >
                  {work.label}
                  <span className="text-[10px] sm:text-[11px] font-bold opacity-60">
                    {work.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wide text-gray-400">
              Lead stage
            </span>
            <div className="flex items-center gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
              {stageCounts.map((stage) => (
                <button
                  key={stage.label}
                  onClick={() => setActiveStage(stage.label)}
                  className={chipClass(activeStage === stage.label)}
                >
                  {stage.label}
                  <span className="text-[10px] sm:text-[11px] font-bold opacity-60">
                    {stage.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LeadFilterBar;
