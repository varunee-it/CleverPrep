import React from "react";
import { useAuth } from "../../context/AuthContext";
import { Bell, User, Menu, Search } from "lucide-react";

const Header = ({ toggleMobileMenu, toggleDesktopSidebar, isSidebarCollapsed }) => {
  const { user } = useAuth();

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
        <div className="hidden md:flex flex-1 justify-center max-w-lg px-6">
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
          <div className="flex items-center gap-3 pl-2 sm:pl-3 border-l border-slate-200/60">
            <div className="flex items-center gap-2 sm:gap-3 px-2 py-1.5 rounded-xl hover:bg-slate-50 transition-colors duration-200 cursor-pointer group">
              {/* User Icon */}
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-all duration-200">
                <User size={18} strokeWidth={2.5} />
              </div>

              {/* User Info */}
              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold text-slate-900 truncate max-w-[120px]">
                  {user?.username || "User"}
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </header>
  );
};

export default Header;