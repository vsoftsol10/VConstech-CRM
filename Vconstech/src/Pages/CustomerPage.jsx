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
function formatExportValue(value) {
  if (value == null || value === "") return "-";
  if (typeof value === "boolean") return value ? "Active" : "Inactive";
  return String(value);
}

function formatExportDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).split("T")[0] || "-";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function pickFirst(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== "");
}

function parseCustomerDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) return parsed;

  const match = String(value).trim().match(/^(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{4})$/);
  if (!match) return null;

  const month = new Date(`${match[2]} 1, ${match[3]}`).getMonth();
  if (Number.isNaN(month)) return null;
  return new Date(Number(match[3]), month, Number(match[1]));
}

function isActiveByExpiry(customer, renewalDate) {
  const expiry = parseCustomerDate(renewalDate);
  const status = String(
    pickFirst(customer.subscription_status, customer.subscriptionStatus, customer.payment_status, customer.paymentStatus, customer.accountStatus, customer.status, "")
  ).toLowerCase();

  if (expiry) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expiry.setHours(0, 0, 0, 0);
    return expiry >= today && !/(expired|inactive|cancelled|canceled)/.test(status);
  }

  if (/(expired|inactive|cancelled|canceled)/.test(status)) return false;
  if (/(active|paid)/.test(status)) return true;
  return Boolean(customer.active ?? customer.isActive);
}

function getHistoryCustomerId(customer) {
  const crmId = pickFirst(customer.crm_customer_id, customer.crmCustomerId);
  if (crmId) return crmId;

  const erpId = String(pickFirst(customer.erp_customer_id, customer.erpCustomerId, ""));
  if (erpId.startsWith("ERP-CUST-")) return erpId;

  const id = String(customer.id || "");
  return /^\d+$/.test(id) || id.startsWith("ERP-CUST-") ? id : null;
}

function getCustomerSortTime(customer) {
  const date = parseCustomerDate(
    pickFirst(
      customer.created_at,
      customer.createdAt,
      customer.start_date,
      customer.startDate,
      customer.subscription_start_date,
      customer.subscriptionStartedAt,
      customer.trialStartDate
    )
  );
  return date ? date.getTime() : 0;
}

function getCustomerSortId(customer) {
  const idText = String(pickFirst(customer.id, customer.erp_customer_id, customer.erpCustomerId, "")).trim();
  const numbers = idText.match(/\d+/g);
  return numbers ? Number(numbers[numbers.length - 1]) : 0;
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

      const normalized = unwrapCustomerList(res.data).map((c) => {
        const plan = pickFirst(c.subscription_plan, c.subscriptionPlan, c.plan, c.package);
        const renewalDate = pickFirst(
          c.renewal_date,
          c.renewalDate,
          c.subscription_end_date,
          c.subscriptionEndDate,
          c.trialEndDate,
          c.expire,
          c.expires_at
        );
        const startDate = pickFirst(
          c.start_date,
          c.startDate,
          c.subscription_start_date,
          c.subscriptionStartedAt,
          c.subscriptionStartDate,
          c.trialStartDate,
          c.createdAt
        );
        const amount = pickFirst(
          c.subscription_amount,
          c.subscriptionAmount,
          c.plan_price,
          c.planPrice,
          c.packagePrice,
          c.price,
          c.amount
        );

        return {
        id:           c.id,
        source:       "erp",
          raw:          c,
          crm_customer_id: c.crm_customer_id || c.crmCustomerId,
          erp_customer_id: c.erp_customer_id || c.erpCustomerId,
        erp_client_id: c.erp_client_id || c.companyId || c.clientId,
        name:         c.customer_name || c.name || c.userName || "",
        customer_name: c.customer_name || c.name || c.userName || "",
        email:        c.email || c.userEmail || c.clientEmail || "",
        phone:        c.phone || c.phoneNumber || c.clientPhone || "",
        company:      c.company_name || c.companyName || c.company?.name || "",
        company_name: c.company_name || c.companyName || c.company?.name || "",
        plan:         formatPlanLabel(plan),
        subscription_plan: formatPlanLabel(plan),
        subscription_amount: amount ?? "",
          payment_status: pickFirst(c.payment_status, c.paymentStatus, c.subscription_status, c.subscriptionStatus, c.accountStatus),
          planColor:    getPlanColor(plan),
          start_date:   startDate || "",
          created_at:   pickFirst(c.created_at, c.createdAt, c.userCreatedAt, startDate),
          renewal_date: renewalDate || "",
          active:       isActiveByExpiry(c, renewalDate),
        members:      c.members ?? c.customMembers ?? "",
        address:      c.address || c.clientAddress || "",
        location:     c.location || c.city || "",
        city:         c.city || c.location || "",
        role:         c.role || "Admin",
        };
      });

      setCustomers(
        normalized.sort(
          (a, b) => getCustomerSortTime(b) - getCustomerSortTime(a) || getCustomerSortId(b) - getCustomerSortId(a)
        )
      );
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

const handleExport = async () => {
  const exportCustomers =
    selectedCustomers.length > 0
      ? customers.filter((customer) => selectedCustomers.includes(customer.id))
      : filteredCustomers;

  const columns = [
    ["Customer ID", "id"],
    ["Customer Name", "name"],
    ["Company", "company"],
    ["Plan", "plan"],
    ["Price", "subscription_amount"],
    ["Phone", "phone"],
    ["Email", "email"],
    ["Purchase Date", "start_date"],
    ["Renewal Date", "renewal_date"],
    ["Active", "active"],
   
  ];

  if (exportCustomers.length === 0) return;

  const doc = new jsPDF({ orientation: "landscape" });

  doc.setFontSize(14);
  doc.text(
    exportCustomers.length === 1 ? "Customer Details Report" : "Customers Report",
    14,
    15
  );
  doc.setFontSize(9);
  doc.setTextColor(150);
  doc.text(`Exported on ${new Date().toLocaleDateString()}`, 14, 22);

  if (exportCustomers.length === 1) {
    const customer = exportCustomers[0];
    let subscriptionHistory = [];
    const historyCustomerId = getHistoryCustomerId(customer);

    if (historyCustomerId) {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/customers/subscription-history/${historyCustomerId}`
        );
        subscriptionHistory = Array.isArray(res.data) ? res.data : [];
      } catch (err) {
        console.error("Failed to load subscription history for export:", err);
      }
    }

    const detailRows = [
      ["Customer ID", customer.id],
      ["Customer Name", customer.customer_name || customer.name],
      ["Company", customer.company_name || customer.company],
      ["Email", customer.email],
      ["Phone", customer.phone],
      ["Plan", customer.subscription_plan || customer.plan],
      ["Subscription Amount", customer.subscription_amount],
      ["Payment Status", customer.payment_status],
      ["Purchase Date", formatExportDate(customer.start_date)],
      ["Renewal Date", formatExportDate(customer.renewal_date)],
      ["Active", customer.active],
      ["Address", customer.address],
      ["Location", customer.location || customer.city],
      ["Role", customer.role],
      ["Notes", customer.notes],
    ].map(([label, value]) => [label, formatExportValue(value)]);

    autoTable(doc, {
      startY: 28,
      head: [["Customer Detail", "Value"]],
      body: detailRows,
      headStyles: { fillColor: [245, 197, 24], textColor: 0, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 55 } },
    });

    const historyStartY = (doc.lastAutoTable?.finalY || 28) + 12;
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text("Subscription History", 14, historyStartY);

    autoTable(doc, {
      startY: historyStartY + 5,
      head: [["Date", "Action", "Plan", "Amount", "Start Date", "End Date"]],
      body:
        subscriptionHistory.length > 0
          ? subscriptionHistory.map((item) => [
              formatExportDate(item.created_at),
              formatExportValue(item.action_type),
              formatExportValue(item.plan_name),
              formatExportValue(item.amount),
              formatExportDate(item.start_date),
              formatExportDate(item.end_date),
            ])
          : [["-", "No subscription history found", "-", "-", "-", "-"]],
      headStyles: { fillColor: [245, 197, 24], textColor: 0, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      styles: { fontSize: 8, cellPadding: 3 },
    });
  } else {
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
  }

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
