import OverPerformanceChart from "../components/department/OverPerformanceChart";
import DepartmentHealthOverview from "../components/department/DepartmentHealthOverview";
import DepartmentMemberColumns from "../components/department/DepartmentMemberColumns";
import DepartmentStatCards from "../components/department/DepartmentStatCards";
const Department = () => {
  return (
    <div className="p-6 flex flex-col gap-6 min-h-screen bg-[#f8f9fb]">
      <h1 className="text-2xl font-bold text-gray-800">Department</h1>
        <DepartmentStatCards/>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-4">
        <OverPerformanceChart />
        <DepartmentHealthOverview />
      </div>
      <DepartmentMemberColumns />
    </div>
  );
};

export default Department;
