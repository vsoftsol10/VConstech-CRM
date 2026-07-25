import { useEffect, useMemo, useState } from "react";
import SalesStats from "../../components/department/sales/SalesStats";
import SalesChart from "../../components/department/sales/SalesChart";
import SalesTeamMembers from "../../components/department/sales/SalesTeamMembers";
import SalesTasks from "../../components/department/sales/SalesTasks";
import SalesMemberDetails from "../../components/department/sales/SalesMemberDetails";
import { API_BASE_URL } from "../../config/api";

const emptyDashboard = {
  stats: [],
  salesPerformance: [],
  teamMembers: [],
  tasksDueToday: [],
  leads: [],
};

const parseApiResponse = async (res) => {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Backend returned HTML instead of JSON. Restart the backend server.");
  }
};

export default function SalesPage() {
  const [selectedId, setSelectedId] = useState(null);
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [dashboard, setDashboard] = useState(emptyDashboard);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSalesDashboard = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/departments/sales/dashboard`);
        const json = await parseApiResponse(res);

        if (!res.ok || !json.success) {
          throw new Error(json.error || "Failed to load sales dashboard.");
        }

        const data = json.data || emptyDashboard;
        const firstMemberId = data.teamMembers?.[0]?.id || null;
        setDashboard({
          stats: data.stats || [],
          salesPerformance: data.salesPerformance || [],
          teamMembers: data.teamMembers || [],
          tasksDueToday: data.tasksDueToday || [],
          leads: data.leads || [],
        });
        setSelectedId(firstMemberId);
        setSelectedTasks(
          firstMemberId
            ? (data.tasksDueToday || []).filter((task) => task.memberId === firstMemberId)
            : []
        );
        setError("");
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSalesDashboard();
  }, []);

  const handleMemberSelect = async (memberId) => {
    setSelectedId(memberId);
    setSelectedTasks([]);
    setTasksLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/departments/sales/members/${memberId}/tasks-due-today`);
      const json = await parseApiResponse(res);

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to load member tasks.");
      }

      setSelectedTasks(json.data || []);
      setError("");
    } catch (err) {
      setSelectedTasks([]);
      setError(err.message || "Failed to load member tasks.");
    } finally {
      setTasksLoading(false);
    }
  };

  const selectedMember = useMemo(
    () => dashboard.teamMembers.find((member) => member.id === selectedId) || null,
    [dashboard.teamMembers, selectedId]
  );

  const selectedLeads = useMemo(() => {
    if (!selectedMember) return [];
    const assignmentIds = [selectedMember.id, selectedMember.employeeId]
      .filter(Boolean)
      .map(String);

    return dashboard.leads.filter((lead) => assignmentIds.includes(String(lead.assigned_to)));
  }, [dashboard.leads, selectedMember]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[32px] font-bold text-[#111111]">Sales</h1>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-500">
          {error}
        </div>
      )}

    

      <SalesStats stats={dashboard.stats} loading={loading} />

      <SalesChart data={dashboard.salesPerformance} loading={loading} />
      <SalesTasks />

      <div className="flex flex-col lg:flex-row gap-6">
        <SalesTeamMembers
          members={dashboard.teamMembers}
          selectedId={selectedId}
          onSelect={handleMemberSelect}
          loading={loading}
        />
        <SalesMemberDetails
          member={selectedMember}
          tasks={selectedTasks}
          leads={selectedLeads}
          loading={loading}
          tasksLoading={tasksLoading}
        />
      </div>
    </div>
  );
}
