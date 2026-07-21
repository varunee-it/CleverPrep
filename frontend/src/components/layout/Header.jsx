import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Bell, Menu, Search, Clock } from "lucide-react";
import ConfirmationModal from "../common/ConfirmationModal";
import useStudySession from "../../hooks/useStudySession";

const Header = ({ toggleMobileMenu, toggleDesktopSidebar, isSidebarCollapsed }) => {
  const { user, logout } = useAuth();
  const { setIsOverlayOpen } = useStudySession();
  const [isOpen, setIsOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const location = useLocation();

  const isFocusPage = location.pathname.startsWith("/focus");

  const [timeStr, setTimeStr] = useState("");
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setTimeStr(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const getInitials = () => {
    if (!user?.username) return "CP";
    const parts = user.username.split(/[._\s]+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return user.username.slice(0, 2).toUpperCase();
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    const handleClickOutside = (e) => {
      if (!e.target.closest("#profile-dropdown-container")) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isOpen]);

  const handleLogoutConfirm = () => {
    setShowLogoutModal(false);
    logout();
  };

  const avatarSrc = user?.profileImage || user?.avatar;

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 h-14 transition-all duration-300 border-b select-none ${
      isFocusPage
        ? "bg-[#090E18]/85 backdrop-blur-xl border-slate-900 text-white"
        : "bg-white/80 backdrop-blur-xl border-slate-200/60 text-slate-900"
    }`}>
      {/* Container aligned inside max 1400px width with 32-48px outer padding */}
      <div className="flex items-center justify-between h-full w-full max-w-[1400px] mx-auto px-8 md:px-12">
        
        {/* Left Side: Logo/Hamburger */}
        <div className="flex items-center gap-3 md:gap-4 md:w-[220px] shrink-0">
          <button
            onClick={toggleMobileMenu}
            className={`md:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 cursor-pointer ${
              isFocusPage
                ? "text-slate-300 hover:text-[#10D28F] hover:bg-slate-900"
                : "text-slate-650 hover:text-emerald-600 hover:bg-emerald-50"
            }`}
            aria-label="Toggle mobile menu"
          >
            <Menu size={24} />
          </button>

          <button
            onClick={toggleDesktopSidebar}
            className={`hidden md:inline-flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 cursor-pointer ${
              isFocusPage
                ? "text-slate-300 hover:text-[#10D28F] hover:bg-slate-900"
                : "text-slate-650 hover:text-emerald-600 hover:bg-emerald-50"
            }`}
            aria-label="Toggle desktop sidebar"
          >
            <Menu size={24} />
          </button>
          
          <div className="flex items-center gap-2 select-none">
            <div className={`flex items-center justify-center w-8 h-8 rounded-lg shadow-md ${
              isFocusPage ? "bg-gradient-to-br from-emerald-500 to-teal-600" : "bg-emerald-500"
            }`}>
              <span className="text-white font-bold text-lg leading-none">C</span>
            </div>
            <h1 className="text-lg font-bold tracking-tight hidden sm:block">
              CleverPrep
            </h1>
          </div>
        </div>

        {/* Center: Search Bar clamped between 520px and 680px */}
        <div className="hidden md:flex flex-1 justify-center px-6 tour-search-bar shrink-0">
          <div className="w-[clamp(520px,40vw,680px)] relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search size={18} className="text-slate-400 group-hover:text-emerald-500 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search documents, quizzes, flashcards..."
              className={`w-full text-sm rounded-full pl-10 pr-4 py-2.5 outline-none border transition-all duration-300 ${
                isFocusPage
                  ? "bg-slate-950/40 hover:bg-slate-900/60 focus:bg-slate-900 text-white border-slate-850 placeholder:text-slate-600 focus:border-[#10D28F]/50"
                  : "bg-slate-100 hover:bg-slate-200/80 focus:bg-white text-slate-905 border-transparent placeholder:text-slate-500 focus:border-emerald-500/50"
              }`}
              readOnly
            />
          </div>
        </div>

        {/* Right Side: Profile, Clock & Notifications (Grouped elegantly) */}
        <div className="flex items-center gap-3 ml-auto md:w-[260px] justify-end shrink-0 select-none">
          
          {/* Mobile Search Icon */}
          <button className={`md:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 ${
            isFocusPage ? "text-slate-300 hover:bg-slate-900" : "text-slate-650 hover:bg-emerald-50"
          }`}>
            <Search size={20} />
          </button>

          {/* Real-time Clock widget */}
          <div className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-extrabold tracking-tight shrink-0 border font-mono ${
            isFocusPage
              ? "bg-slate-900/50 text-slate-300 border-slate-800"
              : "bg-slate-100 text-slate-600 border-slate-200/40"
          }`}>
            <span>⏰</span>
            <span>{timeStr}</span>
          </div>

          {/* Focus Mode Launcher Button */}
          <button 
            onClick={() => setIsOverlayOpen(true)}
            className={`inline-flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 group cursor-pointer ${
              isFocusPage
                ? "text-[#10D28F] hover:bg-slate-900"
                : "text-slate-650 hover:bg-emerald-50"
            }`}
            title="Open Focus Session"
          >
            <Clock size={20} strokeWidth={2} className="group-hover:scale-110 transition-transform duration-200" />
          </button>

          {/* Notification Button */}
          <button className={`relative inline-flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 group cursor-pointer ${
            isFocusPage ? "text-slate-300 hover:bg-slate-900" : "text-slate-650 hover:bg-emerald-50"
          }`}>
            <Bell size={20} strokeWidth={2} className="group-hover:scale-110 transition-transform duration-200" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-550 rounded-full ring-2 ring-white"></span>
          </button>

          {/* User Profile Container (Avatar + Username grouped cleanly with ellipsis, no edge touching) */}
          <div className="flex items-center pl-2 sm:pl-3 border-l border-slate-200/40 relative shrink-0" id="profile-dropdown-container">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border transition-all duration-200 cursor-pointer group focus:outline-none ${
                isFocusPage
                  ? "bg-slate-900/60 border-slate-800 hover:bg-slate-850 hover:border-slate-700 text-white"
                  : "bg-slate-50/50 border-slate-200/50 hover:bg-slate-50 hover:border-slate-305 text-slate-750"
              }`}
              aria-expanded={isOpen}
              aria-haspopup="true"
            >
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt={user?.username}
                  className="w-7 h-7 rounded-full object-cover shadow-xs border border-slate-100/50 shrink-0"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-[10px] font-black uppercase shadow-xs shrink-0">
                  {getInitials()}
                </div>
              )}

              <span className="hidden sm:inline-block text-xs font-bold truncate max-w-[80px] md:max-w-[100px] transition-colors">
                {user?.username || "Guest"}
              </span>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
              <div className={`absolute right-0 top-full mt-2.5 w-68 border rounded-[18px] shadow-2xl p-4 z-55 animate-in fade-in slide-in-from-top-1 duration-200 origin-top-right ${
                isFocusPage ? "bg-slate-950 border-slate-850 text-white" : "bg-white border-slate-200/60 text-slate-900"
              }`}>
                
                {/* User Card info inside dropdown */}
                <div className="flex flex-col items-center text-center p-2 mb-2">
                  {avatarSrc ? (
                    <img
                      src={avatarSrc}
                      alt={user?.username}
                      className="w-14 h-14 rounded-full object-cover mb-2.5 shadow-md border-2 border-white"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-lg font-black uppercase mb-2.5 shadow-md shadow-emerald-500/10">
                      {getInitials()}
                    </div>
                  )}

                  <h3 className="text-sm font-bold leading-tight">
                    {user?.username || "User"}
                  </h3>

                  <div className="mt-1">
                    <span className="inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50/10 text-emerald-500 border border-emerald-500/20">
                      Verified Student ✓
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 font-semibold mt-1.5 break-all max-w-full">
                    {user?.email}
                  </p>
                </div>

                <div className={`border-t my-2 ${isFocusPage ? "border-slate-850" : "border-slate-100"}`} />

                {/* Dropdown Menu items */}
                <div className="space-y-0.5">
                  <Link
                    to="/profile"
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 group/item cursor-pointer ${
                      isFocusPage ? "text-slate-300 hover:text-[#10D28F] hover:bg-slate-900" : "text-slate-700 hover:text-emerald-700 hover:bg-emerald-50/70"
                    }`}
                  >
                    <span>✏️</span>
                    <span>My Profile</span>
                  </Link>

                  <Link
                    to="/profile"
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 group/item cursor-pointer ${
                      isFocusPage ? "text-slate-300 hover:text-[#10D28F] hover:bg-slate-900" : "text-slate-700 hover:text-emerald-700 hover:bg-emerald-50/70"
                    }`}
                  >
                    <span>⚙️</span>
                    <span>Settings</span>
                  </Link>
                </div>

                <div className={`border-t my-2 ${isFocusPage ? "border-slate-850" : "border-slate-100"}`} />

                <button
                  onClick={() => {
                    setIsOpen(false);
                    setShowLogoutModal(true);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold text-rose-500 hover:bg-rose-50/10 transition-all duration-200 group/item cursor-pointer text-left focus:outline-none"
                >
                  <span>🚪</span>
                  <span>Logout</span>
                </button>

              </div>
            )}
          </div>

        </div>

      </div>

      <ConfirmationModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogoutConfirm}
        title="Log out of CleverPrep?"
        message="Your study materials, flashcards, quizzes, and progress will remain safely stored in your account."
        confirmText="Log Out"
        variant="danger"
      />
    </header>
  );
};

export default Header;