import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { API_BASE_URL } from "../../config/api";

const statusConfig = {
  "On Track": {
    color:      "#22c55e",
    iconBg:     "#f0fdf4",
    iconColor:  "#22c55e",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="18 15 12 9 6 15"/>
      </svg>
    ),
  },
  "Need Attention": {
    color:      "#f97316",
    iconBg:     "#fff7ed",
    iconColor:  "#f97316",
    icon: <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#f97316" }} />,
  },
  "High Workload": {
    color:      "#ef4444",
    iconBg:     "#fef2f2",
    iconColor:  "#ef4444",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 12 15 18 9"/>
      </svg>
    ),
  },
};

const Ring = ({ percent, color, label, status, statusColor }) => {
  const r    = 32;
  const circ = 2 * Math.PI * r;
  const dash = (percent / 100) * circ;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
      <div style={{ position: "relative", width: "80px", height: "80px" }}>
        <svg viewBox="0 0 80 80" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
          <circle cx="40" cy="40" r={r} fill="none" stroke="#eeeeee" strokeWidth="6"/>
          <motion.circle
            cx="40" cy="40" r={r} fill="none"
            stroke={color} strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: circ - dash }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </svg>
        <span style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "14px", fontWeight: 700, color: "#2d3a4a"
        }}>
          {percent}%
        </span>
      </div>
      <p style={{ fontSize: "13px", fontWeight: 700, color: "#2d3a4a", margin: 0 }}>{label}</p>
      <p style={{ fontSize: "11px", fontWeight: 600, color: statusColor, margin: 0 }}>{status}</p>
    </div>
  );
};

const DepartmentHealthOverview = () => {
  const [health,  setHealth]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res  = await fetch(`${API_BASE_URL}/api/departments/health`);
        const json = await res.json();
        if (!json.success) throw new Error(json.error);
        setHealth(json.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchHealth();
  }, []);

  if (loading) {
    return (
      <div style={{ backgroundColor: "#fff", borderRadius: "16px", padding: "20px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", height: "100%" }}>
        <div style={{ height: "15px", width: "160px", backgroundColor: "#f1f5f9", borderRadius: "6px", marginBottom: "20px" }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ height: "100px", backgroundColor: "#f8fafc", borderRadius: "12px" }} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ backgroundColor: "#fff", borderRadius: "16px", padding: "20px", color: "#ef4444", fontSize: "13px" }}>
        Failed to load health data: {error}
      </div>
    );
  }

  // unique statuses for track items row
  const uniqueStatuses = [...new Map(health.map(h => [h.status, h])).values()];

  return (
    <motion.div
      style={{ backgroundColor: "#fff", borderRadius: "16px", padding: "20px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", height: "100%" }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.1 }}
    >
      <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#2d3a4a", margin: "0 0 20px 0" }}>
        Department Health Overview
      </h3>

      {/* Rings */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", marginBottom: "20px" }}>
        {health.map((h, i) => {
          const cfg = statusConfig[h.status] || statusConfig["On Track"];
          return (
            <Ring
              key={i}
              percent={h.percentage}
              color={cfg.color}
              label={h.department_name}
              status={h.status_label}
              statusColor={cfg.color}
            />
          );
        })}
      </div>

      {/* Divider */}
      <div style={{ borderTop: "1px solid #f1f5f9", marginBottom: "16px" }} />

      {/* Track items — built from real data */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "24px", flexWrap: "wrap" }}>
        {uniqueStatuses.map((h, i) => {
          const cfg = statusConfig[h.status] || statusConfig["On Track"];
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{
                width: "32px", height: "32px", borderRadius: "50%",
                backgroundColor: cfg.iconBg,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, color: cfg.iconColor,
              }}>
                {cfg.icon}
              </div>
              <div>
                <p style={{ fontSize: "13px", fontWeight: 700, color: "#2d3a4a", margin: "0 0 2px 0" }}>{h.status}</p>
                <p style={{ fontSize: "11px", color: "#a0aec0", margin: 0 }}>{h.status_label}</p>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default DepartmentHealthOverview;
