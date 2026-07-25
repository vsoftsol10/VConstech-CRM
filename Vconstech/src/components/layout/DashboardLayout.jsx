
import { useState } from "react";
import { motion } from "framer-motion";
import Sidebar from "./Sidebar";
import Header from "./Header";

const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="bg-[#f5f5f5] min-h-screen">

      {/* SIDEBAR */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* MAIN CONTENT — always offset on lg, no animation that fights the sidebar */}
      <div className="lg:ml-[230px] min-h-screen flex flex-col">

        {/* HEADER */}
        <div className="sticky top-0 z-30">
          <Header setSidebarOpen={setSidebarOpen} />
        </div>

        {/* PAGE CONTENT */}
        <motion.main
          className="p-2 sm:p-3 md:p-4 flex-1"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          {children}
        </motion.main>

      </div>

    </div>
  );
};

export default DashboardLayout;