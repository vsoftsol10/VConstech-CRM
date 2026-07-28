import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config/api";

const STYLE = `
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
`;

const ICONS = [
  // People
  <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />,
  // Briefcase
  <path d="M20 7h-4V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zm-10-2h4v2h-4V5zm10 15H4V9h16v11z" />,
  // Chart bar
  <path d="M5 3H3v18h18v-2H5V3zm14 12h-4V9h4v6zm-6 0H9V6h4v9zm-6 0H3v-3h4v3z" />,
  // Star
  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />,
];

// ── Animated counter hook ────────────────────────────────────────────────────
function useCountUp(target, duration = 600, start = false) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!start || target === 0) return;
    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // easeOutCubic — smooth deceleration, no bounce
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);

  return value;
}

// ── Single stat card ─────────────────────────────────────────────────────────
function StatCard({ stat, index, visible }) {
  const animatedCount = useCountUp(stat.count, 600, visible);
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        animation: visible ? `slideUp 0.4s ease forwards` : "none",
        animationDelay: `${index * 80}ms`,
        opacity: visible ? undefined : 0,
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
        transition: "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
        boxShadow: hovered
          ? "0 8px 24px rgba(0,0,0,0.08)"
          : "0 1px 4px rgba(0,0,0,0.05)",
      }}
      className={`bg-white border rounded-2xl p-6 min-h-[150px] flex flex-col justify-between cursor-default ${
        hovered ? "border-[#F5C518]" : "border-gray-100"
      }`}
    >
      {/* Top row */}
      <div className="flex justify-between items-start mb-3">
        <span className="text-sm text-gray-500 font-medium leading-snug">
          {stat.label}
        </span>

        {/* Icon — simple fade in, no pop */}
        <span
          className="w-9 h-9 rounded-xl bg-yellow-50 flex items-center justify-center text-yellow-500 shrink-0"
          style={{
            animation: visible ? `fadeIn 0.4s ease forwards` : "none",
            animationDelay: `${index * 80 + 150}ms`,
            opacity: visible ? undefined : 0,
          }}
        >
          <svg width="17" height="17" fill="currentColor" viewBox="0 0 24 24">
            {ICONS[index % ICONS.length]}
          </svg>
        </span>
      </div>

      {/* Count */}
      <div
        style={{
          animation: visible ? `fadeIn 0.4s ease forwards` : "none",
          animationDelay: `${index * 80 + 100}ms`,
          opacity: visible ? undefined : 0,
        }}
      >
        <p className="text-3xl font-bold text-gray-800 tabular-nums">
          {animatedCount}
        </p>
        <p className="text-xs text-gray-400 mt-1 font-medium">
          {stat.count === 1 ? "member" : "members"}
        </p>
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export default function TeamStats({ members = null }) {
  const [visible, setVisible] = useState([]);
  const [stats, setStats] = useState([]);

  useEffect(() => {
    if (Array.isArray(members)) {
      applyStats(members);
    } else {
      fetchTeamStats();
    }
  }, [members]);

  const applyStats = (teamMembers) => {
    const departmentCounts = teamMembers.reduce((acc, member) => {
      const dept = member.department;
      if (!dept) return acc;
      if (!acc[dept]) acc[dept] = 0;
      acc[dept] += 1;
      return acc;
    }, {});

    const formattedStats = Object.entries(departmentCounts).map(
      ([label, count]) => ({ label: `${label} Team`, count })
    );

    setStats(formattedStats);
    setVisible([]);

    formattedStats.forEach((_, i) => {
      setTimeout(() => {
        setVisible((prev) => [...prev, i]);
      }, 80 + i * 80);
    });
  };

  const fetchTeamStats = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/team`);
      applyStats(res.data);
    } catch {
      setStats([]);
    }
  };

  return (
    <>
      <style>{STYLE}</style>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, i) => (
          <StatCard
            key={stat.label}
            stat={stat}
            index={i}
            visible={visible.includes(i)}
          />
        ))}
      </div>
    </>
  );
}
