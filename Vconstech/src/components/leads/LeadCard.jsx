
import { FiMail, FiPhone } from "react-icons/fi";

const avatarColors = [
  "from-blue-400 to-indigo-500",
  "from-pink-400 to-rose-500",
  "from-green-400 to-teal-500",
  "from-amber-400 to-orange-500",
  "from-purple-400 to-violet-500",
];

const planBadgeStyles = {
  Basic:   "bg-blue-50 text-blue-500",
  Premium: "bg-purple-50 text-purple-500",
  Advance: "bg-orange-50 text-orange-500",
};

const LeadCard = ({ id = 0, name, company, email, phone, plan }) => {
  const colorIdx = id % avatarColors.length;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-yellow-200 transition-all duration-200 cursor-pointer">

      <div className="flex gap-3">

        {/* Avatar */}
        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarColors[colorIdx]} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
          {name?.charAt(0) ?? "?"}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="text-[14px] font-semibold text-[#111] truncate">{name}</h3>
            {plan && (
              <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold ${planBadgeStyles[plan] ?? "bg-gray-100 text-gray-500"}`}>
                {plan}
              </span>
            )}
          </div>

          <p className="text-[11px] text-gray-400 truncate mb-2">{company}</p>

          <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mb-1 min-w-0">
            <FiMail className="text-gray-400 shrink-0" size={11} />
            <span className="truncate">{email}</span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-gray-500 min-w-0">
            <FiPhone className="text-gray-400 shrink-0" size={11} />
            <span className="truncate">{phone}</span>
          </div>
        </div>

      </div>

    </div>
  );
};

export default LeadCard;