// ForgotPassword.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function ForgotPassword() {
  const [email,   setEmail]   = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/api/auth/forgot-password", { email });
      setMessage(res.data.message);
      setIsError(false);
      setSent(true);
    } catch (err) {
      setMessage(err.response?.data?.message || "Something went wrong");
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#FFFDF7", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700&display=swap');`}</style>

      <div style={{ width: "100%", maxWidth: "440px" }}>

        {/* Card */}
        <div style={{ background: "#fff", borderRadius: "24px", boxShadow: "0 10px 40px rgba(0,0,0,.08)", padding: "40px" }}>

          {/* Icon */}
          <div style={{ width: "56px", height: "56px", borderRadius: "16px", background: "#FFFBE6", border: "1.5px solid #F5C518/30", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px" }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#F5C518" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 7 10-7"/>
            </svg>
          </div>

          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "26px", fontWeight: 700, color: "#1a1a1a", margin: "0 0 8px" }}>
            Forgot Password?
          </h2>
          <p style={{ color: "#999", fontSize: "14px", margin: "0 0 28px", lineHeight: 1.6 }}>
            No worries! Enter your email and we'll send you a reset link.
          </p>

          {!sent ? (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Email input */}
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#333", marginBottom: "8px" }}>
                  Email Address
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", border: `1.5px solid ${isError ? "#ef4444" : "#e8e8e8"}`, borderRadius: "12px", padding: "12px 16px", transition: "border-color .2s" }}
                  onFocus={e => e.currentTarget.style.borderColor = "#F5C518"}
                  onBlur={e => e.currentTarget.style.borderColor = isError ? "#ef4444" : "#e8e8e8"}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F5C518" strokeWidth="1.5">
                    <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 7 10-7"/>
                  </svg>
                  <input
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setIsError(false); setMessage(""); }}
                    required
                    style={{ flex: 1, border: "none", outline: "none", fontSize: "15px", color: "#1a1a1a", background: "transparent", fontFamily: "inherit" }}
                  />
                </div>
                {isError && message && (
                  <p style={{ color: "#ef4444", fontSize: "12px", marginTop: "6px" }}>⚠️ {message}</p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !email.trim()}
                style={{ background: "#F5C518", color: "#1a1a1a", border: "none", borderRadius: "12px", padding: "14px", fontSize: "15px", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", boxShadow: "0 4px 16px #F5C51840", opacity: loading || !email.trim() ? 0.7 : 1, fontFamily: "inherit", transition: "opacity .2s" }}
              >
                {loading ? (
                  <><div style={{ width: "18px", height: "18px", border: "2px solid rgba(26,26,26,.3)", borderTopColor: "#1a1a1a", borderRadius: "50%", animation: "spin .7s linear infinite" }} /><span>Sending…</span></>
                ) : (
                  <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg><span>Send Reset Link</span></>
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
              <p style={{ fontSize: "15px", fontWeight: 700, color: "#111", marginBottom: "6px" }}>Check your inbox!</p>
              <p style={{ fontSize: "13px", color: "#999", lineHeight: 1.6 }}>{message || `We've sent a reset link to`}<br /><strong style={{ color: "#333" }}>{email}</strong></p>
            </div>
          )}

          {/* Back to login */}
          <div style={{ marginTop: "24px", textAlign: "center" }}>
            <button
              onClick={() => navigate("/")}
              style={{ background: "none", border: "none", color: "#F5C518", fontSize: "14px", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px", fontFamily: "inherit" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 5l-7 7 7 7"/>
              </svg>
              Back to Login
            </button>
          </div>
        </div>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
