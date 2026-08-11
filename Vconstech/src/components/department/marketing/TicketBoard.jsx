import { motion } from "framer-motion";
import TicketCard from "./TicketCard";

const tickets = [
  {
    channel:    "Whatsapp",
    name:       "Aarav Mehta",
    company:    "Mehta Interiors",
    initials:   "PS",
    status:     "Engaged",
    nextAction: "Call client",
    time:       "12 : 00PM",
    id:         "#L-1042",
    ago:        "2m ago",
  },
  {
    channel:    "Meta Ads",
    name:       "Aarav Mehta",
    company:    "Mehta Interiors",
    initials:   "PS",
    status:     "Contacted",
    nextAction: "Send Brochure",
    time:       "12 : 00PM",
    id:         "#L-1042",
    ago:        "2m ago",
  },
  {
    channel:    "Instagram",
    name:       "Aarav Mehta",
    company:    "Mehta Interiors",
    initials:   "PS",
    status:     "Engaged",
    nextAction: "Call client",
    time:       "12 : 00PM",
    id:         "#L-1042",
    ago:        "2m ago",
  },
  {
    channel:    "Website",
    name:       "Aarav Mehta",
    company:    "Mehta Interiors",
    initials:   "PS",
    status:     "Engaged",
    nextAction: "Proposal Review",
    time:       "12 : 00PM",
    id:         "#L-1042",
    ago:        "2m ago",
  },
  {
    channel:    "Email",
    name:       "Aarav Mehta",
    company:    "Mehta Interiors",
    initials:   "PS",
    status:     "Engaged",
    nextAction: "Proposal Review",
    time:       "12 : 00PM",
    id:         "#L-1042",
    ago:        "2m ago",
  },
];

const TicketBoard = () => {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
      {tickets.map((ticket, i) => (
        <TicketCard key={i} ticket={ticket} index={i} />
      ))}
    </div>
  );
};

export default TicketBoard;
