// ResetPassword.jsx
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

export default function ResetPassword() {
  const { token }   = useParams();
  const navigate    = useNavigate();
  const [password,  setPassword]  = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [showPwd,   setShowPwd]   = useState(false);
  const [showConf,  setShowConf]  = useState(false);
  const [message,   setMessage]   = useState("");
  const [isError,   setIsError]   = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [success,   setSuccess]   = useState(false);

  // Password strength
  const strength = [
    password.length >= 6,
    password.length >= 8,
    /[A-Z]/.test(password) && /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][strength];
  const strengthColor = ["", "#ef4444", "#f97316", "#F5C518", "#22c55e"][strength];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) { setMessage("Passwords don't match"); setIsError(true); return; }
    if (password.length < 8)  { setMessage("Password must be at least 8 characters"); setIsError(true); return; }
    setLoading(true);
    try {
      const res = await axios.post(`http://localhost:5000/api/auth/reset-password/${token}`, { password });
      setMessage(res.data.message);
      setIsError(false);
      setSuccess(true);
    } catch (err) {
      setMessage(err.response?.data?.message || "Something went wrong");
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  const inputBox = (focused) => ({
    display: "flex", alignItems: "center", gap: "12px",
    border: `1.5px solid ${focused ? "#F5C518" : "#e8e8e8"}`,
    borderRadius: "12px", padding: "12px 16px",
    boxShadow: focused ? "0 0 0 3px #F5C51820" : "none",
    transition: "border-color .2s, box-shadow .2s",
  });

  return (
    <div style={{ minHeight: "100vh", background: "#FFFDF7", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        .reset-card { animation: fadeUp 0.4s ease both; }
      `}</style>

      <div className="reset-card" style={{ width: "100%", maxWidth: "440px" }}>
        <div style={{ background: "#fff", borderRadius: "24px", boxShadow: "0 10px 40px rgba(0,0,0,.08)", padding: "40px" }}>

          {/* Icon */}
          <div style={{ width: "56px", height: "56px", borderRadius: "16px", background: "#FFFBE6", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px" }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#F5C518" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>
            </svg>
          </div>

          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "26px", fontWeight: 700, color: "#1a1a1a", margin: "0 0 8px" }}>
            Reset Password
          </h2>
          <p style={{ color: "#999", fontSize: "14px", margin: "0 0 28px", lineHeight: 1.6 }}>
            Choose a strong new password for your account.
          </p>

          {!success ? (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

              {/* New password */}
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#333", marginBottom: "8px" }}>New Password</label>
                <div style={inputBox(false)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F5C518" strokeWidth="1.5">
                    <rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>
                  </svg>
                  <input
                    type={showPwd ? "text" : "password"}
                    placeholder="Min 8 characters"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setMessage(""); setIsError(false); }}
                    required
                    style={{ flex: 1, border: "none", outline: "none", fontSize: "15px", color: "#1a1a1a", background: "transparent", fontFamily: "inherit" }}
                  />
                  <button type="button" onClick={() => setShowPwd(v => !v)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#aaa", fontSize: "13px", padding: "2px" }}>
                    {showPwd ? "🙈" : "👁️"}
                  </button>
                </div>

                {/* Strength bar */}
                {password && (
                  <div style={{ marginTop: "8px" }}>
                    <div style={{ display: "flex", gap: "4px", marginBottom: "4px" }}>
                      {[1,2,3,4].map(i => (
                        <div key={i} style={{ flex: 1, height: "4px", borderRadius: "2px", background: i <= strength ? strengthColor : "#e5e7eb", transition: "background .3s" }} />
                      ))}
                    </div>
                    <p style={{ fontSize: "11px", color: strengthColor, fontWeight: 600 }}>{strengthLabel}</p>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#333", marginBottom: "8px" }}>Confirm Password</label>
                <div style={{ ...inputBox(false), borderColor: confirm && confirm === password ? "#22c55e" : isError ? "#ef4444" : "#e8e8e8" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F5C518" strokeWidth="1.5">
                    <path d="M9 12l2 2 4-4"/><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>
                  </svg>
                  <input
                    type={showConf ? "text" : "password"}
                    placeholder="Re-enter new password"
                    value={confirm}
                    onChange={(e) => { setConfirm(e.target.value); setMessage(""); setIsError(false); }}
                    required
                    style={{ flex: 1, border: "none", outline: "none", fontSize: "15px", color: "#1a1a1a", background: "transparent", fontFamily: "inherit" }}
                  />
                  <button type="button" onClick={() => setShowConf(v => !v)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#aaa", fontSize: "13px", padding: "2px" }}>
                    {showConf ? "🙈" : "👁️"}
                  </button>
                </div>
                {confirm && confirm === password && (
                  <p style={{ color: "#22c55e", fontSize: "12px", marginTop: "5px" }}>✓ Passwords match</p>
                )}
                {isError && message && (
                  <p style={{ color: "#ef4444", fontSize: "12px", marginTop: "5px" }}>⚠️ {message}</p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                style={{ background: "#F5C518", color: "#1a1a1a", border: "none", borderRadius: "12px", padding: "14px", fontSize: "15px", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", boxShadow: "0 4px 16px #F5C51840", opacity: loading ? 0.75 : 1, fontFamily: "inherit", marginTop: "4px" }}
              >
                {loading ? (
                  <><div style={{ width: "18px", height: "18px", border: "2px solid rgba(26,26,26,.3)", borderTopColor: "#1a1a1a", borderRadius: "50%", animation: "spin .7s linear infinite" }} /><span>Updating…</span></>
                ) : (
                  <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg><span>Reset Password</span></>
                )}
              </button>
            </form>
          ) : (
            /* Success state */
            <div style={{ textAlign: "center", padding: "8px 0" }}>
              <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#f0fdf4", border: "2px solid #22c55e", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
              </div>
              <p style={{ fontSize: "15px", fontWeight: 700, color: "#111", marginBottom: "6px" }}>Password updated!</p>
              <p style={{ fontSize: "13px", color: "#999", lineHeight: 1.6, marginBottom: "20px" }}>Your password has been reset successfully.</p>
              <button
                onClick={() => navigate("/")}
                style={{ background: "#F5C518", color: "#1a1a1a", border: "none", borderRadius: "12px", padding: "12px 28px", fontSize: "14px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
              >
                Back to Login
              </button>
            </div>
          )}

          {/* Back to login (form state) */}
          {!success && (
            <div style={{ marginTop: "24px", textAlign: "center" }}>
              <button onClick={() => navigate("/")}
                style={{ background: "none", border: "none", color: "#F5C518", fontSize: "14px", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px", fontFamily: "inherit" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 5l-7 7 7 7"/>
                </svg>
                Back to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
