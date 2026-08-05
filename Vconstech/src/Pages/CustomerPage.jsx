import "../styles/customerAnimations.css";
import { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL,ERP_API_BASE_URL, unwrapCustomer, unwrapCustomerList } from "../config/api";

import CustomerHeader from "../components/customer/CustomerHeader";
import CustomerStats from "../components/customer/CustomerStats";
import CustomerToolbar from "../components/customer/CustomerToolbar";
import CustomerTable from "../components/customer/CustomerTable";
import CustomerMobileCards from "../components/customer/CustomerMobileCards";
import CustomerViewPanel from "../components/customer/CustomerViewPanel";
import CustomerFormPage from "../components/customer/Customerform";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ── Plan colour helper ────────────────────────────────────────────────────────
const PLAN_COLORS = {
  trial: "bg-gray-100 text-gray-600",
  trail: "bg-gray-100 text-gray-600",
  "free trial": "bg-gray-100 text-gray-600",
  starter:      "bg-blue-100 text-blue-700",
  basic:        "bg-green-100 text-green-700",
  pro:          "bg-yellow-100 text-yellow-700",
  premium:      "bg-purple-100 text-purple-700",
  business:     "bg-purple-100 text-purple-700",
  enterprise:   "bg-gray-900 text-white",
};

function getPlanColor(plan) {
  return PLAN_COLORS[(plan || "").toLowerCase()] ?? "bg-gray-100 text-gray-500";
}

function formatPlanLabel(plan) {
  const value = String(plan || "").trim();
  if (!value) return "";
  if (value.toLowerCase() === "trail") return "Trial";
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

// ── Active logic: true only when renewal_date is today or future ──────────────
function csvEscape(value) {
  const text = value == null ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export default function CustomerPage() {
  const tabs = ["All", "Active", "Inactive"];
const [currentPage, setCurrentPage] = useState(1);
const [rowsPerPage, setRowsPerPage] = useState(10);


  const [activeTab, setActiveTab]           = useState("All");
  const [customers, setCustomers]           = useState([]);
  const [tableSearch, setTableSearch]       = useState("");
  const [planFilter, setPlanFilter]         = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [viewOpen, setViewOpen]             = useState(false);
  const [formMode, setFormMode]             = useState(null); // null | "add" | "edit"
  const [editingCustomerId, setEditingCustomerId] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, tableSearch, planFilter, rowsPerPage]);

  const loadCustomers = async () => {
    try {
      const res = await axios.get(`${ERP_API_BASE_URL}/superadmin/users`);

      const normalized = unwrapCustomerList(res.data).map((c) => ({
        id:           c.id,
        source:       "erp",
        raw:          c,
        erp_customer_id: c.erp_customer_id,
        erp_client_id: c.erp_client_id || c.companyId,
        name:         c.customer_name || c.name || "",
        customer_name: c.customer_name || c.name || "",
        email:        c.email         || "",
        phone:        c.phone         || c.phoneNumber || "",
        company:      c.company_name  || c.company?.name || "",
        company_name: c.company_name  || c.company?.name || "",
        plan:         formatPlanLabel(c.subscription_plan || c.package),
        subscription_plan: formatPlanLabel(c.subscription_plan || c.package),
        planColor:    getPlanColor(c.subscription_plan || c.package),
        start_date:   c.start_date    || c.createdAt || "",
        renewal_date: c.renewal_date  || "",   // ← carry through for active check
        active:       Boolean(c.active ?? c.isActive),
        members:      c.members ?? c.customMembers ?? "",
        address:      c.address || "",
        location:     c.location || c.city || "",
        city:         c.city || c.location || "",
        role:         c.role || "Admin",
      }));

      setCustomers(normalized);
    } catch (err) {
      console.error("Failed to load customers:", err);
    }
  };

  const handleToggle = async (c) => {
    const nextActive = !c.active;
    try {
      if (c.source === "erp") {
        const res = await axios.put(`${ERP_API_BASE_URL}/superadmin/toggle-active/${c.id}`, {
          isActive: nextActive,
        });
        const updated = res.data?.user || {};
        setCustomers((prev) =>
          prev.map((item) =>
            item.id === c.id
              ? { ...item, active: Boolean(updated.isActive ?? nextActive) }
              : item
          )
        );
        if (selectedCustomer?.id === c.id) {
          setSelectedCustomer((prev) =>
            prev ? { ...prev, active: Boolean(updated.isActive ?? nextActive) } : prev
          );
        }
        return;
      }

      const res = await axios.patch(`${API_BASE_URL}/api/customers/${c.id}/status`, {
        active: nextActive,
      });
      const updated = unwrapCustomer(res.data);
      setCustomers((prev) =>
        prev.map((item) =>
          item.id === c.id
            ? {
                ...item,
                ...updated,
                name: updated.customer_name || item.name,
                company: updated.company_name || item.company,
                plan: formatPlanLabel(updated.subscription_plan || item.plan),
                planColor: getPlanColor(updated.subscription_plan || item.plan),
                active: Boolean(updated.active),
              }
            : item
        )
      );
      if (selectedCustomer?.id === c.id) {
        const detail = await axios.get(`${API_BASE_URL}/api/customers/${c.id}`);
        setSelectedCustomer(unwrapCustomer(detail.data));
      }
    } catch (err) {
      alert("Status update failed: " + (err.response?.data?.message || err.message));
    }
  };

  const togglePlanFilter = (plan) => {
    setPlanFilter((prev) =>
      prev.includes(plan) ? prev.filter((p) => p !== plan) : [...prev, plan]
    );
  };

  const handleView = async (customer) => {
    if (customer.source === "erp") {
      setSelectedCustomer(customer);
      setViewOpen(true);
      return;
    }

    try {
      const res = await axios.get(`${API_BASE_URL}/api/customers/${customer.id}`);
      setSelectedCustomer(unwrapCustomer(res.data));
      setViewOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (customer) => {
    setEditingCustomerId(customer.id);
    setEditingCustomer(customer);
    setFormMode("edit");
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this customer?")) return;
    try {
      const customer = customers.find((c) => c.id === id);
      if (customer?.source === "erp") {
        await axios.delete(`${ERP_API_BASE_URL}/superadmin/delete-user/${id}`);
      } else {
        await axios.delete(`${API_BASE_URL}/api/customers/${id}`);
      }
      setCustomers((prev) => prev.filter((c) => c.id !== id));
      setSelectedCustomers((prev) => prev.filter((customerId) => customerId !== id));
      if (selectedCustomer?.id === id) setViewOpen(false);
    } catch (err) {
      alert("Delete failed: " + (err.response?.data?.message || err.message));
    }
  };

  const handleAddCustomer = () => {
    setFormMode("add");
    setEditingCustomerId(null);
    setEditingCustomer(null);
  };

  const handleCloseForm = () => {
    setFormMode(null);
    setEditingCustomerId(null);
    setEditingCustomer(null);
  };

  const handleFormSuccess = () => {
    loadCustomers();
    handleCloseForm();
  };

const handleExport = () => {
  const exportCustomers =
    selectedCustomers.length > 0
      ? customers.filter((customer) => selectedCustomers.includes(customer.id))
      : filteredCustomers;

  const columns = [
    ["Customer ID", "id"],
    ["Customer Name", "name"],
    ["Company", "company"],
    ["Plan", "plan"],
    ["Phone", "phone"],
    ["Email", "email"],
    ["Purchase Date", "start_date"],
    ["Renewal Date", "renewal_date"],
    ["Active", "active"],
   
  ];

  const doc = new jsPDF({ orientation: "landscape" });

  doc.setFontSize(14);
  doc.text("Customers Report", 14, 15);
  doc.setFontSize(9);
  doc.setTextColor(150);
  doc.text(`Exported on ${new Date().toLocaleDateString()}`, 14, 22);

  autoTable(doc, {
    startY: 28,
    head: [columns.map(([label]) => label)],
    body: exportCustomers.map((customer) =>
      columns.map(([, key]) => {
        if (key === "active") return customer.active ? "Active" : "Inactive";
        return customer[key] ?? "";
      })
    ),
    headStyles: { fillColor: [245, 197, 24], textColor: 0, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [250, 250, 250] },
    styles: { fontSize: 8, cellPadding: 3 },
  });

  doc.save(`customers-${new Date().toISOString().slice(0, 10)}.pdf`);
  if (selectedCustomers.length > 0) {
    setSelectedCustomers([]);
  }
};
 
 

  // ── Filtered list ─────────────────────────────────────────────────────────
  const filteredCustomers = customers.filter((c) => {
    const matchesTab =
      activeTab === "All"      ? true :
      activeTab === "Active"   ? c.active :
                                 !c.active;

    const search = (tableSearch || "").toLowerCase();
    const matchesSearch =
      String(c.id || "").toLowerCase().includes(search) ||
      String(c.erp_customer_id || "").toLowerCase().includes(search) ||
      String(c.erp_client_id || "").toLowerCase().includes(search) ||
      (c.name || "").toLowerCase().includes(search) ||
      (c.company || "").toLowerCase().includes(search) ||
      (c.plan || "").toLowerCase().includes(search) ||
      (c.phone || "").toLowerCase().includes(search) ||
      (c.email || "").toLowerCase().includes(search);

    const matchesPlan =
      planFilter.length === 0 || planFilter.includes(c.plan);

    return matchesTab && matchesSearch && matchesPlan;
    
  });
const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / rowsPerPage));

useEffect(() => {
  if (currentPage > totalPages) setCurrentPage(totalPages);
}, [currentPage, totalPages]);

const paginatedCustomers = filteredCustomers.slice(
  (currentPage - 1) * rowsPerPage,
  currentPage * rowsPerPage
);
  const emptyMessage = `No ${activeTab.toLowerCase()} customers found`;

  const sharedProps = {
    filteredCustomers,
    handleToggle,
    emptyMessage,
    tabs,
    activeTab,
    setActiveTab,
    customers,
    tableSearch,
    setTableSearch,
    planFilter,
    togglePlanFilter,
    onView:   handleView,
    onEdit:   handleEdit,
    onDelete: handleDelete,
    selectedCustomers,
    setSelectedCustomers,
  };

  return (
    <div className="w-full p-4 md:p-1 font-sans overflow-x-hidden">
      <CustomerHeader onExport={handleExport} />
      <CustomerStats customers={customers} />

      <div className="anim-fadeUp bg-white rounded-2xl border border-gray-100">
        <CustomerToolbar
          tabs={tabs}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          customers={customers}
          tableSearch={tableSearch}
          setTableSearch={setTableSearch}
          planFilter={planFilter}
          togglePlanFilter={togglePlanFilter}
          onAddCustomer={handleAddCustomer}
        />

        <div className="hidden md:block w-full min-w-0">
          <CustomerTable
  {...sharedProps}
  filteredCustomers={paginatedCustomers}
  currentPage={currentPage}
  setCurrentPage={setCurrentPage}
  totalPages={totalPages}
  totalRecords={filteredCustomers.length}
  rowsPerPage={rowsPerPage}
  setRowsPerPage={setRowsPerPage}
/>
        </div>

        <div className="block md:hidden">
          <CustomerMobileCards {...sharedProps} />
        </div>
      </div>

      {viewOpen && selectedCustomer && (
        <CustomerViewPanel
          customer={selectedCustomer}
          onClose={() => setViewOpen(false)}
          onToggle={handleToggle}
          onEdit={handleEdit}
        />
      )}

      {formMode && (
        <CustomerFormPage
          propId={formMode === "edit" ? editingCustomerId : null}
          initialCustomer={editingCustomer}
          source={editingCustomer?.source}
          isNew={formMode === "add"}
          modalMode={true}
          onClose={handleCloseForm}
          onCustomerAdded={handleFormSuccess}
          onRefresh={loadCustomers}
        />
      )}
    </div>
  );
}
