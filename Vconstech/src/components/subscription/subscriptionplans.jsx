import { useEffect, useState, useRef } from "react";
import {
  FiMoreVertical,
  FiEdit2,
  FiTrash2,
  FiCheck,
} from "react-icons/fi";
import { API_BASE_URL } from "../../config/api";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import EditPlanModal from "./PlanEdit";
export function SubscriptionPlans() {
  const navigate = useNavigate();

  
  const [plans, setPlans] = useState([]);
const [openMenu, setOpenMenu] = useState(null);
const menuRef = useRef(null);
const [expandedPlan, setExpandedPlan] = useState(null);
const [editingPlan, setEditingPlan] = useState(null);
  useEffect(() => {
    fetchPlans();
  }, []);
const planOrder = {
  "Free Trial": 1,
  Basic: 2,
  Premium: 3,
  Advance: 4,
  Advanced: 4,
};
useEffect(() => {
  const handleClickOutside = (event) => {
    if (menuRef.current && !menuRef.current.contains(event.target)) {
      setOpenMenu(null);
    }
  };

  document.addEventListener("mousedown", handleClickOutside);

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []);
  const fetchPlans = async () => {
    const res = await fetch(`${API_BASE_URL}/api/plans`);
    const data = await res.json();
    setPlans(data);
  };

 const editPlan = (plan) => {
  console.log("Edit clicked", plan);
  setEditingPlan(plan); // 🔥 THIS OPENS THE MODAL
};
const closeModal = () => {
  setEditingPlan(null);
};
 const deletePlan = async (plan) => {
  const confirmDelete = window.confirm(
    `Are you sure you want to delete "${plan.name}" plan?`
  );

  if (!confirmDelete) return;

  alert("Plan delete is not available because the backend does not define DELETE /api/plans/:id.");
};
 const savePlan = async (updatedPlan) => {
  try {
    const payload = {
      ...updatedPlan,
      price: updatedPlan.price === "" ? null : Number(updatedPlan.price),
    };

    const res = await fetch(`${API_BASE_URL}/api/plans/${editingPlan.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (data.success) {
      fetchPlans();
      setEditingPlan(null);
    } else {
      alert("Update failed: " + data.message);
    }
  } catch (err) {
    console.log(err);
  }
};
const sortedPlans = [...plans].sort((a, b) => {
  return (planOrder[a.name] || 999) - (planOrder[b.name] || 999);
});

  return (
    <div>
       <div className="flex  mt-4 mb-6">
  
  {/* Back Button */}
<button
  onClick={() => navigate(-1)}
  className="p-2 hover:bg-gray-100 rounded-md transition"
>
  <FiArrowLeft className="text-xl" />
</button>

  {/* Title */}
  <h2 className="text-2xl md:text-3xl font-bold   mx-2">
    Plans
  </h2>

  {/* Spacer (keeps center title balanced) */}
  <div className="w-[90px]" />
</div>
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mt-6">
      
      {sortedPlans.map((plan) => (
        <div
          key={plan.id}
          className="bg-white rounded-2xl shadow-sm border p-5 relative"
        >
          {/* Header */}
          <div className="flex justify-between items-start">
            <h3 className="text-xl font-semibold">
  {plan.name}
</h3>

            <div className="relative">
              <button
                onClick={() =>
                  setOpenMenu(
                    openMenu === plan.id
                      ? null
                      : plan.id
                  )
                }
              >
                <FiMoreVertical size={20} />
              </button>

              {openMenu === plan.id && (
                <div className="relative" ref={menuRef}>
                <div className="absolute right-0 top-8 bg-white shadow-lg rounded-xl border w-40 z-50">
                  <button
                    onClick={() => editPlan(plan)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <FiEdit2 />
                    Edit
                  </button>

                  <button
                    onClick={() =>
                      deletePlan(plan)
                    }
                    className="w-full text-left px-4 py-3 hover:bg-gray-100 flex items-center gap-2 text-red-500"
                  >
                    <FiTrash2 />
                    Delete
                  </button>
                </div>
               </div> 
              )}
            </div>
          </div>

          {/* Price */}
          <div className="mt-4">
            <h2 className="text-3xl font-bold text-yellow-500">
  ₹ {plan.price}
</h2>

            <p className="text-gray-500">
              {plan.duration}
            </p>
          </div>

          {/* Description */}
          <p className="text-gray-600 mt-4 text-sm">
            {plan.description}
          </p>

          {/* Features */}
<div className="relative group mt-4">
  
  {/* visible chips */}
  <div className="flex flex-wrap gap-2">
    {plan.features?.slice(0, 4).map((f) => (
      <span
        key={f.id}
        className="text-xs px-2 py-1 "
      >
        {f.feature_name}
      </span>
    ))}

    {plan.features?.length > 4 && (
      <span className="text-xs text-blue-500 px-2 py-1 cursor-pointer">
        +{plan.features.length - 4} more
      </span>
    )}
  </div>

  {/* tooltip */}
  {plan.features?.length > 4 && (
    <div className="absolute left-0 top-full mt-2 w-64 bg-white border shadow-lg rounded-lg p-3 text-xs opacity-0 group-hover:opacity-100 transition pointer-events-none z-50">
      {plan.features?.slice(4).map((f) => (
        <div key={f.id} className="py-1 flex gap-2">
          <FiCheck className="text-green-500 text-xs mt-0.5" />
          {f.feature_name}
        </div>
      ))}
    </div>
  )}

</div>
        </div>
      ))}
      {editingPlan && (
  <EditPlanModal
    plan={editingPlan}
    onClose={closeModal}
    onSave={savePlan}
  />
)}
    </div>
    </div>
  );
}
