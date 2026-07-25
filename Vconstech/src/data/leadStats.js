import {
  Users,
  UserCheck,
  TrendingUp,
  UserX,
} from "lucide-react";

export const leadStats = [
  {
    id: 1,
    title: "Total Leads",
    value: "2,438",
    subtitle: "128 this Week",
    growth: "+12.6%",
    growthType: "positive",
    icon: Users,
  },
  {
    id: 2,
    title: "Qualified Leads",
    value: "1,328",
    subtitle: "23 this week",
    growth: "+8.4%",
    growthType: "positive",
    icon: UserCheck,
  },
  {
    id: 3,
    title: "Conversion Rate",
    value: "24.6%",
    subtitle: "from last month",
    growth: "+4.2%",
    growthType: "positive",
    icon: TrendingUp,
  },
  {
    id: 4,
    title: "Lost",
    value: "186",
    subtitle: "this week",
    growth: "-2.4%",
    growthType: "negative",
    icon: UserX,
  },
];