import { motion } from "framer-motion";
import { FiClock } from "react-icons/fi";
import { BsThreeDots } from "react-icons/bs";

// Channel dot colors
const channelColors = {
  Whatsapp:  "bg-green-500",
  "Meta Ads": "bg-blue-500",
  Instagram: "bg-pink-500",
  Website:   "bg-purple-500",
  Email:     "bg-orange-400",
};

// Status badge colors
const statusColors = {
  Engaged:   "bg-green-100 text-green-600",
  Contacted: "bg-blue-100 text-blue-600",
  Proposal:  "bg-yellow-100 text-yellow-700",
  New:       "bg-gray-100 text-gray-600",
};

// Avatar colors (cycle through)
const avatarBg = ["bg-pink-400", "bg-green-400", "bg-blue-400", "bg-purple-400", "bg-orange-400"];

const TicketCard = ({ ticket, index }) => {
  const dotColor    = channelColors[ticket.channel] || "bg-gray-400";
  const statusStyle = statusColors[ticket.status]   || "bg-gray-100 text-gray-600";
  const avatarColor = avatarBg[index % avatarBg.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.07 }}
      className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow duration-300 min-w-[220px] flex-1 max-w-[280px]"
    >
      {/* Header: Channel + dots */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
          <span className="text-[13px] font-semibold text-gray-800">{ticket.channel}</span>
        </div>
        <button className="text-gray-400 hover:text-gray-600 transition-colors">
          <BsThreeDots />
        </button>
      </div>

      {/* Customer Row */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[13px] font-semibold text-gray-900 leading-tight">{ticket.name}</p>
          <p className="text-[11px] text-gray-400">{ticket.company}</p>
        </div>
        {/* Avatar */}
        <div className={`w-8 h-8 rounded-full ${avatarColor} flex items-center justify-center text-white text-[11px] font-bold shrink-0`}>
          {ticket.initials}
        </div>
      </div>

      {/* Tags */}
      <div className="flex items-center gap-1.5 mb-3 flex-wrap">
        <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
          {ticket.channel}
        </span>
        <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${statusStyle}`}>
          {ticket.status}
        </span>
      </div>

      {/* Next Action */}
      <div className="mb-3">
        <p className="text-[11px] text-gray-400 mb-0.5">Next Action</p>
        <div className="flex items-center justify-between">
          <p className="text-[13px] font-semibold text-gray-800">{ticket.nextAction}</p>
          <div className="flex items-center gap-1 text-gray-400">
            <FiClock className="text-[11px]" />
            <span className="text-[11px]">{ticket.time}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <span className="text-[11px] text-gray-400 font-medium">{ticket.id}</span>
        <span className="text-[11px] text-gray-400">{ticket.ago}</span>
      </div>
    </motion.div>
  );
};

export default TicketCard;
