import React, { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard,
  FileText,
  User,
  LogOut,
  BrainCircuit,
  BookOpen,
  X,
  AlertCircle
} from "lucide-react";

const Sidebar = ({
  isMobileMenuOpen,
  toggleMobileMenu,
  isSidebarCollapsed,
}) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const isFocusPage = location.pathname.startsWith("/focus");

  const confirmLogout = () => {
    logout();
    navigate("/login");
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isLogoutModalOpen) {
        setIsLogoutModalOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isLogoutModalOpen]);

  const [globalTheme, setGlobalTheme] = useState(() => localStorage.getItem("cleverprep_global_theme") || "white");

  useEffect(() => {
    const handleThemeChange = () => {
      setGlobalTheme(localStorage.getItem("cleverprep_global_theme") || "white");
    };
    window.addEventListener("cleverprep-global-theme-changed", handleThemeChange);
    return () => window.removeEventListener("cleverprep-global-theme-changed", handleThemeChange);
  }, []);

  const navLinks = [
    { to: "/dashboard", icon: LayoutDashboard, text: "Home" },
    { to: "/documents", icon: FileText, text: "Library" },
    { to: "/flashcards", icon: BookOpen, text: "Flashcards" },
    { to: "/profile", icon: User, text: "Profile" },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300 ${
          isMobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={toggleMobileMenu}
        aria-hidden="true"
      ></div>

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 h-full border-r z-50 transition-all duration-300 ease-in-out flex flex-col tour-sidebar
          ${
            globalTheme === "black" ? "bg-[#090E18] border-slate-900 text-white" :
            globalTheme === "beige" ? "bg-[#FFFDF9] border-[#EADFC9] text-[#433422]" :
            globalTheme === "lavender" ? "bg-white border-[#E5DEFF] text-[#3B2D54]" :
            "bg-white border-slate-200/60 text-slate-900"
          }
          ${isMobileMenuOpen ? "translate-x-0 w-64" : "-translate-x-full w-64"}
          md:translate-x-0 md:relative md:z-0
          ${isSidebarCollapsed ? "md:w-[72px]" : "md:w-[260px]"}
        `}
      >
        {/* Mobile Header inside Sidebar */}
        <div className={`flex md:hidden items-center justify-between h-14 px-4 border-b ${
          globalTheme === "black" ? "border-slate-850" :
          globalTheme === "beige" ? "border-[#EADFC9]" :
          globalTheme === "lavender" ? "border-[#E5DEFF]" :
          "border-slate-200/60"
        }`}>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-7 h-7 rounded-md bg-emerald-500">
              <span className="text-white font-bold text-base leading-none">C</span>
            </div>
            <h1 className="text-base font-bold tracking-tight">
              CleverPrep
            </h1>
          </div>
          <button
            onClick={toggleMobileMenu}
            className="text-slate-550 hover:text-slate-205 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto py-6 px-3 space-y-2">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => {
                if (window.innerWidth < 768 && isMobileMenuOpen) {
                  toggleMobileMenu();
                }
              }}
              className={({ isActive }) =>
                `group flex items-center ${isSidebarCollapsed ? 'justify-center md:px-0' : 'px-4.5'} py-3.5 text-sm font-medium rounded-xl transition-all duration-200 relative ${
                  isActive
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-text-muted hover:bg-bg-surface-hover hover:text-text-primary border border-transparent hover:translate-x-0.5"
                } ${
                  link.to === "/documents" ? "tour-sidebar-library" : link.to === "/profile" ? "tour-sidebar-profile" : ""
                }`
              }
              title={isSidebarCollapsed ? link.text : ""}
            >
              {({ isActive }) => (
                <>
                  <link.icon
                    size={21}
                    strokeWidth={isActive ? 2.25 : 1.75}
                    className={`shrink-0 transition-transform duration-200 ${
                      isActive 
                        ? "text-primary scale-105"
                        : "text-text-muted group-hover:text-text-primary group-hover:scale-105"
                    }`}
                  />
                  <span
                    className={`ml-3.5 whitespace-nowrap font-medium transition-all duration-200 ${
                      isSidebarCollapsed ? "md:hidden md:opacity-0 md:w-0" : "opacity-100"
                    }`}
                  >
                    {link.text}
                  </span>
                  {isActive && !isSidebarCollapsed && (
                    <span className="absolute right-3 w-1.5 h-1.5 rounded-full animate-pulse bg-primary" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>

        {/* Bottom Section (Logout) */}
        <div className={`p-3 border-t ${
          globalTheme === "black" ? "border-slate-900" :
          globalTheme === "beige" ? "border-[#EADFC9]" :
          globalTheme === "lavender" ? "border-[#E5DEFF]" :
          "border-slate-100"
        }`}>
          <button
            onClick={() => setIsLogoutModalOpen(true)}
            className={`group flex items-center ${isSidebarCollapsed ? 'justify-center md:px-0' : 'px-4.5'} py-3.5 w-full text-sm font-medium rounded-xl transition-all duration-200 border border-transparent cursor-pointer ${
              globalTheme === "black"
                ? "text-slate-400 hover:bg-slate-900/40 hover:text-white"
                : globalTheme === "beige"
                  ? "text-[#7A6C58] hover:bg-[#FAF6EE] hover:text-[#433422]"
                  : globalTheme === "lavender"
                    ? "text-[#6A5A8C] hover:bg-[#FAF9FF] hover:text-[#2E1F47]"
                    : "text-slate-650 hover:bg-red-50 hover:text-red-600 hover:border-red-100/50 hover:translate-x-0.5"
            }`}
            title={isSidebarCollapsed ? "Logout" : ""}
          >
            <LogOut
              size={21}
              strokeWidth={1.75}
              className={`shrink-0 transition-transform duration-200 ${
                globalTheme === "black" ? "text-slate-500 group-hover:text-white" :
                globalTheme === "beige" ? "text-[#9B8C77] group-hover:text-[#433422]" :
                globalTheme === "lavender" ? "text-[#9585BA] group-hover:text-[#2E1F47]" :
                "group-hover:text-red-600 group-hover:scale-105"
              }`}
            />
            <span
              className={`ml-3.5 whitespace-nowrap font-medium transition-all duration-200 ${
                isSidebarCollapsed ? "md:hidden md:opacity-0 md:w-0" : "opacity-100"
              }`}
            >
              Logout
            </span>
          </button>
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      {isLogoutModalOpen && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
          onClick={() => setIsLogoutModalOpen(false)}
        >
          <div 
            className="rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200 border bg-bg-surface border-border text-text-primary"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-modal-title"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-5 shadow-sm border border-red-100">
                <AlertCircle className="w-8 h-8 text-red-500" strokeWidth={2} />
              </div>
              <h3 id="logout-modal-title" className="text-xl font-bold mb-3">
                Log out of CleverPrep?
              </h3>
              <p className="text-sm leading-relaxed mb-8 text-text-secondary">
                Your study materials, flashcards, quizzes, and progress will remain safely stored in your account.
                <br /><br />
                Logging out will not delete any of your data. Simply sign in again to continue learning from where you left off.
              </p>
              
              <div className="flex flex-col sm:flex-row w-full gap-3">
                <button
                  onClick={() => setIsLogoutModalOpen(false)}
                  className="flex-1 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors focus:outline-none focus:ring-2 bg-bg-base border border-border text-text-secondary hover:bg-bg-surface-hover focus:ring-border-hover"
                  autoFocus
                >
                  Cancel
                </button>
                <button
                  onClick={confirmLogout}
                  className="flex-1 px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 rounded-xl text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                >
                  Log Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;