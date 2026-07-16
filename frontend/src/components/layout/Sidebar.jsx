import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
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
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

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
        className={`fixed top-0 left-0 h-full bg-white border-r border-slate-200/60 z-50 transition-all duration-300 ease-in-out flex flex-col tour-sidebar
          ${/* Mobile: Slide out drawer */ ""}
          ${isMobileMenuOpen ? "translate-x-0 w-64" : "-translate-x-full w-64"}
          ${/* Desktop: Fixed positioning below header */ ""}
          md:translate-x-0 md:relative md:z-0
          ${isSidebarCollapsed ? "md:w-16" : "md:w-56"}
        `}
      >
        {/* Mobile Header inside Sidebar (Hidden on Desktop since Header handles it) */}
        <div className="flex md:hidden items-center justify-between h-14 px-4 border-b border-slate-200/60">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-7 h-7 rounded-md bg-emerald-500">
              <span className="text-white font-bold text-base leading-none">C</span>
            </div>
            <h1 className="text-base font-bold text-slate-900 tracking-tight">
              CleverPrep
            </h1>
          </div>
          <button
            onClick={toggleMobileMenu}
            className="text-slate-500 hover:text-slate-800 transition-colors"
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
                // Auto-close on mobile when a link is clicked
                if (window.innerWidth < 768 && isMobileMenuOpen) {
                  toggleMobileMenu();
                }
              }}
              className={({ isActive }) =>
                `group flex items-center ${isSidebarCollapsed ? 'justify-center md:px-0' : 'px-4'} py-3 text-sm font-medium rounded-xl transition-all duration-200 relative ${
                  isActive
                    ? "bg-emerald-50 text-emerald-600 shadow-sm border border-emerald-100/50"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent hover:translate-x-0.5"
                } ${
                  link.to === "/documents" ? "tour-sidebar-library" : link.to === "/profile" ? "tour-sidebar-profile" : ""
                }`
              }
              title={isSidebarCollapsed ? link.text : ""}
            >
              {({ isActive }) => (
                <>
                  <link.icon
                    size={20}
                    strokeWidth={isActive ? 2.25 : 1.75}
                    className={`shrink-0 transition-transform duration-200 ${
                      isActive ? "text-emerald-600 scale-105" : "text-slate-400 group-hover:text-slate-600 group-hover:scale-105"
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
                    <span className="absolute right-3 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>

        {/* Bottom Section (Logout) */}
        <div className="p-3 border-t border-slate-100">
          <button
            onClick={() => setIsLogoutModalOpen(true)}
            className={`group flex items-center ${isSidebarCollapsed ? 'justify-center md:px-0' : 'px-4'} py-3 w-full text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-100/50 rounded-xl transition-all duration-200 border border-transparent hover:translate-x-0.5`}
            title={isSidebarCollapsed ? "Logout" : ""}
          >
            <LogOut
              size={20}
              strokeWidth={1.75}
              className="shrink-0 transition-transform duration-200 group-hover:text-red-600 group-hover:scale-105"
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
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-modal-title"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-5 shadow-sm border border-red-100">
                <AlertCircle className="w-8 h-8 text-red-500" strokeWidth={2} />
              </div>
              <h3 id="logout-modal-title" className="text-xl font-bold text-slate-900 mb-3">
                Log out of CleverPrep?
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-8">
                Your study materials, flashcards, quizzes, and progress will remain safely stored in your account.
                <br /><br />
                Logging out will not delete any of your data. Simply sign in again to continue learning from where you left off.
              </p>
              
              <div className="flex flex-col sm:flex-row w-full gap-3">
                <button
                  onClick={() => setIsLogoutModalOpen(false)}
                  className="flex-1 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-200"
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