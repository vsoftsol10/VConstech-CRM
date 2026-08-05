import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import Select from "react-select";
import { FiX } from "react-icons/fi";
import axios from "axios";
import { API_BASE_URL, ERP_API_BASE_URL, unwrapCustomer, unwrapCustomerList } from "../../config/api";

const YELLOW = "#F5C518";

const PLANS = [
  { value: "Trial", label: "Trial" },
  { value: "Basic", label: "Basic" },
  
  { value: "Premium", label: "Premium" },
  { value: "Advanced", label: "Advanced" },
];

const emailPattern = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const phonePattern = /^[6-9]\d{9}$/;

const inputCls = (hasError) =>
  `w-full px-3 py-2.5 text-sm border rounded-xl bg-gray-50 outline-none transition-colors ${
    hasError ? "border-red-400 focus:border-red-400" : "border-gray-200 focus:border-[#F5C518]"
  }`;

const selectStyles = (hasError) => ({
  control: (base, state) => ({
    ...base,
    minHeight: 42,
    borderRadius: 12,
    borderColor: hasError ? "#f87171" : state.isFocused ? YELLOW : "#e5e7eb",
    boxShadow: "none",
    backgroundColor: "#F9FAFB",
    cursor: "pointer",
    fontSize: 14,
    transition: "border-color .15s",
    "&:hover": {
      borderColor: hasError ? "#f87171" : state.isFocused ? YELLOW : "#d1d5db",
    },
  }),
  valueContainer: (base) => ({ ...base, padding: "0 10px" }),
  placeholder: (base) => ({ ...base, color: "#9CA3AF", fontSize: 14 }),
  singleValue: (base) => ({ ...base, color: "#111827", fontSize: 14 }),
  indicatorSeparator: () => ({ display: "none" }),
  dropdownIndicator: (base, state) => ({
    ...base,
    color: state.isFocused ? YELLOW : "#9CA3AF",
    transition: "color .15s, transform .2s",
    transform: state.selectProps.menuIsOpen ? "rotate(180deg)" : "rotate(0deg)",
    paddingRight: 10,
  }),
  menu: (base) => ({
    ...base,
    borderRadius: 14,
    overflow: "hidden",
    border: "1px solid #f1f1f1",
    boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
    zIndex: 9999,
    marginTop: 5,
  }),
  menuList: (base) => ({ ...base, padding: "5px" }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected ? YELLOW : state.isFocused ? "#FFFAE6" : "#fff",
    color: state.isSelected ? "#1a1400" : "#111827",
    fontSize: 14,
    fontWeight: state.isSelected ? 600 : 400,
    cursor: "pointer",
    padding: "10px 12px",
    borderRadius: 8,
  }),
});

const Field = ({ label, error, children }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
    {children}
    {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
  </div>
);

function toInputDate(value) {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.split("T")[0];
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().split("T")[0];
}

function findPlan(value) {
  return PLANS.find((item) => item.label.toLowerCase() === String(value || "").toLowerCase()) || null;
}

function customerToForm(data = {}) {
  return {
    customer_name: data.customer_name || data.name || "",
    company_name: data.company_name || data.company || data.company?.name || "",
    phone: String(data.phone || data.phoneNumber || "").replace(/\D/g, ""),
    email: data.email || "",
    address: data.address || "",
    location: data.location || data.city || "",
    subscription_plan: findPlan(data.subscription_plan || data.plan || data.package),
    purchase_date: toInputDate(data.start_date || data.createdAt),
    renewal_date: toInputDate(data.renewal_date),
    notes: data.notes || "",
  };
}

export default function CustomerFormPage({
  propId,
  initialCustomer,
  source,
  onClose,
  modalMode = false,
  isNew = false,
  onCustomerAdded,
  onRefresh,
}) {
  const { id: paramId } = useParams();
  const id = propId || paramId;
  const isErpCustomer = source === "erp" || initialCustomer?.source === "erp";
  const navigate = useNavigate();
  const [form, setForm] = useState({
    customer_name: "",
    company_name: "",
    phone: "",
    email: "",
    address:"",
    location:"",

    subscription_plan: null,
    purchase_date: "",
    renewal_date: "",
    notes: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(!isNew && Boolean(id) && !initialCustomer);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!modalMode) return undefined;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [modalMode]);

  useEffect(() => {
    if (!modalMode) return undefined;
    const handler = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [modalMode, onClose]);

  useEffect(() => {
    if (isNew || !initialCustomer) return;
    setForm(customerToForm(initialCustomer));
    setLoading(false);
  }, [initialCustomer, isNew]);

  useEffect(() => {
    if (isErpCustomer) return;
    if (isNew || !id) return;
    const loadCustomer = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE_URL}/api/customers/${id}`);
        const data = unwrapCustomer(res.data);
        setForm(customerToForm(data));
      } catch (err) {
        setErrors({ form: err.response?.data?.message || "Failed to load customer" });
      } finally {
        setLoading(false);
      }
    };
    loadCustomer();
  }, [id, isErpCustomer, isNew]);

  const set = (field) => (e) => {
    const rawValue = e.target.value;
    const value = field === "phone" ? rawValue.replace(/\D/g, "").slice(0, 10) : rawValue;
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "", form: "" }));
  };

  const setPlan = (plan) => {
    setForm((prev) => ({ ...prev, subscription_plan: plan }));
    setErrors((prev) => ({ ...prev, subscription_plan: "", form: "" }));
  };

  const validate = () => {
    const next = {};
    const name = form.customer_name.trim();
    const email = form.email.trim();
    const phone = form.phone.trim();

    if (!name) next.customer_name = "Customer name is required";
    else if (name.length < 3) next.customer_name = "Name must be at least 3 characters";
    if (!phone) next.phone = "Phone is required";
    else if (!/^\d+$/.test(phone)) next.phone = "Phone must contain numbers only";
    else if (!phonePattern.test(phone)) next.phone = "Enter a valid 10-digit mobile number";
    if (!email) next.email = "Email is required";
    else if (!emailPattern.test(email)) next.email = "Enter a valid email address";
    if (!form.subscription_plan) next.subscription_plan = "Plan is required";
    if (isErpCustomer) {
      if (!form.company_name.trim()) next.company_name = "Company is required";
      if (!form.location.trim()) next.location = "Location is required";
      if (!form.address.trim()) next.address = "Address is required";
    }
    return next;
  };

  const checkDuplicates = async () => {
    const currentId = String(id || "");
    const email = form.email.trim().toLowerCase();
    const phone = form.phone.trim();

    if (isErpCustomer) {
      const { data } = await axios.get(`${ERP_API_BASE_URL}/superadmin/users`);
      const duplicate = unwrapCustomerList(data).find((customer) => {
        if (String(customer.id) === currentId) return false;
        return (
          String(customer.email || "").trim().toLowerCase() === email ||
          String(customer.phoneNumber || customer.phone || "").replace(/\D/g, "") === phone
        );
      });

      if (!duplicate) return {};
      return {
        ...(String(duplicate.email || "").trim().toLowerCase() === email
          ? { email: "This email address already exists." }
          : {}),
        ...(String(duplicate.phoneNumber || duplicate.phone || "").replace(/\D/g, "") === phone
          ? { phone: "This phone number already exists." }
          : {}),
      };
    }

    const { data } = await axios.get(`${API_BASE_URL}/api/customers`);
    const duplicate = unwrapCustomerList(data).find((customer) => {
      if (String(customer.id) === currentId) return false;
      return (
        String(customer.email || "").trim().toLowerCase() === email ||
        String(customer.phone || "").replace(/\D/g, "") === phone
      );
    });

    if (!duplicate) return {};
    return {
      ...(String(duplicate.email || "").trim().toLowerCase() === email
        ? { email: "This email address already exists." }
        : {}),
      ...(String(duplicate.phone || "").replace(/\D/g, "") === phone
        ? { phone: "This phone number already exists." }
        : {}),
    };
  };

  const close = () => {
    if (modalMode) onClose?.();
    else navigate("/customer");
  };

  const applyApiErrors = (err) => {
    const apiErrors = err.response?.data?.errors;
    if (apiErrors && typeof apiErrors === "object") {
      setErrors(apiErrors);
      return;
    }
    setErrors({
      form: err.response?.data?.message || err.response?.data?.error || "Failed to save customer",
    });
  };

  const handleSubmit = async () => {
    if (saving) return;
    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    try {
      setSaving(true);
      const duplicateErrors = await checkDuplicates();
      if (Object.keys(duplicateErrors).length > 0) {
        setErrors(duplicateErrors);
        return;
      }

      const payload = {
        customer_name: form.customer_name.trim(),
        company_name: form.company_name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
        location: form.location.trim(),
        subscription_plan: form.subscription_plan.label,
        notes: form.notes.trim(),
      };

      if (isErpCustomer) {
        await axios.put(`${ERP_API_BASE_URL}/superadmin/update-user/${id}`, {
          name: form.customer_name.trim(),
          email: form.email.trim(),
          phoneNumber: form.phone.trim(),
          city: form.location.trim(),
          address: form.address.trim(),
          role: initialCustomer?.role || initialCustomer?.raw?.role || "Admin",
          companyName: form.company_name.trim(),
          package: form.subscription_plan.label,
          customMembers:
            form.subscription_plan.label === "Advanced"
              ? Number(initialCustomer?.members || initialCustomer?.raw?.customMembers || 1)
              : null,
        });
      } else if (isNew) {
        await axios.post(`${API_BASE_URL}/api/customers`, payload);
      } else {
        await axios.put(`${API_BASE_URL}/api/customers/${id}`, payload);
      }
      onRefresh?.();
      onCustomerAdded?.();
      close();
    } catch (err) {
      applyApiErrors(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/40" onClick={close} />
        <div className="relative z-10 bg-white rounded-2xl shadow-2xl px-8 py-6 text-sm text-gray-500">
          Loading customer...
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="absolute inset-0 bg-black/40" onClick={close} />

      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 20 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 flex rounded-2xl shadow-2xl overflow-hidden max-h-[90vh]"
        style={{ width: "min(680px, 95vw)" }}
      >
        <div className="flex flex-col bg-white flex-1 min-w-0">
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 shrink-0">
            <div className="flex items-center gap-3">
              <h2 className="text-[18px] font-bold text-[#111111]">
                {isNew ? "Add New Customer" : "Update Customer"}
              </h2>
              {!isNew && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200">
                  Edit Mode
                </span>
              )}
            </div>
            <button
              onClick={close}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
            >
              <FiX size={16} />
            </button>
          </div>

          <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
            {errors.form && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {errors.form}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Customer Name" error={errors.customer_name}>
                <input
                  type="text"
                  value={form.customer_name}
                  onChange={set("customer_name")}
                  placeholder="Enter customer name"
                  className={inputCls(errors.customer_name)}
                />
              </Field>
              <Field label="Company" error={errors.company_name}>
                <input
                  type="text"
                  value={form.company_name}
                  onChange={set("company_name")}
                  placeholder="Enter company name"
                  className={inputCls(errors.company_name)}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Phone" error={errors.phone}>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={form.phone}
                  onChange={set("phone")}
                  placeholder="9876543210"
                  className={inputCls(errors.phone)}
                />
              </Field>
              <Field label="Email" error={errors.email}>
                <input
                  type="email"
                  value={form.email}
                  onChange={set("email")}
                  placeholder="example@email.com"
                  className={inputCls(errors.email)}
                />
              </Field>
            </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="location" error={errors.location}>
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.location}
                  onChange={set("location")}
                  placeholder="city..."
                  className={inputCls(errors.location)}
                />
              </Field>
              <Field label="Address" error={errors.address}>
                <input
                  type="text"
                  value={form.address}
                  onChange={set("address")}
                  placeholder="example@email.com"
                  className={inputCls(errors.address)}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Plan" error={errors.subscription_plan}>
                <Select
                  styles={selectStyles(errors.subscription_plan)}
                  placeholder="Select plan"
                  value={form.subscription_plan}
                  onChange={setPlan}
                  options={PLANS}
                />
              </Field>
              {!isNew && (
                <Field label="Purchase Date" error={errors.purchase_date}>
                  <input
                    type="date"
                    value={form.purchase_date}
                    readOnly
                    className={`${inputCls(errors.purchase_date)} cursor-not-allowed text-gray-500`}
                  />
                </Field>
              )}
            </div>

            {!isNew && (
              <Field label="Renewal Date" error={errors.renewal_date}>
                <input
                  type="date"
                  value={form.renewal_date}
                  readOnly
                  className={`${inputCls(errors.renewal_date)} cursor-not-allowed text-gray-500`}
                />
              </Field>
            )}

            <Field label="Notes" error={errors.notes}>
              <textarea
                rows={4}
                value={form.notes}
                onChange={set("notes")}
                placeholder="Enter notes..."
                className={inputCls(errors.notes)}
              />
            </Field>
          </div>

          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 shrink-0 bg-white">
            <button
              onClick={close}
              className="px-6 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <motion.button
              whileHover={{ scale: saving ? 1 : 1.02 }}
              whileTap={{ scale: saving ? 1 : 0.97 }}
              onClick={handleSubmit}
              disabled={saving}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-black transition-all shadow-sm disabled:opacity-70"
              style={{ background: YELLOW }}
            >
              {saving ? "Saving..." : isNew ? "Create Customer" : "Update Customer"}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
