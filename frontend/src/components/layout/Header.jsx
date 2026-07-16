import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Bell, Menu, Search } from "lucide-react";
import ConfirmationModal from "../common/ConfirmationModal";

const Header = ({ toggleMobileMenu, toggleDesktopSidebar, isSidebarCollapsed }) => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Computes user initials (e.g. "VA" from "varunee")
  const getInitials = () => {
    if (!user?.username) return "CP";
    const parts = user.username.split(/[._\s]+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return user.username.slice(0, 2).toUpperCase();
  };

  // Close dropdown on click outside or Escape key press
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
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 transition-all duration-300">
      <div className="flex items-center justify-between h-full px-4 md:px-6 w-full">
        
        {/* Left Side: Logo/Hamburger */}
        <div className="flex items-center gap-3 md:gap-4 md:w-[220px]">
          {/* Mobile Hamburger */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden inline-flex items-center justify-center w-10 h-10 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all duration-200"
            aria-label="Toggle mobile menu"
          >
            <Menu size={24} />
          </button>

          {/* Desktop Hamburger */}
          <button
            onClick={toggleDesktopSidebar}
            className="hidden md:inline-flex items-center justify-center w-10 h-10 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all duration-200"
            aria-label="Toggle desktop sidebar"
          >
            <Menu size={24} />
          </button>
          
          {/* Logo (Visible in Header on Mobile or if Sidebar is collapsed) */}
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500 shadow-md shadow-emerald-500/20">
              <span className="text-white font-bold text-lg leading-none">C</span>
            </div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight hidden sm:block">
              CleverPrep
            </h1>
          </div>
        </div>

        {/* Center: Search Bar (Visual Only) */}
        <div className="hidden md:flex flex-1 justify-center max-w-lg px-6 tour-search-bar">
          <div className="w-full relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search size={18} className="text-slate-400 group-hover:text-emerald-500 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search documents, quizzes, flashcards..."
              className="w-full bg-slate-100 hover:bg-slate-200/80 focus:bg-white text-slate-900 text-sm rounded-full pl-10 pr-4 py-2.5 outline-none border border-transparent focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-300 placeholder:text-slate-500"
              readOnly
            />
          </div>
        </div>

        {/* Right Side: Profile & Notifications */}
        <div className="flex items-center gap-2 sm:gap-4 ml-auto md:w-[220px] justify-end">
          
          {/* Mobile Search Icon (Instead of full bar) */}
          <button className="md:hidden inline-flex items-center justify-center w-10 h-10 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all duration-200">
            <Search size={20} />
          </button>

          {/* Notification Button */}
          <button className="relative inline-flex items-center justify-center w-10 h-10 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all duration-200 group">
            <Bell size={20} strokeWidth={2} className="group-hover:scale-110 transition-transform duration-200" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white"></span>
          </button>

          {/* User Profile */}
          <div className="flex items-center gap-3 pl-2 sm:pl-3 border-l border-slate-200/60 relative" id="profile-dropdown-container">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-2 sm:gap-3 px-2 py-1.5 rounded-xl hover:bg-slate-50 transition-colors duration-200 cursor-pointer group focus:outline-none"
              aria-expanded={isOpen}
              aria-haspopup="true"
            >
              {/* User Avatar */}
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt={user?.username}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover shadow-xs border border-slate-100"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = 'none';
                    e.target.parentNode.classList.add('bg-gradient-to-br', 'from-emerald-400', 'to-teal-500', 'text-white');
                    e.target.parentNode.innerHTML = `<span>${getInitials()}</span>`;
                  }}
                />
              ) : (
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xs font-black uppercase shadow-md shadow-emerald-500/10">
                  {getInitials()}
                </div>
              )}

              {/* User Info */}
              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold text-slate-900 truncate max-w-[120px]">
                  {user?.username || "User"}
                </p>
              </div>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
              <div className="absolute right-0 top-full mt-2.5 w-68 bg-white border border-slate-200/60 rounded-[18px] shadow-2xl p-4 z-55 animate-in fade-in slide-in-from-top-1 duration-200 origin-top-right">
                
                {/* User Card info inside dropdown */}
                <div className="flex flex-col items-center text-center p-2 mb-2">
                  {avatarSrc ? (
                    <img
                      src={avatarSrc}
                      alt={user?.username}
                      className="w-14 h-14 rounded-full object-cover mb-2.5 shadow-md border-2 border-white"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.style.display = 'none';
                        e.target.parentNode.classList.add('bg-gradient-to-br', 'from-emerald-400', 'to-teal-500', 'text-white');
                        e.target.parentNode.innerHTML = `<span>${getInitials()}</span>`;
                      }}
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-lg font-black uppercase mb-2.5 shadow-md shadow-emerald-500/10">
                      {getInitials()}
                    </div>
                  )}

                  <h3 className="text-sm font-bold text-slate-900 leading-tight">
                    {user?.username || "User"}
                  </h3>

                  <div className="mt-1">
                    <span className="inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100/50">
                      Verified Student ✓
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 font-semibold mt-1.5 break-all max-w-full">
                    {user?.email}
                  </p>
                </div>

                <div className="border-t border-slate-100 my-2"></div>

                {/* Dropdown Menu items */}
                <div className="space-y-0.5">
                  <Link
                    to="/profile"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:text-emerald-700 hover:bg-emerald-50/70 transition-all duration-200 group/item cursor-pointer"
                  >
                    <span className="group-hover/item:translate-x-0.5 transition-transform duration-200 text-base">
                      ✏️
                    </span>
                    <span>My Profile</span>
                  </Link>

                  <Link
                    to="/profile"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:text-emerald-700 hover:bg-emerald-50/70 transition-all duration-200 group/item cursor-pointer"
                  >
                    <span className="group-hover/item:translate-x-0.5 transition-transform duration-200 text-base">
                      ⚙️
                    </span>
                    <span>Settings</span>
                  </Link>
                </div>

                <div className="border-t border-slate-100 my-2"></div>

                <button
                  onClick={() => {
                    setIsOpen(false);
                    setShowLogoutModal(true);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50/70 transition-all duration-200 group/item cursor-pointer text-left focus:outline-none"
                >
                  <span className="group-hover/item:translate-x-0.5 transition-transform duration-200 text-base">
                    🚪
                  </span>
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