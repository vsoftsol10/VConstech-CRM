
import Modal from "./Modal";
import { useNavigate } from "react-router-dom";
const API = "http://localhost:5000";

const Row = ({ label, value }) => (
  <div className="flex justify-between items-center py-2.5 border-b border-gray-100 last:border-0">
    <span className="text-sm text-gray-500 font-medium">{label}</span>
    <span className="text-sm font-semibold text-gray-800">{value || "—"}</span>
  </div>
);

const Badge = ({ text, color }) => (
  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${color}`}>
    {text}
  </span>
);

const statusColor = {
  Active:     "bg-green-100 text-green-700",
  Inactive:   "bg-red-100 text-red-700",
  "On Leave": "bg-yellow-100 text-yellow-700",
};

// Format "2024-06-15" → "15 Jun 2024"
function formatDate(raw) {
  if (!raw) return "—";
  return new Date(raw).toLocaleDateString("en-IN", {
    day:   "2-digit",
    month: "short",
    year:  "numeric",
  });
}
function getWorkloadItems(member) {
  const department = String(member.department || "").toLowerCase();
  const counts = {
    Leads: Number(member.lead_count || 0),
    Tasks: Number(member.task_count || 0),
    Tickets: Number(member.ticket_count || 0),
  };

  if (department === "sales") return [["Leads", counts.Leads], ["Tasks", counts.Tasks]];
  if (department === "support") return [["Leads", counts.Leads], ["Tasks", counts.Tasks], ["Tickets", counts.Tickets]];
  if (department === "technical") return [["Tasks", counts.Tasks], ["Tickets", counts.Tickets]];
  return [["Leads", counts.Leads], ["Tasks", counts.Tasks], ["Tickets", counts.Tickets]];
}
export default function ViewMemberModal({ member, onClose,onEdit }) {
   const navigate = useNavigate();
  // ✅ profile image URL from backend static folder
  const imageUrl = member.profile_image
    ? `${API}/uploads/${member.profile_image}`
    : null;
const workloadItems = getWorkloadItems(member);
const totalWorkload = workloadItems.reduce((sum, [, count]) => sum + count, 0);
  return (
    <Modal title="Team Member Details" onClose={onClose}>
      <div className="space-y-4">

        <div
          className="flex items-center gap-4 pb-4 border-b border-gray-100 animate-fieldIn"
          style={{ animationFillMode: "both" }}
        >
          {/* ✅ profile_image with initial fallback */}
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={member.name}
              className="w-14 h-14 rounded-full object-cover border-2 border-yellow-200 shrink-0"
              onError={(e) => {
                e.target.style.display = "none";
                e.target.nextSibling.style.display = "flex";
              }}
            />
          ) : null}

          <div
            className="w-14 h-14 rounded-full bg-yellow-100 items-center justify-center text-2xl font-bold text-yellow-600 shrink-0"
            style={{ display: imageUrl ? "none" : "flex" }}
          >
            {member.name?.[0]?.toUpperCase() || "?"}
          </div>

          <div>
            <p className="text-lg font-bold text-gray-800">{member.name}</p>
            <p className="text-sm text-gray-500">{member.designation || member.role || "—"}</p>
            {/* ✅ employee_id shown under name */}
            {member.employee_id && (
              <p className="text-xs font-mono text-gray-400 mt-0.5">{member.employee_id}</p>
            )}
          </div>
        </div>

        {/* ── Personal ──────────────────────────────────────────────────── */}
        <div
          className="animate-fieldIn"
          style={{ animationDelay: "60ms", animationFillMode: "both" }}
        >
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Personal</p>
          <Row label="Email" value={member.email} />
          <Row label="Phone" value={member.phone} />
        </div>

        {/* ── Work ──────────────────────────────────────────────────────── */}
        <div
          className="animate-fieldIn"
          style={{ animationDelay: "120ms", animationFillMode: "both" }}
        >
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Work</p>
          <Row label="Department"    value={member.department} />
          <Row label="Role"          value={member.role} />
          <Row label="Designation"   value={member.designation} />

          {/* ✅ employee_id  (was member.employeeId ❌) */}
          <Row label="Employee ID"   value={member.employee_id} />

          {/* ✅ date_joined formatted (was member.dateOfJoining ❌) */}
          <Row label="Date of Joining" value={formatDate(member.date_joined)} />

          <div className="flex justify-between items-center py-2.5 border-b border-gray-100">
            <span className="text-sm text-gray-500 font-medium">Status</span>
            <Badge
              text={member.status || "Active"}
              color={statusColor[member.status] || "bg-green-100 text-green-700"}
            />
          </div>

<div className="py-2.5">
  <div className="flex justify-between items-center gap-3">
    <span className="text-sm text-gray-500 font-medium">Workload</span>
    <span className="text-sm font-bold text-gray-800">{totalWorkload}</span>
  </div>
  <div className="mt-2 flex flex-wrap justify-end gap-1.5">
    {workloadItems.map(([label, count]) => (
      <Badge
        key={label}
        text={`${label}: ${count}`}
        color="border border-gray-200 bg-white text-gray-700"
      />
    ))}
  </div>
</div>
<button
  onClick={() => {
    onClose();
    navigate(`/team-members/edit/${member.id}`);
  }}
>
  Edit
</button>
        </div>

      </div>
    </Modal>
  );
}
