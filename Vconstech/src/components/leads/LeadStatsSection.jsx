
import { useEffect, useState } from "react";
import axios from "axios";
import LeadStatsCard from "./LeadStatsCard";
import {
  FiUsers,
  FiPhoneCall,
  FiCheckCircle,
  FiTrendingUp,
} from "react-icons/fi";

const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);

const getTrend = (leads, status) => {
  const now = new Date();
  const currentStart = startOfMonth(now);
  const previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const matchesStatus = (lead) =>
    !status || String(lead.status || "").toLowerCase() === status;

  const countInRange = (from, to) =>
    leads.filter((lead) => {
      const createdAt = lead.created_at ? new Date(lead.created_at) : null;
      return (
        createdAt &&
        !Number.isNaN(createdAt.getTime()) &&
        createdAt >= from &&
        createdAt < to &&
        matchesStatus(lead)
      );
    }).length;

  const current = countInRange(currentStart, new Date(now.getFullYear(), now.getMonth() + 1, 1));
  const previous = countInRange(previousStart, currentStart);
  const difference = current - previous;
  const percentage = previous > 0
    ? Math.round((difference / previous) * 100)
    : current > 0
      ? 100
      : 0;

  return {
    growth: `${difference >= 0 ? "+" : ""}${percentage}%`,
    growthType: difference >= 0 ? "positive" : "negative",
  };
};

const LeadStatsSection = ({ refreshKey }) => {
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    contacted: 0,
    won: 0,
    trends: {
      total: { growth: "+0%", growthType: "positive" },
      new: { growth: "+0%", growthType: "positive" },
      contacted: { growth: "+0%", growthType: "positive" },
      won: { growth: "+0%", growthType: "positive" },
    },
  });

  useEffect(() => {
    fetchLeadStats();
  }, [refreshKey]);

  const fetchLeadStats = async () => {
    try {
      const { data } = await axios.get(
        "http://localhost:5000/api/leads"
      );

      setStats({
        total: data.length,
        new: data.filter(
          (lead) =>
            lead.status &&
            lead.status.toLowerCase() === "new"
        ).length,
        contacted: data.filter(
          (lead) =>
            lead.status &&
            lead.status.toLowerCase() === "contacted"
        ).length,
        won: data.filter(
          (lead) =>
            lead.status &&
            lead.status.toLowerCase() === "won"
        ).length,
        trends: {
          total: getTrend(data),
          new: getTrend(data, "new"),
          contacted: getTrend(data, "contacted"),
          won: getTrend(data, "won"),
        },
      });
    } catch (error) {
      console.error("Lead Stats Error:", error);
    }
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <LeadStatsCard
        title="Total Leads"
        value={stats.total}
        subtitle="All Leads"
        growth={stats.trends.total.growth}
        growthType={stats.trends.total.growthType}
        icon={FiUsers}
      />

      <LeadStatsCard
        title="New Leads"
        value={stats.new}
        subtitle="New Prospects"
        growth={stats.trends.new.growth}
        growthType={stats.trends.new.growthType}
        icon={FiTrendingUp}
      />

      <LeadStatsCard
        title="Contacted"
        value={stats.contacted}
        subtitle="Reached Out"
        growth={stats.trends.contacted.growth}
        growthType={stats.trends.contacted.growthType}
        icon={FiPhoneCall}
      />

      <LeadStatsCard
        title="Won Deals"
        value={stats.won}
        subtitle="Successful"
        growth={stats.trends.won.growth}
        growthType={stats.trends.won.growthType}
        icon={FiCheckCircle}
      />
    </div>
  );
};

export default LeadStatsSection;
