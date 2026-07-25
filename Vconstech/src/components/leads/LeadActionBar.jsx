import { motion } from "framer-motion";
import { FiFilter } from "react-icons/fi";

const LeadActionBar = () => {
  return (
    <div
      className="
        flex
        items-center
        justify-end
        gap-3
        mt-7
        mb-7
        flex-wrap
      "
    >

      {/* Add Lead Button */}
      <motion.button
        whileHover={{
          scale: 1.03,
        }}
        whileTap={{
          scale: 0.98,
        }}
        className="
          h-[44px]
          px-5
          rounded-xl
          bg-[#F5C518]
          hover:bg-[#e5b800]
          text-black
          font-semibold
          text-[14px]
          transition-all
          duration-300
          shadow-sm
        "
      >
        + Add Lead
      </motion.button>

      {/* Filters Button */}
      <motion.button
        whileHover={{
          scale: 1.03,
        }}
        whileTap={{
          scale: 0.98,
        }}
        className="
          h-[44px]
          px-5
          rounded-xl
          border
          border-gray-300
          bg-white
          hover:bg-gray-50
          text-gray-700
          font-medium
          text-[14px]
          transition-all
          duration-300
          flex
          items-center
          gap-2
        "
      >

        <FiFilter className="text-[15px]" />

        Filters

      </motion.button>

    </div>
  );
};

export default LeadActionBar;