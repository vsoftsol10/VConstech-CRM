// import TicketPage from "./TicketPage";
import TicketPage from "../components/Employee/Ticket";
// import SalesWorkspacePage from "./SalesWorkspacePage";
import SalesWorkspacePage from "../components/Employee/Salesworkspacepage";

const SALES_DEPARTMENTS = ["sales", "marketing"];

export default function WorkspacePage() {
  let department = "";
  try {
    const emp = JSON.parse(localStorage.getItem("employee") || "{}");
    department = (emp.department || "").toLowerCase();
  } catch {
    department = "";
  }

  if (SALES_DEPARTMENTS.includes(department)) {
    return <SalesWorkspacePage />;
  }

  return <TicketPage />;
}