import { useState, useEffect, useRef } from "react";
import axios from "axios";

// ── helpers ───────────────────────────────────────────────────────────────────
const API = "http://localhost:5000";

function getInitials(name = "") {
  return name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() || "").join("");
}

// ── tiny reusable field ───────────────────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
        {label}
      </label>
      {children}
    </div>
  );
}

function Input({ locked, ...props }) {
  return (
    <div className="relative">
      <input
        {...props}
        disabled={locked}
        className={`
          w-full px-4 py-2.5 rounded-xl text-sm border outline-none transition-all
          ${locked
            ? "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed"
            : "bg-white border-gray-200 text-gray-800 focus:border-[#F5C518] focus:ring-2 focus:ring-[#F5C518]/20"
          }
        `}
      />
      {locked && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 text-sm">🔒</span>
      )}
    </div>
  );
}

function Toast({ msg, type }) {
  if (!msg) return null;
  return (
    <div className={`
      fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-xl shadow-lg text-sm font-semibold
      transition-all animate-bounce-in
      ${type === "success" ? "bg-[#F5C518] text-black" : "bg-red-500 text-white"}
    `}>
      {type === "success" ? "✅" : "❌"} {msg}
    </div>
  );
}

export default function ProfilePage({ onClose }) {

  const fileRef = useRef(null);

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading]   = useState(true);

  // form states
  const [info, setInfo]     = useState({ name: "", phone: "", email: "", department: "", role: "", designation: "" });
  const [preview, setPreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  // password states
  const [pwd, setPwd] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [showPwd, setShowPwd] = useState({ old: false, new: false, confirm: false });

  // ui states
  const [saving, setSaving]     = useState(false);
  const [pwdSaving, setPwdSaving] = useState(false);
  const [toast, setToast]       = useState({ msg: "", type: "success" });
  const [errors, setErrors]     = useState({});
  const [pwdErrors, setPwdErrors] = useState({});

  // ── Load logged-in employee from localStorage ───────────────────────────
  useEffect(() => {
    const stored = localStorage.getItem("employee");
    if (!stored) { setLoading(false); return; }
    const emp = JSON.parse(stored);
    loadEmployee(emp.id);
  }, []);

  const loadEmployee = async (id) => {
    try {
      const res = await axios.get(`${API}/api/team/${id}`);
      const d   = res.data;
      setEmployee(d);
      setInfo({
        name:        d.name        || "",
        phone:       d.phone       || "",
        email:       d.email       || "",
        department:  d.department  || "",
        role:        d.role        || "",
        designation: d.designation || "",
      });
      setPreview(d.profile_image ? `${API}/uploads/${d.profile_image}` : null);
    } catch (err) {
      showToast("Failed to load profile", "error");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "success" }), 3000);
  };

  // ── Image pick ────────────────────────────────────────────────────────────
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  // ── Save personal info ────────────────────────────────────────────────────
  const validateInfo = () => {
    const e = {};
    if (!info.name.trim())        e.name  = "Name is required";
    if (!info.phone.trim())       e.phone = "Phone is required";
    else if (!/^\d{10}$/.test(info.phone)) e.phone = "Enter a valid 10-digit number";
    if (!info.email.trim())       e.email = "Email is required";
    return e;
  };

 const handleSaveInfo = async () => {
  const e = validateInfo();
  if (Object.keys(e).length) { setErrors(e); return; }
  setSaving(true);
  try {
    const formData = new FormData();
    Object.entries(info).forEach(([k, v]) => formData.append(k, v));
    formData.append("dateJoined", employee.date_joined || new Date().toISOString().split("T")[0]);
    if (imageFile) formData.append("profileImage", imageFile);

    const res = await axios.put(`${API}/api/team/${employee.id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    // Update localStorage
    const stored = JSON.parse(localStorage.getItem("employee") || "{}");
    localStorage.setItem("employee", JSON.stringify({ ...stored, ...res.data.member }));

    // ← Fire event so Header avatar refreshes in same tab
    window.dispatchEvent(new Event("employeeUpdated"));

    setEmployee(res.data.member);
    setImageFile(null);

    // ← Reset preview to actual saved URL (not blob)
    setPreview(res.data.member.profile_image
      ? `${API}/uploads/${res.data.member.profile_image}`
      : null
    );

    showToast("Profile updated successfully");
  } catch (err) {
    showToast(err?.response?.data?.message || "Failed to update profile", "error");
  } finally {
    setSaving(false);
  }
};
 
  const validatePwd = () => {
    const e = {};
    if (!pwd.oldPassword)                      e.oldPassword    = "Enter your current password";
    if (!pwd.newPassword)                      e.newPassword    = "Enter a new password";
    else if (pwd.newPassword.length < 8)       e.newPassword    = "At least 8 characters";
    if (pwd.newPassword !== pwd.confirmPassword) e.confirmPassword = "Passwords don't match";
    return e;
  };

  const handleChangePwd = async () => {
    const e = validatePwd();
    if (Object.keys(e).length) { setPwdErrors(e); return; }
    setPwdSaving(true);
    try {
      await axios.post(`${API}/api/auth/change-password`, {
        employeeId:  employee.id,
        oldPassword: pwd.oldPassword,
        newPassword: pwd.newPassword,
      });
      setPwd({ oldPassword: "", newPassword: "", confirmPassword: "" });
      showToast("Password changed successfully");
    } catch (err) {
      showToast(err?.response?.data?.message || "Incorrect current password", "error");
    } finally {
      setPwdSaving(false);
    }
  };

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-[#F5C518] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-400 text-sm">
        No profile found. Please log in.
      </div>
    );
  }
const handleClose = () => {
    if (typeof onClose === "function") {
      onClose();
      return;
    }
    if (window.history.length > 1) {
      window.history.back();
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f7f5] p-4 md:p-8 font-sans">
      <Toast msg={toast.msg} type={toast.type} />
{/* Page title + Close */}
<div className="flex items-center justify-between mb-6">
  <h1 className="text-2xl font-bold text-[#111111]">
    My Profile
  </h1>

<button
  onClick={handleClose}
  className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-100 transition-all text-gray-600"
>
  ✕
</button>
</div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── LEFT: Avatar card ──────────────────────────────────────────── */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col items-center text-center">

            {/* Avatar */}
            <div className="relative mb-4">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-[#F5C518]/30 shadow-md">
                {preview ? (
                  <img src={preview} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#F5C518] to-yellow-300 flex items-center justify-center text-2xl font-bold text-black">
                    {getInitials(employee.name)}
                  </div>
                )}
              </div>

              {/* Camera button */}
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#F5C518] flex items-center justify-center shadow-md hover:bg-yellow-400 transition-all"
                title="Change photo"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </div>

            <h2 className="text-lg font-bold text-[#111111]">{employee.name}</h2>
            <p className="text-sm text-gray-500 mt-0.5">{employee.designation}</p>
            <p className="text-xs text-gray-400 mt-0.5">{employee.department}</p>

            {/* Employee ID badge — read only */}
            <div className="mt-4 w-full bg-[#fffbe6] border border-[#F5C518]/40 rounded-xl px-4 py-2.5 flex items-center justify-between">
              <span className="text-xs text-gray-500 font-medium">Employee ID</span>
              <span className="text-sm font-bold text-[#b8900a] font-mono">{employee.employee_id}</span>
            </div>

            {/* Quick info */}
            <div className="mt-4 w-full space-y-2 text-left">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>📧</span>
                <span className="truncate">{employee.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>📞</span>
                <span>{employee.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>🏢</span>
                <span>{employee.department} · {employee.role}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>📅</span>
                <span>Joined {employee.date_joined ? new Date(employee.date_joined).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Forms ──────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Personal Information */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <span className="w-7 h-7 rounded-lg bg-[#fffbe6] flex items-center justify-center text-sm">👤</span>
              <h3 className="text-[15px] font-bold text-[#111111]">Personal Information</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <Field label="Full Name">
                <Input
                  value={info.name}
                  onChange={(e) => { setInfo(p => ({ ...p, name: e.target.value })); setErrors(p => ({ ...p, name: "" })); }}
                  placeholder="Enter full name"
                />
                {errors.name && <p className="text-[11px] text-red-500 mt-1">{errors.name}</p>}
              </Field>

              <Field label="Employee ID">
                <Input value={employee.employee_id} locked readOnly />
              </Field>

              <Field label="Email Address">
                <Input
                  type="email"
                  value={info.email}
                  onChange={(e) => { setInfo(p => ({ ...p, email: e.target.value })); setErrors(p => ({ ...p, email: "" })); }}
                  placeholder="email@gmail.com"
                />
                {errors.email && <p className="text-[11px] text-red-500 mt-1">{errors.email}</p>}
              </Field>

              <Field label="Phone">
                <Input
                  value={info.phone}
                  onChange={(e) => { setInfo(p => ({ ...p, phone: e.target.value })); setErrors(p => ({ ...p, phone: "" })); }}
                  placeholder="10-digit mobile number"
                />
                {errors.phone && <p className="text-[11px] text-red-500 mt-1">{errors.phone}</p>}
              </Field>

             

            </div>

          <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setInfo({ name: employee.name, phone: employee.phone, email: employee.email, department: employee.department, role: employee.role, designation: employee.designation });
                  setPreview(employee.profile_image ? `${API}/uploads/${employee.profile_image}` : null);
                  setImageFile(null);
                  setErrors({});
                }}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveInfo}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-black transition-all shadow-sm disabled:opacity-60"
                style={{ background: "#F5C518" }}
              >
                {saving ? (
                  <><div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Saving…</>
                ) : (
                  <><span>💾</span> Save Changes</>
                )}
              </button>
            </div>
          </div>

          {/* Change Password */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <span className="w-7 h-7 rounded-lg bg-[#fffbe6] flex items-center justify-center text-sm">🔐</span>
              <h3 className="text-[15px] font-bold text-[#111111]">Change Password</h3>
            </div>

            <div className="space-y-4">

              {/* Current password */}
              <Field label="Current Password">
                <div className="relative">
                  <input
                    type={showPwd.old ? "text" : "password"}
                    value={pwd.oldPassword}
                    onChange={(e) => { setPwd(p => ({ ...p, oldPassword: e.target.value })); setPwdErrors(p => ({ ...p, oldPassword: "" })); }}
                    placeholder="Enter current password"
                    className="w-full px-4 py-2.5 pr-11 rounded-xl text-sm border border-gray-200 outline-none bg-white text-gray-800 focus:border-[#F5C518] focus:ring-2 focus:ring-[#F5C518]/20 transition-all"
                  />
                  <button onClick={() => setShowPwd(p => ({ ...p, old: !p.old }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs">
                    {showPwd.old ? "🙈" : "👁️"}
                  </button>
                </div>
                {pwdErrors.oldPassword && <p className="text-[11px] text-red-500 mt-1">{pwdErrors.oldPassword}</p>}
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* New password */}
                <Field label="New Password">
                  <div className="relative">
                    <input
                      type={showPwd.new ? "text" : "password"}
                      value={pwd.newPassword}
                      onChange={(e) => { setPwd(p => ({ ...p, newPassword: e.target.value })); setPwdErrors(p => ({ ...p, newPassword: "" })); }}
                      placeholder="Min 8 characters"
                      className="w-full px-4 py-2.5 pr-11 rounded-xl text-sm border border-gray-200 outline-none bg-white text-gray-800 focus:border-[#F5C518] focus:ring-2 focus:ring-[#F5C518]/20 transition-all"
                    />
                    <button onClick={() => setShowPwd(p => ({ ...p, new: !p.new }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs">
                      {showPwd.new ? "🙈" : "👁️"}
                    </button>
                  </div>
                  {pwdErrors.newPassword && <p className="text-[11px] text-red-500 mt-1">{pwdErrors.newPassword}</p>}

                  {/* Strength bar */}
                  {pwd.newPassword && (
                    <div className="mt-2">
                      <div className="flex gap-1">
                        {[1,2,3,4].map((i) => {
                          const strength = [
                            pwd.newPassword.length >= 6,
                            pwd.newPassword.length >= 8,
                            /[A-Z]/.test(pwd.newPassword) && /[0-9]/.test(pwd.newPassword),
                            /[^A-Za-z0-9]/.test(pwd.newPassword),
                          ].filter(Boolean).length;
                          return (
                            <div key={i} className="flex-1 h-1 rounded-full transition-all" style={{
                              background: i <= strength
                                ? strength <= 1 ? "#ef4444" : strength <= 2 ? "#f97316" : strength <= 3 ? "#F5C518" : "#22c55e"
                                : "#e5e7eb"
                            }} />
                          );
                        })}
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {(() => {
                          const s = [pwd.newPassword.length >= 6, pwd.newPassword.length >= 8, /[A-Z]/.test(pwd.newPassword) && /[0-9]/.test(pwd.newPassword), /[^A-Za-z0-9]/.test(pwd.newPassword)].filter(Boolean).length;
                          return ["Too short", "Weak", "Fair", "Good", "Strong"][s];
                        })()}
                      </p>
                    </div>
                  )}
                </Field>

                {/* Confirm password */}
                <Field label="Confirm New Password">
                  <div className="relative">
                    <input
                      type={showPwd.confirm ? "text" : "password"}
                      value={pwd.confirmPassword}
                      onChange={(e) => { setPwd(p => ({ ...p, confirmPassword: e.target.value })); setPwdErrors(p => ({ ...p, confirmPassword: "" })); }}
                      placeholder="Re-enter new password"
                      className={`w-full px-4 py-2.5 pr-11 rounded-xl text-sm border outline-none bg-white text-gray-800 transition-all
                        ${pwd.confirmPassword && pwd.confirmPassword === pwd.newPassword
                          ? "border-green-400 focus:ring-2 focus:ring-green-200"
                          : "border-gray-200 focus:border-[#F5C518] focus:ring-2 focus:ring-[#F5C518]/20"
                        }`}
                    />
                    <button onClick={() => setShowPwd(p => ({ ...p, confirm: !p.confirm }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs">
                      {showPwd.confirm ? "🙈" : "👁️"}
                    </button>
                  </div>
                  {pwd.confirmPassword && pwd.confirmPassword === pwd.newPassword && (
                    <p className="text-[11px] text-green-500 mt-1">✓ Passwords match</p>
                  )}
                  {pwdErrors.confirmPassword && <p className="text-[11px] text-red-500 mt-1">{pwdErrors.confirmPassword}</p>}
                </Field>
              </div>
            </div>

           <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => { setPwd({ oldPassword: "", newPassword: "", confirmPassword: "" }); setPwdErrors({}); }}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePwd}
                disabled={pwdSaving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-black transition-all shadow-sm disabled:opacity-60"
                style={{ background: "#F5C518" }}
              >
                {pwdSaving ? (
                  <><div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Updating…</>
                ) : (
                  <><span>🔒</span> Update Password</>
                )}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
