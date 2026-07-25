// import { useState, useRef, useEffect } from 'react';
// import { Link, useLocation } from 'react-router-dom';
// import {
//     Search, Bell, LayoutDashboard, Users, Plus,
//     Building2, CreditCard, TrendingUp, Menu,
//     ChevronDown, Headphones, Code2, Megaphone, UserCheck
// } from 'lucide-react';
// import Logo from "../assets/logo.png";
// import { useNavigate } from "react-router-dom";

// const animStyles = `
//   @keyframes fadeIn {
//     from { opacity: 0; }
//     to   { opacity: 1; }
//   }
//   @keyframes slideInLeft {
//     from { opacity: 0; transform: translateX(-18px); }
//     to   { opacity: 1; transform: translateX(0); }
//   }
//   @keyframes slideInDown {
//     from { opacity: 0; transform: translateY(-10px); }
//     to   { opacity: 1; transform: translateY(0); }
//   }
//   @keyframes fadeUp {
//     from { opacity: 0; transform: translateY(12px); }
//     to   { opacity: 1; transform: translateY(0); }
//   }
//   @keyframes popIn {
//     from { opacity: 0; transform: scale(0.93); }
//     to   { opacity: 1; transform: scale(1); }
//   }
//   @keyframes dropDown {
//     from { opacity: 0; transform: translateY(-6px); }
//     to   { opacity: 1; transform: translateY(0); }
//   }
// `;

// const departmentTeams = [
//     { label: 'Sales Team',      icon: TrendingUp,  path: '/department/sales'     },
//     { label: 'Support Team',    icon: Headphones,  path: '/department/support'   },
//     { label: 'Technical Team',  icon: Code2,       path: '/department/technical' },
//     { label: 'Marketing Team',  icon: Megaphone,   path: '/department/marketing' },
// ];

// const navItems = [
//     { label: 'Dashboard',    icon: LayoutDashboard, path: '/' },
//     { label: 'Lead & Sales', icon: TrendingUp,      path: '/lead-sales' },
//     { label: 'Customer',     icon: Users,           path: '/customer' },
//     { label: 'Subscription', icon: CreditCard,      path: '/subscription' },
// ];

// export default function Layout({ children }) {
//     const navigate = useNavigate();
//     const location = useLocation();

//     const [search, setSearch]               = useState("");
//     const [searchError, setSearchError]     = useState("");
//     const [isOpen, setIsOpen]               = useState(false);
//     const [deptOpen, setDeptOpen]           = useState(false);

//     const sidebarRef = useRef();

//     const isDeptActive = departmentTeams.some(t => location.pathname === t.path)
//         || location.pathname === '/department';

//     // Auto-expand dept dropdown if a dept route is active
//     useEffect(() => {
//         if (isDeptActive) setDeptOpen(true);
//     }, [location.pathname]);

//     const allSearchItems = [
//         ...navItems,
//         { label: 'Department', icon: Building2, path: '/department' },
//         ...departmentTeams,
//     ];

//     const handleSearch = () => {
//         const foundPage = allSearchItems.find(item =>
//             item.label.toLowerCase().includes(search.toLowerCase())
//         );
//         if (foundPage) {
//             navigate(foundPage.path);
//             setSearchError("");
//             setSearch("");
//         } else {
//             setSearchError("No pages found");
//         }
//     };

//     useEffect(() => {
//         const handleClickOutside = (e) => {
//             if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
//                 setIsOpen(false);
//             }
//         };
//         if (isOpen) document.addEventListener("mousedown", handleClickOutside);
//         return () => document.removeEventListener("mousedown", handleClickOutside);
//     }, [isOpen]);

//     return (
//         <>
//             <style>{animStyles}</style>

//             <div className="flex h-screen bg-[#F5F5F5] overflow-hidden">
                

//                 {/* Overlay */}
//                 {isOpen && (
//                     <div
//                         className="fixed inset-0 bg-black/30 z-40 md:hidden"
//                         style={{ animation: "fadeIn 0.2s ease both" }}
//                     />
//                 )}

//                 {/* Sidebar */}
//                 <aside
//                     ref={sidebarRef}
//                     className={`fixed md:static z-50 top-0 left-0 h-full w-[220px] bg-white flex flex-col border-r border-gray-100
//                         transform transition-transform duration-300
//                         ${isOpen ? "translate-x-0" : "-translate-x-full"}
//                         md:translate-x-0`}
//                 >
//                     {/* Logo */}
//                     <div
//                         className="flex items-center gap-2 px-5 py-5"
//                         style={{ animation: "slideInDown 0.4s ease both" }}
//                     >
//                         <img src={Logo} alt="logo" />
//                     </div>

//                     {/* Nav */}
//                     <nav className="flex-1 px-3 mt-4 space-y-1 overflow-y-auto scrollbar-thin scroll-smooth">

//                         {/* Regular nav items (before Department) */}
//                         {navItems.slice(0, 2).map((item, i) => {
//                             const isActive = location.pathname === item.path;
//                             return (
//                                 <Link
//                                     key={item.path}
//                                     to={item.path}
//                                     onClick={() => setIsOpen(false)}
//                                     style={{ animation: `slideInLeft 0.35s ease ${80 + i * 55}ms both` }}
//                                     className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
//                                         ${isActive
//                                             ? 'bg-[#FFC107] text-white shadow-sm shadow-yellow-200'
//                                             : 'text-gray-600 hover:bg-gray-50 hover:translate-x-1'
//                                         }`}
//                                 >
//                                     <item.icon
//                                         className="w-5 h-5 flex-shrink-0 transition-transform duration-200"
//                                         style={{ transform: isActive ? "scale(1.15)" : "scale(1)" }}
//                                     />
//                                     {item.label}
//                                     {isActive && (
//                                         <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/70"
//                                             style={{ animation: "popIn 0.3s ease both" }} />
//                                     )}
//                                 </Link>
//                             );
//                         })}

//                         {/* Customer */}
//                         {(() => {
//                             const item = navItems[2];
//                             const isActive = location.pathname === item.path;
//                             return (
//                                 <Link
//                                     key={item.path}
//                                     to={item.path}
//                                     onClick={() => setIsOpen(false)}
//                                     style={{ animation: `slideInLeft 0.35s ease 190ms both` }}
//                                     className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
//                                         ${isActive
//                                             ? 'bg-[#FFC107] text-white shadow-sm shadow-yellow-200'
//                                             : 'text-gray-600 hover:bg-gray-50 hover:translate-x-1'
//                                         }`}
//                                 >
//                                     <item.icon className="w-5 h-5 flex-shrink-0" style={{ transform: isActive ? "scale(1.15)" : "scale(1)" }} />
//                                     {item.label}
//                                     {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/70" />}
//                                 </Link>
//                             );
//                         })()}

//                         {/* ── Department dropdown ── */}
//                         <div style={{ animation: `slideInLeft 0.35s ease 245ms both` }}>

//                             {/* Department toggle button */}
//                             <button
//                                 onClick={() => setDeptOpen(prev => !prev)}
//                                 className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
//                                     ${isDeptActive
//                                         ? 'bg-[#FFC107] text-white shadow-sm shadow-yellow-200'
//                                         : 'text-gray-600 hover:bg-gray-50'
//                                     }`}
//                             >
//                                 <Building2
//                                     className="w-5 h-5 flex-shrink-0 transition-transform duration-200"
//                                     style={{ transform: isDeptActive ? "scale(1.15)" : "scale(1)" }}
//                                 />
//                                 <span className="flex-1 text-left">Department</span>
//                                 <ChevronDown
//                                     className={`w-4 h-4 flex-shrink-0 transition-transform duration-300
//                                         ${deptOpen ? 'rotate-180' : 'rotate-0'}
//                                         ${isDeptActive ? 'text-white' : 'text-gray-400'}
//                                     `}
//                                 />
//                             </button>

//                             {/* Sub-items */}
//                             {deptOpen && (
//                                 <div
//                                     className="mt-1 ml-3 pl-3 border-l-2 border-[#FFC107]/30 space-y-0.5"
//                                     style={{ animation: "dropDown 0.2s ease both" }}
//                                 >
//                                     {departmentTeams.map((team) => {
//                                         const isTeamActive = location.pathname === team.path;
//                                         return (
//                                             <Link
//                                                 key={team.path}
//                                                 to={team.path}
//                                                 onClick={() => setIsOpen(false)}
//                                                 className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200
//                                                     ${isTeamActive
//                                                         ? 'bg-[#FFF8DC] text-[#C89B00]'
//                                                         : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700 hover:translate-x-1'
//                                                     }`}
//                                             >
//                                                 <team.icon className={`w-4 h-4 flex-shrink-0 ${isTeamActive ? 'text-[#F5C518]' : 'text-gray-400'}`} />
//                                                 {team.label}
//                                                 {isTeamActive && (
//                                                     <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#F5C518]" />
//                                                 )}
//                                             </Link>
//                                         );
//                                     })}
//                                 </div>
//                             )}
//                         </div>

//                         {/* Subscription */}
//                         {(() => {
//                             const item = navItems[3];
//                             const isActive = location.pathname === item.path;
//                             return (
//                                 <Link
//                                     key={item.path}
//                                     to={item.path}
//                                     onClick={() => setIsOpen(false)}
//                                     style={{ animation: `slideInLeft 0.35s ease 300ms both` }}
//                                     className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
//                                         ${isActive
//                                             ? 'bg-[#FFC107] text-white shadow-sm shadow-yellow-200'
//                                             : 'text-gray-600 hover:bg-gray-50 hover:translate-x-1'
//                                         }`}
//                                 >
//                                     <item.icon className="w-5 h-5 flex-shrink-0" style={{ transform: isActive ? "scale(1.15)" : "scale(1)" }} />
//                                     {item.label}
//                                     {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/70" />}
//                                 </Link>
//                             );
//                         })()}

//                     </nav>
//                 </aside>

//                 {/* Main */}
//                 <div className="flex-1 flex flex-col">

//                  <header className="relative z-50 h-16 bg-white border-b border-gray-100 flex items-center gap-2 sm:gap-3 px-4 md:px-6">

//     {/* Hamburger — mobile only */}
//     <button
//         onClick={() => setIsOpen(true)}
//         className="md:hidden p-2 rounded-lg hover:bg-gray-100 active:scale-90 transition-all flex-shrink-0"
//     >
//         <Menu className="w-5 h-5" />
//     </button>

//     {/* Search — grows but never steals space from right buttons */}
//     <div className="flex-1 min-w-0 flex-1 min-w-[120px] max-w-[220px] sm:max-w-[260px] md:max-w-sm lg:max-w-md">
//         <div className="relative">
//             <div className="flex items-center h-[42px] bg-[#f5f5f5] rounded-xl px-3 border border-transparent focus-within:border-[#F5C518] transition-all duration-300">
//                 <input
//                     type="text"
//                     value={search}
//                     onChange={(e) => { setSearch(e.target.value); setSearchError(""); }}
//                     onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
//                     placeholder="Search pages..."
//                     className="flex-1 bg-transparent outline-none px-2 text-sm min-w-0"
//                 />
//                 <button
//                     onClick={handleSearch}
//                     className="text-gray-500 hover:text-[#F5C518] transition flex-shrink-0"
//                 >
//                     <Search className="w-4 h-4" />
//                 </button>
//             </div>
//             {searchError && (
//                 <p className="absolute left-0 top-full mt-2 text-red-500 text-xs bg-white px-2 py-1 rounded-md shadow-md z-50">
//                     {searchError}
//                 </p>
//             )}
//         </div>
//     </div>

//     {/* Spacer pushes right side to the end */}
   

//     {/* RIGHT — always visible, never shrinks */}
//     {/* <div className="flex items-center gap-2 md:gap-3 flex-shrink-0"> */}
//     <div className="ml-auto flex items-center gap-2 md:gap-3 flex-shrink-0">
//         <button className="flex items-center gap-1.5 bg-[#FFC107] hover:bg-[#F5A623] text-white font-medium px-2.5 md:px-4 py-2 rounded-lg transition-all active:scale-95 shadow-sm text-sm flex-shrink-0">
//             <Plus className="w-4 h-4 flex-shrink-0" />
//             <span className="hidden md:inline">Create Ticket</span>
//         </button>

//         <button className="relative p-2 rounded-full hover:bg-gray-100 transition flex-shrink-0">
//             <Bell className="w-5 h-5 text-gray-600" />
//             <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
//         </button>

//         <div className="w-8 h-8 md:w-9 md:h-9 rounded-full overflow-hidden bg-gray-200 ring-2 ring-transparent hover:ring-yellow-300 transition-all flex-shrink-0">
//             <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=admin" alt="avatar" />
//         </div>
//     </div>
// </header>

//                     {/* <main
//                         key={location.pathname}
//                         className="flex-1 overflow-auto p-3 md:p-2 sm:m-10  bg-[#f1f1f1]"
//                         style={{ animation: "fadeUp 0.35s ease both" }}
//                     > */}
//                     <main
//   key={location.pathname}
//   className="flex-1 overflow-auto p-3 sm:p-4 md:p-5 bg-[#f1f1f1]"
//   style={{ animation: "fadeUp 0.35s ease both" }}
// >
//                         {children}
//                     </main>
//                 </div>
//             </div>
//         </>
//     );
// }

import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    Search, Bell, LayoutDashboard, Users, Plus,
    Building2, CreditCard, TrendingUp, Menu, X,
    ChevronDown, Headphones, Code2, Megaphone
} from 'lucide-react';
import Logo from "../assets/logo.png";
import { useNavigate } from "react-router-dom";

const animStyles = `
  @keyframes fadeIn {
    from { opacity: 0; } to { opacity: 1; }
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes slideInDown {
    from { opacity: 0; transform: translateY(-10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`;

const departmentTeams = [
    { label: 'Sales Team',     icon: TrendingUp, path: '/department/sales'     },
    { label: 'Support Team',   icon: Headphones, path: '/department/support'   },
    { label: 'Technical Team', icon: Code2,      path: '/department/technical' },
    { label: 'Marketing Team', icon: Megaphone,  path: '/department/marketing' },
];

const navItems = [
    { label: 'Dashboard',    icon: LayoutDashboard, path: '/dashboard'},
    { label: 'Lead & Sales', icon: TrendingUp,      path: '/lead-sales'   },
    { label: 'Customer',     icon: Users,           path: '/customer'     },
    { label: 'Subscription', icon: CreditCard,      path: '/subscription' },
    { label: 'Team Members', icon: CreditCard,      path: '/team-members' },

];

export default function Layout({ children }) {
    const navigate  = useNavigate();
    const location  = useLocation();

    const [search,      setSearch]      = useState("");
    const [searchError, setSearchError] = useState("");
    const [isOpen,      setIsOpen]      = useState(false);
    const [deptOpen,    setDeptOpen]    = useState(false);
    const [isMobile,    setIsMobile]    = useState(false);

    const sidebarRef = useRef();

    const isDeptActive = departmentTeams.some(t => location.pathname === t.path)
        || location.pathname === '/department';

    // Track mobile breakpoint
    useEffect(() => {
        const check = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            setIsOpen(!mobile);          // open on desktop, closed on mobile
        };
        check();
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);

    // Auto-expand dept when a dept route is active
    useEffect(() => {
        if (isDeptActive) setDeptOpen(true);
    }, [location.pathname]);

    // Close sidebar on outside click (mobile only)
    useEffect(() => {
        const handler = (e) => {
            if (
                isMobile &&
                sidebarRef.current &&
                !sidebarRef.current.contains(e.target)
            ) setIsOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [isMobile]);

    const allSearchItems = [
        ...navItems,
        { label: 'Department', icon: Building2, path: '/department' },
        ...departmentTeams,
    ];

    const handleSearch = () => {
        const found = allSearchItems.find(item =>
            item.label.toLowerCase().includes(search.toLowerCase())
        );
        if (found) {
            navigate(found.path);
            setSearchError("");
            setSearch("");
        } else {
            setSearchError("No pages found");
        }
    };

    const handleNavClick = () => {
        if (isMobile) setIsOpen(false);
    };

    return (
        <>
            <style>{animStyles}</style>

            {/* <div className="flex h-screen bg-[#f5f5f5] overflow-hidden"> */}
            <div className="flex h-screen bg-[#f5f5f5] overflow-hidden relative">

                {/* Mobile overlay — only rendered on mobile when open */}
                {isMobile && isOpen && (
                    <div
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 bg-black/30 z-40"
                        style={{ animation: "fadeIn 0.2s ease both" }}
                    />
                )}

                {/* ── Sidebar ── */}
                {/* ── Sidebar ── */}
<aside
    ref={sidebarRef}
    className={`
        fixed md:static z-[70] top-0 left-0
        h-full w-[230px] bg-white flex flex-col
        border-r border-gray-200 shadow-sm
        transform transition-transform duration-300
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0
    `}
>
    {/* Logo — border-b removed, logo size increased */}
    <div
        className="h-[76px] flex items-center justify-between px-5 flex-shrink-0"
        style={{ animation: "slideInDown 0.4s ease both" }}
    >
        <img
            src={Logo}
            alt="logo"
            className="h-12 max-w-[160px] w-auto object-contain cursor-pointer"
        />
        <button
            onClick={() => setIsOpen(false)}
            className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors flex-shrink-0"
        >
            <X className="w-4 h-4 text-gray-700" />
        </button>
    </div>

                    {/* Nav */}
                   {/* Nav */}
<nav className="flex-1 flex flex-col py-3 overflow-y-auto">

    {navItems.map((item) => {
        const isActive = location.pathname === item.path;

        return (
            <Link
                key={item.path}
                to={item.path}
                onClick={handleNavClick}
                className={`relative flex items-center gap-3 h-[50px] px-6 text-[14.5px] tracking-[0.2px] transition-colors duration-150
                    ${isActive
                        ? 'bg-[#F5C518] text-black font-semibold'
                        : 'text-gray-500 hover:bg-[#fdf7e0] hover:text-gray-800'
                    }`}
            >
                {isActive && (
                    <span className="absolute left-0 top-0 h-full w-1 bg-yellow-600 rounded-r" />
                )}

                <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                {item.label}
            </Link>
        );
    })}

    {/* Department dropdown */}
    <div>
        <button
            onClick={() => setDeptOpen(p => !p)}
            className={`relative w-full flex items-center gap-3 h-[50px] px-6 text-[14.5px] tracking-[0.2px] transition-colors duration-150
                ${isDeptActive
                    ? 'bg-[#F5C518] text-black font-semibold'
                    : 'text-gray-500 hover:bg-[#fdf7e0] hover:text-gray-800'
                }`}
        >
            {isDeptActive && (
                <span className="absolute left-0 top-0 h-full w-1 bg-yellow-600 rounded-r" />
            )}

            <Building2 className="w-[18px] h-[18px] flex-shrink-0" />

            <span className="flex-1 text-left">
                Department
            </span>

            <ChevronDown
                className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${
                    deptOpen ? 'rotate-180' : ''
                }`}
            />
        </button>

        {deptOpen && (
            <div className="bg-[#fafafa]">
                {departmentTeams.map((team) => {
                    const isTeamActive = location.pathname === team.path;

                    return (
                        <Link
                            key={team.path}
                            to={team.path}
                            onClick={handleNavClick}
                            className={`flex items-center gap-2.5 h-[44px] pl-10 pr-6 text-[13px] tracking-[0.2px] transition-colors duration-150
                                ${isTeamActive
                                    ? 'bg-[#FFF9E0] text-[#C89B00] font-semibold'
                                    : 'text-gray-500 hover:bg-[#fdf7e0] hover:text-gray-700'
                                }`}
                        >
                            <team.icon className="w-[14px] h-[14px] flex-shrink-0" />
                            {team.label}
                        </Link>
                    );
                })}
            </div>
        )}
    </div>

</nav>
                </aside>

                {/* ── Main ── */}
                <div className="flex-1 flex flex-col min-w-0">

                    {/* Header — z-[60] so it always sits above sidebar on mobile */}
                    <header className="sticky top-0 z-[60] h-[76px] bg-white border-b border-gray-200 px-4 md:px-6 flex items-center justify-between gap-3 shadow-sm flex-shrink-0">

                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            {/* Hamburger — mobile only */}
                            <button
                                onClick={() => setIsOpen(true)}
                                className="md:hidden w-10 h-10 rounded-lg bg-[#f5f5f5] flex items-center justify-center flex-shrink-0"
                                aria-label="Open menu"
                            >
                                <Menu className="w-5 h-5 text-gray-700" />
                            </button>

                            {/* Search */}
                            <div className="flex-1 min-w-0 max-w-[500px]">
                                <div className="relative">
                                    <div className="flex items-center h-[42px] bg-[#f5f5f5] rounded-xl px-4 border border-transparent focus-within:border-[#F5C518] transition-colors duration-200">
                                        <input
                                            type="text"
                                            value={search}
                                            onChange={(e) => { setSearch(e.target.value); setSearchError(""); }}
                                            onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
                                            placeholder="Search pages..."
                                            className="flex-1 bg-transparent outline-none text-sm min-w-0"
                                        />
                                        <button
                                            onClick={handleSearch}
                                            className="text-gray-400 hover:text-[#F5C518] transition-colors flex-shrink-0 ml-2"
                                        >
                                            <Search className="w-4 h-4" />
                                        </button>
                                    </div>
                                    {searchError && (
                                        <p className="absolute left-0 top-full mt-1 text-red-500 text-xs bg-white px-2 py-1 rounded-md shadow z-50 whitespace-nowrap">
                                            {searchError}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right actions */}
                        <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">

                            <button className="flex items-center gap-2 h-[40px] px-3 md:px-5 rounded-xl bg-[#F5C518] hover:bg-yellow-500 active:scale-95 transition-all duration-150 font-semibold text-sm flex-shrink-0">
                                <Plus className="w-4 h-4 flex-shrink-0" />
                                <span className="hidden sm:inline">Create Ticket</span>
                            </button>

                            <button className="relative w-10 h-10 rounded-xl bg-[#f5f5f5] flex items-center justify-center hover:bg-gray-200 transition-colors flex-shrink-0">
                                <Bell className="w-5 h-5 text-gray-700" />
                                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white" />
                            </button>

                            <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-transparent hover:ring-[#F5C518] transition-all duration-200 cursor-pointer flex-shrink-0">
                                <img src="https://i.pravatar.cc/100" alt="profile" className="w-full h-full object-cover" />
                            </div>

                        </div>
                    </header>

                    {/* Page content */}
                    <main
                        key={location.pathname}
                        className="flex-1 overflow-auto p-3 md:p-4 lg:p-5 bg-[#f5f5f5] relative"
                        style={{ animation: "fadeUp 0.35s ease both" }}
                    >
                        {children}
                    </main>

                </div>
            </div>
        </>
    );
}
