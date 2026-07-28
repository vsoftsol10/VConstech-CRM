import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch, FiBell, FiPlus, FiMenu, FiChevronDown, FiUser, FiLogOut } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { API_BASE_URL } from "../../config/api";
const API = `${API_BASE_URL}`;
const pages = [
  { label: "Dashboard",    path: "/Dashboard",    keywords: ["dashboard", "home", "analytics", "stats", "charts"] },
  { label: "Lead & Sales", path: "/lead-sales",   keywords: ["lead", "sales", "pipeline", "qualified", "contacted", "proposal", "won", "lost"] },
  { label: "Customer",     path: "/customer",     keywords: ["customer", "client", "members", "active", "inactive"] },
  { label: "Department",   path: "/department",   keywords: ["department", "team", "division"] },
  { label: "Subscription", path: "/subscription", keywords: ["subscription", "plan", "renew", "expire", "mrr"] },
];

const pageIcons = {
  "Dashboard":    "📊",
  "Lead & Sales": "🎯",
  "Customer":     "👥",
  "Department":   "🏢",
  "Subscription": "📋",
};

function getInitials(name = "") {
  return name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() || "").join("");
}

// ── Profile Drawer ─────────────────────────────────────────────────────────────
// function ProfileDrawer({ employee, onClose, onLogout }) {
//   const avatarSrc = employee?.profile_image
//     ? `${API}/uploads/${employee.profile_image}`
//     : null;

//   const fields = [
//     { label: "Full Name",   value: employee?.name },
//     { label: "Email",       value: employee?.email },
//     { label: "Employee ID", value: employee?.employee_id },
//     { label: "Department",  value: employee?.department },
//     { label: "Designation", value: employee?.designation },
//     { label: "Phone",       value: employee?.phone },
//   ];

//   return (
//     <>
//       {/* Backdrop */}
//       <motion.div
//         initial={{ opacity: 0 }}
//         animate={{ opacity: 1 }}
//         exit={{ opacity: 0 }}
//         onClick={onClose}
//         className="fixed inset-0 bg-black/30 z-[998]"
//       />

//       {/* Drawer */}
//       <motion.div
//         initial={{ x: "100%" }}
//         animate={{ x: 0 }}
//         exit={{ x: "100%" }}
//         transition={{ type: "spring", damping: 28, stiffness: 280 }}
//         className="fixed top-0 right-0 h-full w-[340px] bg-white shadow-2xl z-[999] flex flex-col"
//       >
//         {/* Drawer Header */}
//         <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
//           <h2 className="text-base font-bold text-gray-800">My Profile</h2>
//           <button
//             onClick={onClose}
//             className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
//           >
//             <FiX className="text-gray-600" />
//           </button>
//         </div>

//         {/* Avatar + name */}
//         <div className="flex flex-col items-center gap-3 py-7 px-5 bg-gradient-to-b from-[#FFFBE6] to-white border-b border-gray-100">
//           <div className="w-[80px] h-[80px] rounded-full overflow-hidden ring-4 ring-[#F5C518]/40">
//             {avatarSrc ? (
//               <img src={avatarSrc} alt={employee?.name} className="w-full h-full object-cover" />
//             ) : (
//               <div className="w-full h-full bg-gradient-to-br from-[#F5C518] to-yellow-300 flex items-center justify-center text-2xl font-bold text-black">
//                 {getInitials(employee?.name || "U")}
//               </div>
//             )}
//           </div>
//           <div className="text-center">
//             <p className="text-base font-bold text-gray-800">{employee?.name || "—"}</p>
//             <p className="text-sm text-gray-400 mt-0.5">{employee?.designation || employee?.role || "—"}</p>
//             <span className="inline-block mt-2 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#fffbe6] text-[#b8900a] border border-[#F5C518]/40">
//               {employee?.employee_id || ""}
//             </span>
//           </div>
//         </div>

//         {/* Fields */}
//         <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
//           {fields.map(({ label, value }) => value ? (
//             <div key={label} className="bg-[#fafafa] rounded-xl px-4 py-3 border border-gray-100">
//               <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
//               <p className="text-sm font-medium text-gray-800">{value}</p>
//             </div>
//           ) : null)}
//         </div>

//         {/* Logout button at bottom */}
//         <div className="px-5 py-4 border-t border-gray-100">
//           <button
//             onClick={onLogout}
//             className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors text-sm font-semibold"
//           >
//             <span>🚪</span> Log out
//           </button>
//         </div>
//       </motion.div>
//     </>
//   );
// }

// ── Header ─────────────────────────────────────────────────────────────────────
const Header = ({ setSidebarOpen }) => {
  const [query,       setQuery]       = useState("");
  const [results,     setResults]     = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [employee, setEmployee] = useState(() => {
    try { return JSON.parse(localStorage.getItem("employee") || "null"); }
    catch { return null; }
  });

  const searchRef = useRef(null);
  const profileRef = useRef(null);
  const navigate  = useNavigate();

  const fetchNotifications = async (emp = employee) => {
    if (!emp?.employee_id) {
      setNotifications([]);
      setNotificationCount(0);
      return;
    }

    try {
      const [listRes, countRes] = await Promise.all([
        fetch(`${API}/api/notifications?employee_id=${encodeURIComponent(emp.employee_id)}`),
        fetch(`${API}/api/notifications/count?employee_id=${encodeURIComponent(emp.employee_id)}`),
      ]);
      const list = await listRes.json();
      const count = await countRes.json();
      setNotifications(list.data || []);
      setNotificationCount(count.data?.unread || 0);
    } catch {
      setNotifications([]);
      setNotificationCount(0);
    }
  };

  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target))
        setShowResults(false);
      if (profileRef.current && !profileRef.current.contains(e.target))
        setShowProfileMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
useEffect(() => {
  const sync = () => {
    try {
      const emp = JSON.parse(localStorage.getItem("employee") || "null");
      setEmployee(emp);
      fetchNotifications(emp);
    }
    catch { }
  };
  window.addEventListener("storage", sync);
  window.addEventListener("employeeUpdated", sync); // ← same-tab refresh
  return () => {
    window.removeEventListener("storage", sync);
    window.removeEventListener("employeeUpdated", sync);
  };
}, []);

useEffect(() => {
  fetchNotifications(employee);
  const id = setInterval(() => fetchNotifications(employee), 30000);
  return () => clearInterval(id);
}, [employee?.employee_id]);

  const handleSearch = (value) => {
    setQuery(value);
    if (!value.trim()) { setResults([]); setShowResults(false); return; }
    const q = value.toLowerCase();
    const matched = pages.filter(
      (p) => p.label.toLowerCase().includes(q) || p.keywords.some((k) => k.includes(q))
    );
    setResults(matched);
    setShowResults(true);
  };

  const handleSelect = (path) => {
    setQuery(""); setResults([]); setShowResults(false);
    navigate(path);
  };

  const handleLogout = () => {
    localStorage.removeItem("employee");
    localStorage.removeItem("token");
    setShowProfileMenu(false);
    navigate("/");
  };

  const openNotification = async (notification) => {
    try {
      await fetch(`${API}/api/notifications/${notification.id}/read`, { method: "PUT" });
    } catch {
      // The navigation should still work if marking read fails.
    }

    setNotifications((prev) =>
      prev.map((item) =>
        item.id === notification.id ? { ...item, status: "Read", is_read: true } : item
      )
    );
    setNotificationCount((count) => Math.max(0, count - (notification.is_read ? 0 : 1)));
    setShowNotifications(false);

    if (notification.link) {
      navigate(notification.link);
    } else if (notification.related_type === "ticket") {
      navigate(`/Tickets?ticket=${notification.related_id}`);
    } else if (notification.related_type === "task") {
      navigate(`/Tickets?task=${notification.related_id}`);
    } else {
      navigate("/Tickets");
    }
  };

  const avatarSrc = employee?.profile_image
    ? `${API}/uploads/${employee.profile_image}`
    : null;

  return (
    <>
      <header className="h-[64px] bg-white border-b border-gray-200 px-4 md:px-6 flex items-center justify-between shadow-sm">

        {/* Left */}
        <div className="flex items-center gap-3 flex-1">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden w-9 h-9 rounded-lg bg-[#f5f5f5] flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <FiMenu className="text-lg text-gray-600" />
          </button>

          {/* Search */}
          <div className="flex-1 max-w-[560px] relative" ref={searchRef}>
            <div className="flex items-center h-[40px] bg-[#f5f5f5] rounded-xl px-3 border border-transparent focus-within:border-[#F5C518] focus-within:bg-white transition-all duration-200">
              <FiSearch className="text-gray-400 text-base shrink-0" />
              <input
                type="text"
                placeholder="Search pages..."
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => query && setShowResults(true)}
                className="flex-1 bg-transparent outline-none px-2.5 text-sm text-gray-700 placeholder:text-gray-400"
              />
              {query && (
                <button
                  onClick={() => { setQuery(""); setResults([]); setShowResults(false); }}
                  className="text-gray-400 hover:text-gray-600 text-lg leading-none shrink-0"
                >×</button>
              )}
            </div>

            <AnimatePresence>
              {showResults && (
                <motion.div
                  key="search-results"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute top-[48px] left-0 w-full bg-white border border-gray-200 rounded-2xl shadow-lg z-50 overflow-hidden py-1.5"
                >
                  {results.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-gray-400">
                      No results for "<span className="font-medium text-gray-600">{query}</span>"
                    </div>
                  ) : (
                    results.map((page) => (
                      <button
                        key={page.path}
                        onClick={() => handleSelect(page.path)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#FFFBF0] transition-colors text-left"
                      >
                        <span className="text-lg shrink-0">{pageIcons[page.label]}</span>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{page.label}</p>
                          <p className="text-xs text-gray-400">Go to {page.label}</p>
                        </div>
                      </button>
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 md:gap-3 ml-3">

 <button
      onClick={() => navigate("/create-ticket")}
      className="flex items-center gap-1.5 h-[38px] px-3 md:px-4 rounded-xl bg-[#F5C518] hover:bg-yellow-400 transition-colors font-semibold text-sm text-black"
    >
      <FiPlus className="text-base" />
      <span className="hidden sm:block">Create Ticket</span>
    </button>

          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications((v) => !v);
                fetchNotifications();
              }}
              className="relative w-[38px] h-[38px] rounded-xl bg-[#f5f5f5] flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
            >
              <FiBell className="text-gray-700 text-lg" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 rounded-full border border-white text-[10px] leading-[16px] text-white font-bold">
                  {notificationCount > 9 ? "9+" : notificationCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-[46px] w-[340px] max-w-[calc(100vw-24px)] bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <p className="text-sm font-bold text-gray-800">Notifications</p>
                    <span className="text-[11px] font-semibold text-[#b8900a] bg-[#fffbe6] px-2 py-1 rounded-full">
                      {notificationCount} unread
                    </span>
                  </div>

                  <div className="max-h-[360px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-sm text-gray-400">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.slice(0, 10).map((notification) => {
                        const unread = !notification.is_read && notification.status !== "Read";
                        return (
                          <button
                            key={notification.id}
                            onClick={() => openNotification(notification)}
                            className="w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-[#FFFBF0] transition-colors"
                          >
                            <div className="flex items-start gap-3">
                              <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${unread ? "bg-red-500" : "bg-gray-300"}`} />
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-800 truncate">
                                  {notification.title || "Notification"}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                                  {notification.message || "Open notification"}
                                </p>
                                <p className="text-[11px] text-gray-400 mt-1">
                                  {unread ? "Unread" : "Read"}
                                </p>
                              </div>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {/* Avatar — click to open profile drawer directly */}
          <div className="relative" ref={profileRef}>
          <button
            onClick={() => {
              setShowProfileMenu((value) => !value);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <div className="w-[34px] h-[34px] rounded-full overflow-hidden ring-2 ring-[#F5C518]/40 shrink-0">
              {avatarSrc ? (
                <img src={avatarSrc} alt={employee?.name} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = "none"; }} />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#F5C518] to-yellow-300 flex items-center justify-center text-xs font-bold text-black">
                  {getInitials(employee?.name || "U")}
                </div>
              )}
            </div>
            <div className="hidden md:flex flex-col items-start leading-tight">
              <span className="text-sm font-semibold text-gray-800 max-w-[120px] truncate">{employee?.name || "Employee"}</span>
              <span className="text-[11px] text-gray-400 max-w-[120px] truncate">{employee?.designation || employee?.role || ""}</span>
            </div>
            <FiChevronDown className={`text-gray-400 transition-transform ${showProfileMenu ? "rotate-180" : ""}`} size={14} />
          </button>

          <AnimatePresence>
            {showProfileMenu && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-[46px] z-50 w-44 overflow-hidden rounded-2xl border border-gray-200 bg-white py-2 shadow-xl"
              >
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate("/profile");
                  }}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-[#FFFBF0]"
                >
                  <FiUser size={14} className="text-[#C89B00]" />
                  View Profile
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium text-red-500 transition-colors hover:bg-red-50"
                >
                  <FiLogOut size={14} />
                  Logout
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          </div>

        </div>
      </header>

    </>
  );
};

export default Header;
