import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Bell, Menu, Search, Clock } from "lucide-react";
import ConfirmationModal from "../common/ConfirmationModal";
import useStudySession from "../../hooks/useStudySession";
import { getUserDisplayName, getUserInitials } from "../../utils/userUtils";

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
    return getUserInitials(user);
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

  const [globalTheme, setGlobalTheme] = useState(() => localStorage.getItem("cleverprep_global_theme") || "white");

  useEffect(() => {
    const handleThemeChange = () => {
      setGlobalTheme(localStorage.getItem("cleverprep_global_theme") || "white");
    };
    window.addEventListener("cleverprep-global-theme-changed", handleThemeChange);
    return () => window.removeEventListener("cleverprep-global-theme-changed", handleThemeChange);
  }, []);

  const changeGlobalTheme = (newTheme) => {
    setGlobalTheme(newTheme);
    localStorage.setItem("cleverprep_global_theme", newTheme);
    window.dispatchEvent(new Event("cleverprep-global-theme-changed"));
  };

  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [user]);

  const getAvatarUrl = () => {
    const rawSrc = user?.profileImage || user?.avatar;
    if (!rawSrc) return null;
    if (rawSrc.startsWith("http://") || rawSrc.startsWith("https://")) {
      return rawSrc;
    }
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5050";
    const cleanPath = rawSrc.startsWith("/") ? rawSrc : `/${rawSrc}`;
    return `${baseUrl}${cleanPath}`;
  };

  const avatarSrc = !imgError ? getAvatarUrl() : null;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 transition-all duration-300 border-b select-none bg-bg-surface/85 backdrop-blur-xl border-border text-text-primary">
      {/* Container aligned inside max 1400px width with 32-48px outer padding */}
      <div className="flex items-center justify-between h-full w-full max-w-[1400px] mx-auto px-8 md:px-12">
        
        {/* Left Side: Logo/Hamburger */}
        <div className="flex items-center gap-3 md:gap-4 md:w-[220px] shrink-0">
          <button
            onClick={toggleMobileMenu}
            className="md:hidden inline-flex items-center justify-center w-10.5 h-10.5 rounded-xl transition-all duration-200 cursor-pointer text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover"
            aria-label="Toggle mobile menu"
          >
            <Menu size={24} />
          </button>

          <button
            onClick={toggleDesktopSidebar}
            className="hidden md:inline-flex items-center justify-center w-10.5 h-10.5 rounded-xl transition-all duration-200 cursor-pointer text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover"
            aria-label="Toggle desktop sidebar"
          >
            <Menu size={24} />
          </button>
          
          <div className="flex items-center gap-2 select-none">
            <div className="flex items-center justify-center w-8.5 h-8.5 rounded-lg shadow-md bg-primary">
              <span className="text-primary-text font-bold text-lg leading-none">C</span>
            </div>
            <h1 className="text-lg font-bold tracking-tight hidden sm:block">
              CleverPrep
            </h1>
          </div>
        </div>

        {/* Center: Search Bar clamped between 320px and 460px */}
        <div className="hidden lg:flex flex-1 justify-center px-6 tour-search-bar shrink-0">
          <div 
            className="relative group"
            style={{ width: "clamp(320px, 32vw, 460px)" }}
          >
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search size={19} className="text-text-muted group-hover:text-primary transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search documents, quizzes, flashcards..."
              className="w-full text-sm rounded-full pl-11 pr-4 py-3 outline-none border transition-all duration-300 bg-bg-base hover:bg-bg-surface-hover focus:bg-bg-surface text-text-primary border-border placeholder:text-text-muted focus:border-primary/50"
              readOnly
            />
          </div>
        </div>

        {/* Right Side: Profile, Clock, Theme Picker & Notifications */}
        <div className="flex items-center gap-4.5 ml-auto justify-end shrink-0 select-none">
          
          {/* Global Theme Picker Segmented Bar */}
          <div className="hidden sm:flex items-center gap-1.5 p-1 rounded-xl border shrink-0 bg-bg-base border-border">
            {[
              { id: "white", label: "White", icon: "☀️" },
              { id: "black", label: "Black", icon: "🌙" },
              { id: "beige", label: "Beige", icon: "🪵" },
              { id: "lavender", label: "Lavender", icon: "🪻" }
            ].map((themeOpt) => (
              <button
                key={themeOpt.id}
                onClick={() => changeGlobalTheme(themeOpt.id)}
                className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  globalTheme === themeOpt.id
                    ? "bg-primary text-primary-text"
                    : "text-text-muted hover:text-text-primary"
                }`}
                title={`Switch to ${themeOpt.label} theme`}
              >
                <span>{themeOpt.icon}</span>
              </button>
            ))}
          </div>

          {/* Real-time Clock widget */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-extrabold tracking-tight shrink-0 border font-mono bg-bg-surface/50 text-text-secondary border-border">
            <span>⏰</span>
            <span>{timeStr}</span>
          </div>

          {/* Focus Mode Launcher Button */}
          <button 
            onClick={() => setIsOverlayOpen(true)}
            className="p-1.5 bg-bg-surface border border-border hover:border-border-hover text-text-secondary hover:text-text-primary rounded-xl transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary/50 relative shrink-0"
            title="Focus Workspace"
          >
            <Clock size={16} />
          </button>

          <button
            className="p-1.5 bg-bg-surface border border-border hover:border-border-hover text-text-secondary hover:text-text-primary rounded-xl transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary/50 relative shrink-0"
            title="Notifications"
          >
            <Bell size={16} />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" />
          </button>

          {/* User Profile Container (Avatar + Username grouped cleanly with ellipsis, no edge touching) */}
          <div className="flex items-center pl-2 sm:pl-3 border-l relative shrink-0 border-border" id="profile-dropdown-container">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-200 cursor-pointer group focus:outline-none bg-bg-surface border-border hover:border-border-hover text-text-primary"
              aria-expanded={isOpen}
              aria-haspopup="true"
            >
               {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt={getUserDisplayName(user)}
                  className="w-8 h-8 rounded-full object-cover shadow-xs border border-border shrink-0"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-[10px] font-black uppercase shadow-xs shrink-0">
                  {getInitials()}
                </div>
              )}

              <span className="hidden sm:inline-block text-xs font-bold truncate max-w-[80px] md:max-w-[100px] transition-colors">
                {getUserDisplayName(user)}
              </span>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
              <div className="absolute right-0 top-full mt-2.5 w-68 border rounded-[18px] shadow-2xl p-4 z-55 animate-in fade-in slide-in-from-top-1 duration-200 origin-top-right bg-bg-surface border-border text-text-primary">
                
                {/* User Card info inside dropdown */}
                <div className="flex flex-col items-center text-center p-2 mb-2">
                  {avatarSrc ? (
                    <img
                      src={avatarSrc}
                      alt={getUserDisplayName(user)}
                      className="w-14 h-14 rounded-full object-cover mb-2.5 shadow-md border-2 border-border"
                      onError={() => setImgError(true)}
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-lg font-black uppercase mb-2.5 shadow-md shadow-emerald-500/10">
                      {getInitials()}
                    </div>
                  )}

                  <h3 className="text-sm font-bold leading-tight">
                    {getUserDisplayName(user)}
                  </h3>

                  <div className="mt-1">
                    <span className="inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50/10 text-emerald-500 border border-emerald-500/20">
                      Verified Student ✓
                    </span>
                  </div>

                  <p className="text-[11px] text-text-secondary font-semibold mt-1.5 break-all max-w-full">
                    {user?.email}
                  </p>
                </div>

                <div className="border-t my-2 border-border" />

                {/* Dropdown Menu items */}
                <div className="space-y-0.5">
                  <Link
                    to="/profile"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 group/item cursor-pointer text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover"
                  >
                    <span>✏️</span>
                    <span>My Profile</span>
                  </Link>
                </div>

                <div className="border-t my-2 border-border" />

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