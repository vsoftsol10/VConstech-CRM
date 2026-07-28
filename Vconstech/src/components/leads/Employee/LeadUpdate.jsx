import { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../config/api";

const stages = [
  "new",
  "contacted",
  "qualified",
  "proposal",
  "won",
  "lost",
];

const YELLOW = "#F5C518";

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatFollowUp = (date, time) =>
  date ? `${formatDate(date)}${time ? ` at ${time}` : ""}` : "—";

export default function UpdateTaskForm({ leadId, leadData }) {
  const [stage, setStage]               = useState("");
  const [note, setNote]                 = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpTime, setFollowUpTime] = useState("");
  const [reminder, setReminder]         = useState(true);
  const [stageOpen, setStageOpen]       = useState(false);
  const [history, setHistory]           = useState([]);
  const [loading, setLoading]           = useState(false);
  const [saving, setSaving]             = useState(false);

  // Pre-fill from leadData
  useEffect(() => {
    if (leadData) {
      setStage(leadData.status || "");
      setFollowUpDate(leadData.follow_up_date || "");
      setFollowUpTime(leadData.follow_up_time || "");
    }
  }, [leadData]);

  // Load history on open
  useEffect(() => {
    if (!leadId) return;
    const load = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE_URL}/api/leads/work-history/${leadId}`);
        setHistory(res.data);
      } catch (err) {
        console.error("Failed to load history", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [leadId]);

  const handleSave = async () => {
    if (!stage) { alert("Please select a stage"); return; }
    if (reminder && !followUpDate) {
      alert("Please select a follow-up date before setting a reminder.");
      return;
    }
    if (reminder && !followUpTime) {
      alert("Please select a follow-up time before setting a reminder.");
      return;
    }
    if (followUpTime && !followUpDate) {
      alert("Please select a follow-up date before adding a time.");
      return;
    }
    if (followUpDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selected = new Date(followUpDate);
      if (selected < today) {
        alert("Follow-up date cannot be in the past.");
        return;
      }
    }
    setSaving(true);
    try {
      const employee = JSON.parse(localStorage.getItem("employee") || "{}");

      await axios.post(`${API_BASE_URL}/api/leads/work-history`, {
        leadId,
        stage,
        note,
        followUpDate: followUpDate || null,
        followUpTime: followUpTime || null,
        reminder,
        createdBy: employee.employee_id || employee.id || employee.name || null,
      });

      // Refresh history
      const res = await axios.get(`${API_BASE_URL}/api/leads/work-history/${leadId}`);
      setHistory(res.data);
      setNote("");
      alert("Work update saved!");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to save update");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      padding: "20px",
      fontFamily: "'DM Sans', sans-serif",
      background: "#fff",
      minHeight: "100%",
    }}>
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap"
        rel="stylesheet"
      />

      {/* Lead Info */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ fontSize: "16px", fontWeight: 600, color: "#1a1a1a" }}>
          {leadData?.full_name}
        </div>
        <div style={{ fontSize: "13px", color: "#888", marginBottom: "6px" }}>
          {leadData?.company}
        </div>
        <span style={{
          background: "#FFF9E6", color: "#8A6A00",
          fontSize: "11px", fontWeight: 600,
          padding: "3px 10px", borderRadius: "20px",
        }}>
          {leadData?.status}
        </span>
      </div>

      {/* Meta row */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr",
        gap: "12px", marginBottom: "20px",
        background: "#fff", borderRadius: "12px",
        padding: "14px", border: "1px solid #f0f0f0",
      }}>
        {[
          {
            label: "Assigned To",
            value: leadData?.assigned_to_name || "Unassigned",
            icon: "👤"
          },
          { label: "Source",      value: leadData?.channel,     icon: "📡" },
          { label: "Created On",  value: formatDate(leadData?.created_at), icon: "Created" },
          { label: "Follow-up",   value: formatFollowUp(leadData?.follow_up_date, leadData?.follow_up_time), icon: "Next" },
        ].map(({ label, value, icon }) => (
          <div key={label}>
            <div style={{ fontSize: "11px", color: "#aaa", fontWeight: 500, marginBottom: "3px" }}>{label}</div>
            <div style={{ fontSize: "12.5px", color: "#444", fontWeight: 500 }}>
              {icon} {value || "—"}
            </div>
          </div>
        ))}
      </div>

      {/* Change Stage
      <div style={{ marginBottom: "16px", position: "relative" }}>
        <label style={{ fontSize: "13px", fontWeight: 600, color: "#333", display: "block", marginBottom: "7px" }}>
          Change Stage
        </label>
        <button
          onClick={() => setStageOpen(o => !o)}
          style={{
            width: "100%", padding: "10px 14px",
            border: "1.5px solid #e5e7eb", borderRadius: "10px",
            background: "#fff", cursor: "pointer",
            display: "flex", justifyContent: "space-between", alignItems: "center",
            fontSize: "13.5px", color: stage ? "#1a1a1a" : "#aaa",
            fontFamily: "inherit",
          }}
        >
          <span style={{ textTransform: "capitalize" }}>{stage || "Select stage"}</span>
          <span style={{
            fontSize: "11px", color: "#aaa",
            transform: stageOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
          }}>▼</span>
        </button>

        {stageOpen && (
          <div style={{
            position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
            background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: "10px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.1)", zIndex: 99, overflow: "hidden",
          }}>
            {stages.map(s => (
              <div
                key={s}
                onClick={() => { setStage(s); setStageOpen(false); }}
                style={{
                  padding: "10px 16px", fontSize: "13.5px", cursor: "pointer",
                  color: stage === s ? "#8A6A00" : "#333",
                  background: stage === s ? "#FFF9E6" : "transparent",
                  fontWeight: stage === s ? 600 : 400,
                  textTransform: "capitalize",
                }}
              >{s}</div>
            ))}
          </div>
        )}
      </div> */}

      {/* Add Note */}
      <div style={{ marginBottom: "16px" }}>
        <label style={{ fontSize: "13px", fontWeight: 600, color: "#333", display: "block", marginBottom: "7px" }}>
          Add Note
        </label>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Write a note about this interaction..."
          rows={3}
          style={{
            width: "100%", padding: "10px 13px",
            border: "1.5px solid #e5e7eb", borderRadius: "10px",
            background: "#fff", resize: "none",
            fontSize: "13.5px", color: "#333", fontFamily: "inherit",
            outline: "none", boxSizing: "border-box", lineHeight: 1.5,
          }}
          onFocus={e => e.target.style.borderColor = YELLOW}
          onBlur={e => e.target.style.borderColor = "#e5e7eb"}
        />
      </div>

      {/* Next Follow-up */}
      <div style={{ marginBottom: "16px" }}>
        <label style={{ fontSize: "13px", fontWeight: 600, color: "#333", display: "block", marginBottom: "7px" }}>
          Next Follow-up
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <input
            type="date"
            value={followUpDate}
            onChange={e => setFollowUpDate(e.target.value)}
            style={{
              width: "100%", padding: "10px 13px",
              border: "1.5px solid #e5e7eb", borderRadius: "10px",
              background: "#fff", fontSize: "13px",
              fontFamily: "inherit", outline: "none", boxSizing: "border-box",
            }}
            onFocus={e => e.target.style.borderColor = YELLOW}
            onBlur={e => e.target.style.borderColor = "#e5e7eb"}
          />
          <input
            type="time"
            value={followUpTime}
            onChange={e => setFollowUpTime(e.target.value)}
            style={{
              width: "100%", padding: "10px 13px",
              border: "1.5px solid #e5e7eb", borderRadius: "10px",
              background: "#fff", fontSize: "13px",
              fontFamily: "inherit", outline: "none", boxSizing: "border-box",
            }}
            onFocus={e => e.target.style.borderColor = YELLOW}
            onBlur={e => e.target.style.borderColor = "#e5e7eb"}
          />
        </div>
      </div>

      {/* Set Reminder */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: "20px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span>🔔</span>
          <span style={{ fontSize: "13.5px", color: "#444", fontWeight: 500 }}>Set Reminder</span>
        </div>
        <button
          onClick={() => setReminder(r => !r)}
          style={{
            width: "46px", height: "26px", borderRadius: "13px",
            background: reminder ? YELLOW : "#ddd",
            border: "none", cursor: "pointer", position: "relative",
            transition: "background 0.25s", padding: 0,
          }}
        >
          <span style={{
            position: "absolute", top: "3px",
            left: reminder ? "23px" : "3px",
            width: "20px", height: "20px", borderRadius: "50%",
            background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
            transition: "left 0.25s", display: "block",
          }} />
        </button>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-black transition-all shadow-sm"

        style={{
          width: "100%", padding: "13px",
          background: saving ? "#f0c060" : YELLOW,
          border: "none", borderRadius: "12px",
         
          cursor: saving ? "not-allowed" : "pointer",
          fontFamily: "inherit",
          boxShadow: "0 4px 14px rgba(245,197,24,0.28)",
          marginBottom: "24px",
        }}
      >
        {saving ? "Saving..." : "Save Update"}
      </button>

      {/* History Log */}
      <div>
        <div style={{ fontSize: "13px", fontWeight: 600, color: "#333", marginBottom: "12px" }}>
          History
        </div>

        {loading && (
          <div style={{ fontSize: "13px", color: "#aaa", textAlign: "center", padding: "20px 0" }}>
            Loading...
          </div>
        )}

        {!loading && history.length === 0 && (
          <div style={{ fontSize: "13px", color: "#bbb", textAlign: "center", padding: "20px 0" }}>
            No updates yet
          </div>
        )}

        {history.map(h => (
          <div key={h.id} style={{
            background: "#fff", borderRadius: "12px",
            border: "1px solid #f0f0f0", padding: "14px",
            marginBottom: "10px",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <span style={{
                background: "#FFF9E6", color: "#8A6A00",
                fontSize: "11px", fontWeight: 700,
                padding: "2px 10px", borderRadius: "20px",
                textTransform: "capitalize",
              }}>
                {h.stage}
              </span>
              <span style={{ fontSize: "11px", color: "#bbb" }}>
                {formatDateTime(h.created_at)}
              </span>
            </div>

            {h.note && (
              <div style={{ fontSize: "13px", color: "#444", marginBottom: "6px" }}>
                {h.note}
              </div>
            )}

            {h.follow_up_date && (
              <div style={{ fontSize: "12px", color: "#666", marginTop: "6px" }}>
                Follow-up: {formatFollowUp(h.follow_up_date, h.follow_up_time)}
              </div>
            )}

            {h.reminder && (
              <div style={{ marginTop: "6px" }}>
                <span style={{
                  fontSize: "11px",
                  background: "#FFF9E6",
                  color: "#8A6A00",
                  border: `1px solid ${YELLOW}`,
                  padding: "2px 8px",
                  borderRadius: "999px",
                  fontWeight: 600,
                }}>
                  Reminder set
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
