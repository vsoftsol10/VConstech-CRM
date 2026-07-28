import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  AlertCircle,
  Building,
  CheckCircle,
  Eye,
  EyeOff,
  Home,
  Lock,
  Mail,
  MapPin,
  Package,
  Phone,
  User,
  UserCog,
  Users,
  X,
} from "lucide-react";
import { API_BASE_URL } from "../../config/api";

const ERP_API_URL = `${API_BASE_URL}/api`;

const INITIAL_FORM = {
  name: "",
  email: "",
  role: "Admin",
  companyName: "",
  password: "",
  confirmPassword: "",
  phoneNumber: "",
  city: "N/A",
  address: "",
  package: "Free",
  customMembers: "",
};

const ROLES = [{ value: "Admin", label: "Admin" }];
const PACKAGES = [
  { value: "Free", label: "Free" },
  { value: "Basic", label: "Basic" },
  { value: "Premium", label: "Premium" },
  { value: "Advanced", label: "Advanced" },
];

const normalizePackage = (plan) => {
  const normalized = String(plan || "").trim().toLowerCase();
  if (normalized.includes("advanced")) return "Advanced";
  if (normalized.includes("premium")) return "Premium";
  if (normalized.includes("basic")) return "Basic";
  return "Free";
};

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) return "Email is required";
  if (!emailRegex.test(email)) return "Please enter a valid email address";
  return "";
};

const validatePhone = (phone) => {
  if (!phone) return "Phone number is required";
  if (!/^\d+$/.test(phone)) return "Phone number must contain only digits";
  if (phone.length !== 10) return "Phone number must be exactly 10 digits";
  return "";
};

const validateName = (name) => {
  if (!name) return "Name is required";
  if (name.length < 2) return "Name must be at least 2 characters";
  if (name.length > 100) return "Name must be less than 100 characters";
  return "";
};

const validateCompanyName = (companyName) => {
  if (!companyName) return "Company name is required";
  if (companyName.length < 2) return "Company name must be at least 2 characters";
  return "";
};

const validateCity = (city) => {
  if (!city) return "City is required";
  if (city.length < 2) return "City name must be at least 2 characters";
  return "";
};

const validateCustomMembers = (members) => {
  if (!members) return "Number of site engineers is required";
  const num = parseInt(members);
  if (Number.isNaN(num) || num < 1) return "Must be at least 1";
  if (num > 1000) return "Must be less than 1000";
  return "";
};

const validateRegistrationForm = (userData) => {
  const errors = {
    name: validateName(userData.name),
    email: validateEmail(userData.email),
    phoneNumber: validatePhone(userData.phoneNumber),
    companyName: validateCompanyName(userData.companyName),
    city: validateCity(userData.city),
    address: "",
    password: "",
    confirmPassword: "",
  };

  if (!userData.password) errors.password = "Password is required";
  else if (userData.password.length < 6) errors.password = "Password must be at least 6 characters";
  else if (userData.password.length > 50) errors.password = "Password must be less than 50 characters";
  if (!userData.confirmPassword) errors.confirmPassword = "Please confirm your password";
  else if (userData.password !== userData.confirmPassword) errors.confirmPassword = "Passwords do not match";
  if (!userData.address) errors.address = "Address is required";
  else if (userData.address.length < 10) errors.address = "Please enter a complete address";
  if (!userData.role) errors.role = "Please select a role";
  if (!userData.package) errors.package = "Please select a package";
  if (userData.package === "Advanced") errors.customMembers = validateCustomMembers(userData.customMembers);

  return Object.fromEntries(Object.entries(errors).filter(([, value]) => value !== ""));
};

const InputField = ({
  field,
  label,
  type = "text",
  placeholder,
  icon: Icon,
  value,
  onChange,
  onFocus,
  onBlur,
  isFocused,
  error,
  disabled,
  children,
  isTextarea = false,
  rows = 4,
}) => (
  <div className="space-y-3">
    <label className="block text-sm font-bold text-gray-800 tracking-wide">
      {label} <span className="text-red-500">*</span>
    </label>
    <div
      className={`relative rounded-2xl transition-all duration-300 ${
        error
          ? "ring-2 ring-red-500 shadow-lg shadow-red-500/20"
          : isFocused
          ? "ring-2 ring-[#ffbe2a] shadow-lg shadow-[#ffbe2a]/20"
          : "ring-1 ring-gray-200 hover:ring-gray-300"
      }`}
    >
      <div className={`flex ${isTextarea ? "items-start" : "items-center"} px-5 py-4 bg-gray-50 rounded-2xl`}>
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 flex-shrink-0 ${
            error ? "bg-red-500 shadow-md" : isFocused ? "bg-[#ffbe2a] shadow-md" : "bg-white"
          }`}
        >
          <Icon className={`w-5 h-5 ${error ? "text-white" : isFocused ? "text-black" : "text-gray-400"}`} />
        </div>
        {isTextarea ? (
          <textarea
            value={value}
            onChange={(event) => onChange(field, event.target.value)}
            onFocus={() => onFocus(field, true)}
            onBlur={() => onBlur(field, false)}
            rows={rows}
            className="flex-1 ml-4 w-full bg-transparent text-gray-900 placeholder-gray-400 outline-none font-medium resize-y"
            placeholder={placeholder}
            disabled={disabled}
          />
        ) : (
          <input
            type={type}
            value={value}
            onChange={(event) => onChange(field, event.target.value)}
            onFocus={() => onFocus(field, true)}
            onBlur={() => onBlur(field, false)}
            className="flex-1 ml-4 bg-transparent text-gray-900 placeholder-gray-400 outline-none font-medium"
            placeholder={placeholder}
            disabled={disabled}
          />
        )}
        {children}
      </div>
    </div>
    {error && <p className="text-red-500 text-xs font-medium mt-1 ml-1">{error}</p>}
  </div>
);

const SelectField = ({
  field,
  label,
  icon: Icon,
  value,
  onChange,
  onFocus,
  onBlur,
  isFocused,
  error,
  disabled,
  options = [],
  placeholder = "Select...",
}) => (
  <div className="space-y-3">
    <label className="block text-sm font-bold text-gray-800 tracking-wide">
      {label} <span className="text-red-500">*</span>
    </label>
    <div
      className={`relative rounded-2xl transition-all duration-300 ${
        error
          ? "ring-2 ring-red-500 shadow-lg shadow-red-500/20"
          : isFocused
          ? "ring-2 ring-[#ffbe2a] shadow-lg shadow-[#ffbe2a]/20"
          : "ring-1 ring-gray-200 hover:ring-gray-300"
      }`}
    >
      <div className="flex items-center px-5 py-4 bg-gray-50 rounded-2xl">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
            error ? "bg-red-500 shadow-md" : isFocused ? "bg-[#ffbe2a] shadow-md" : "bg-white"
          }`}
        >
          <Icon className={`w-5 h-5 ${error ? "text-white" : isFocused ? "text-black" : "text-gray-400"}`} />
        </div>
        <select
          value={value}
          onChange={(event) => onChange(field, event.target.value)}
          onFocus={() => onFocus(field, true)}
          onBlur={() => onBlur(field, false)}
          className="flex-1 ml-4 bg-transparent text-gray-900 outline-none font-medium cursor-pointer"
          disabled={disabled}
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
    {error && <p className="text-red-500 text-xs font-medium mt-1 ml-1">{error}</p>}
  </div>
);

const MessagePanel = ({ type = "error", title, message }) => {
  const Icon = type === "success" ? CheckCircle : AlertCircle;
  const tone = type === "success" ? "border-green-200 bg-green-50 text-green-900" : "border-red-200 bg-red-50 text-red-900";
  const iconTone = type === "success" ? "bg-green-500" : "bg-red-500";

  return (
    <div className={`w-full max-w-2xl rounded-3xl border ${tone} p-6 sm:p-8 shadow-xl`}>
      <div className="flex items-start gap-4">
        <div className={`w-11 h-11 rounded-2xl ${iconTone} flex items-center justify-center shrink-0`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">{title}</h1>
          <p className="mt-2 text-sm sm:text-base leading-6">{message}</p>
        </div>
      </div>
    </div>
  );
};

const Toast = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <>
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes toastProgress {
          from { width: 100%; }
          to   { width: 0%; }
        }
        .toast-enter    { animation: toastIn 0.3s cubic-bezier(.4,0,.2,1) forwards; }
        .toast-progress { animation: toastProgress 3.5s linear forwards; }
      `}</style>
      <div className="fixed bottom-6 right-4 left-4 sm:left-auto sm:right-6 z-[9999] toast-enter">
        <div className="relative bg-white rounded-2xl shadow-2xl border border-green-100 overflow-hidden">
          <div className="toast-progress absolute bottom-0 left-0 h-1 bg-green-400 rounded-full" />
          <div className="flex items-center gap-3 px-4 py-4">
            <div className="w-9 h-9 rounded-xl bg-green-500 flex items-center justify-center shrink-0 shadow-md">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <p className="text-sm font-semibold text-gray-800 flex-1">{message}</p>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors shrink-0"
            >
              <X className="w-3.5 h-3.5 text-gray-500" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

const RegistrationForm = ({ initialData, onSubmit, onSuccess }) => {
  const [userData, setUserData] = useState({ ...INITIAL_FORM, ...initialData });
  const [isFocused, setIsFocused] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    setUserData({ ...INITIAL_FORM, ...initialData });
  }, [initialData]);

  const handleFocus = (field, focused) => setIsFocused((prev) => ({ ...prev, [field]: focused }));

  const handleFieldChange = (field, value) => {
    setUserData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setFieldErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async () => {
    setError("");
    const errors = validateRegistrationForm(userData);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError("Please fix all validation errors before submitting");
      return;
    }

    setLoading(true);
    try {
      await onSubmit(userData);
      setToast("Registration complete. Your trial has started.");
      setFieldErrors({});
      onSuccess?.();
    } catch (err) {
      setError(err.message || "An error occurred while creating the user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-4xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 sm:px-8 py-4 sm:py-6 border-b border-gray-100 bg-[#ffbe2a] rounded-t-3xl shrink-0">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white/30 backdrop-blur-sm flex items-center justify-center shadow-inner">
              <User className="w-5 h-5 sm:w-6 sm:h-6 text-gray-900" />
            </div>
            <div>
              <h2 className="text-lg sm:text-2xl font-bold text-gray-900">Complete ERP Registration</h2>
              <p className="text-gray-700 text-xs sm:text-sm">Confirm your details and create your account</p>
            </div>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 px-5 sm:px-8 py-5 sm:py-8">
          {error && (
            <div className="mb-5 p-4 bg-red-50 border-l-4 border-red-500 rounded-2xl flex items-start shadow-sm">
              <div className="w-8 h-8 rounded-xl bg-red-500 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-4 h-4 text-white" />
              </div>
              <p className="ml-3 text-sm font-bold text-red-900 self-center">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <InputField
              field="name"
              label="Client Name"
              placeholder="Enter full name"
              icon={User}
              value={userData.name}
              isFocused={isFocused.name}
              error={fieldErrors.name}
              onChange={handleFieldChange}
              onFocus={handleFocus}
              onBlur={handleFocus}
              disabled={loading}
            />

            <InputField
              field="email"
              label="Email"
              type="email"
              placeholder="Enter email address"
              icon={Mail}
              value={userData.email}
              isFocused={isFocused.email}
              error={fieldErrors.email}
              onChange={handleFieldChange}
              onFocus={handleFocus}
              onBlur={handleFocus}
              disabled={loading}
            />

            <InputField
              field="phoneNumber"
              label="Contact Number"
              type="tel"
              placeholder="Enter 10-digit phone number"
              icon={Phone}
              value={userData.phoneNumber}
              isFocused={isFocused.phoneNumber}
              error={fieldErrors.phoneNumber}
              onChange={handleFieldChange}
              onFocus={handleFocus}
              onBlur={handleFocus}
              disabled={loading}
            />

            <SelectField
              field="role"
              label="Role"
              icon={UserCog}
              value={userData.role}
              options={ROLES}
              placeholder="Select role"
              isFocused={isFocused.role}
              error={fieldErrors.role}
              onChange={handleFieldChange}
              onFocus={handleFocus}
              onBlur={handleFocus}
              disabled={loading}
            />

            <InputField
              field="companyName"
              label="Company Name"
              placeholder="Enter company name"
              icon={Building}
              value={userData.companyName}
              isFocused={isFocused.companyName}
              error={fieldErrors.companyName}
              onChange={handleFieldChange}
              onFocus={handleFocus}
              onBlur={handleFocus}
              disabled={loading}
            />

            <InputField
              field="city"
              label="City"
              placeholder="Enter city name"
              icon={MapPin}
              value={userData.city}
              isFocused={isFocused.city}
              error={fieldErrors.city}
              onChange={handleFieldChange}
              onFocus={handleFocus}
              onBlur={handleFocus}
              disabled={loading}
            />

            <SelectField
              field="package"
              label="Package"
              icon={Package}
              value={userData.package}
              options={PACKAGES}
              placeholder="Select package"
              isFocused={isFocused.package}
              error={fieldErrors.package}
              onChange={(field, value) => {
                handleFieldChange(field, value);
                setUserData((prev) => ({ ...prev, package: value, customMembers: "" }));
              }}
              onFocus={handleFocus}
              onBlur={handleFocus}
              disabled={loading}
            />

            {userData.package === "Advanced" && (
              <InputField
                field="customMembers"
                label="Number of Site Engineers"
                type="number"
                placeholder="Enter number of site engineers"
                icon={Users}
                value={userData.customMembers}
                isFocused={isFocused.customMembers}
                error={fieldErrors.customMembers}
                onChange={handleFieldChange}
                onFocus={handleFocus}
                onBlur={handleFocus}
                disabled={loading}
              />
            )}

            <InputField
              field="password"
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="Min 6 characters"
              icon={Lock}
              value={userData.password}
              isFocused={isFocused.password}
              error={fieldErrors.password}
              onChange={handleFieldChange}
              onFocus={handleFocus}
              onBlur={handleFocus}
              disabled={loading}
            >
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="ml-2 text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </InputField>

            <InputField
              field="confirmPassword"
              label="Confirm Password"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Re-enter password"
              icon={Lock}
              value={userData.confirmPassword}
              isFocused={isFocused.confirmPassword}
              error={fieldErrors.confirmPassword}
              onChange={handleFieldChange}
              onFocus={handleFocus}
              onBlur={handleFocus}
              disabled={loading}
            >
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="ml-2 text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </InputField>
          </div>

          <div className="mt-4 sm:mt-6">
            <InputField
              field="address"
              label="Address"
              placeholder="Enter full address"
              icon={Home}
              value={userData.address}
              isFocused={isFocused.address}
              error={fieldErrors.address}
              onChange={handleFieldChange}
              onFocus={handleFocus}
              onBlur={handleFocus}
              disabled={loading}
              isTextarea
              rows={4}
            />
          </div>
        </div>

        <div className="flex gap-3 sm:gap-4 px-5 sm:px-8 py-4 sm:py-6 border-t border-gray-100 bg-gray-50/60 rounded-b-3xl shrink-0">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 bg-[#ffbe2a] text-black font-bold py-3 sm:py-3.5 rounded-2xl hover:shadow-xl shadow-[#ffbe2a]/30 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
          >
            {loading ? "Registering..." : "Create Account"}
          </button>
        </div>
      </div>

      {toast && <Toast message={toast} onClose={() => setToast("")} />}
    </>
  );
};

const InvitationRegistration = () => {
  const { invitationId } = useParams();
  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadInvitation = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(`${ERP_API_URL}/registration/invitations/${encodeURIComponent(invitationId)}`);
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "This invitation is invalid or no longer available.");
        }

        if (mounted) setInvitation(data.invitation);
      } catch (err) {
        if (mounted) setError(err.message || "Unable to validate this invitation.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadInvitation();

    return () => {
      mounted = false;
    };
  }, [invitationId]);

  const initialData = useMemo(() => ({
    name: invitation?.customer?.name || "",
    email: invitation?.customer?.email || "",
    phoneNumber: invitation?.customer?.phone || "",
    companyName: invitation?.customer?.companyName || "",
    crmLeadId: invitation?.crmLeadId || "",
    crmCustomerId: invitation?.crmCustomerId || "",
    role: "Admin",
    package: normalizePackage(invitation?.customer?.subscriptionPlan),
    city: invitation?.customer?.location || invitation?.customer?.city || "",
    address: invitation?.customer?.address || "",
    password: "",
    confirmPassword: "",
  }), [invitation]);

  const handleRegistrationSubmit = async (formData) => {
    const registerResponse = await fetch(`${ERP_API_URL}/registration/invitations/${encodeURIComponent(invitationId)}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        companyName: formData.companyName,
        phoneNumber: formData.phoneNumber,
        city: formData.city,
        address: formData.address,
        package: formData.package,
        customMembers: formData.package === "Advanced" ? formData.customMembers : null,
      }),
    });

    const registerData = await registerResponse.json();
    if (!registerResponse.ok || !registerData.success) {
      throw new Error(registerData.error || "Registration failed.");
    }

    const trialResponse = await fetch(`${ERP_API_URL}/subscription-sync/invitations/${encodeURIComponent(invitationId)}/start-trial`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: registerData.registration?.user?.id,
      }),
    });

    const trialData = await trialResponse.json();
    if (!trialResponse.ok || !trialData.success) {
      throw new Error(trialData.error || "Registration completed, but trial activation failed.");
    }
  };

  return (
    <div className="min-h-screen bg-[#ffbe2a] flex items-center justify-center px-4 py-8">
      {loading && (
        <div className="bg-white rounded-3xl shadow-xl px-6 py-5 font-bold text-gray-900">
          Validating invitation...
        </div>
      )}

      {!loading && error && (
        <MessagePanel
          title="Invitation unavailable"
          message={error}
        />
      )}

      {!loading && !error && success && (
        <MessagePanel
          type="success"
          title="Registration complete"
          message="Your ERP account has been created and your free trial has started."
        />
      )}

      {!loading && !error && !success && invitation && (
        <RegistrationForm
          initialData={initialData}
          onSubmit={handleRegistrationSubmit}
          onSuccess={() => setSuccess(true)}
        />
      )}
    </div>
  );
};

export default InvitationRegistration;
