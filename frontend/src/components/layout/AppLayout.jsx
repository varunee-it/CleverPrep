import React, { useState } from "react";
import { useLocation } from "react-router-dom";

import Sidebar from "./Sidebar";
import Header from "./Header";
import TourOverlay from "../tour/TourOverlay";
import MinimizedFocusChip from "../focus/MinimizedFocusChip";

// ==========================================
// Main App Layout
// ==========================================
const AppLayout = ({ children }) => {
  const location = useLocation();
  const isFocusPage = location.pathname.startsWith("/focus");

  // ==========================================
  // Sidebar States
  // ==========================================
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // ==========================================
  // Toggle Handlers
  // ==========================================
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleDesktopSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className={`flex h-screen overflow-hidden font-display transition-colors duration-300 ${
      isFocusPage ? "bg-[#090E18] text-white" : "bg-slate-50 text-slate-900"
    }`}>
      {/* Fixed Top Header */}
      <Header 
        toggleMobileMenu={toggleMobileMenu} 
        toggleDesktopSidebar={toggleDesktopSidebar}
        isSidebarCollapsed={isSidebarCollapsed}
      />
      
      {/* Main Content Area (Below Header) */}
      <div className="flex flex-1 pt-14 overflow-hidden">
        {/* Sidebar */}
        <Sidebar 
          isMobileMenuOpen={isMobileMenuOpen} 
          toggleMobileMenu={toggleMobileMenu}
          isSidebarCollapsed={isSidebarCollapsed}
        />
        
        {/* Page Content */}
        <main className={`flex-1 overflow-x-hidden overflow-y-auto transition-colors duration-300 ${
          isFocusPage ? "bg-[#090E18]" : "bg-[#F8FAFC]"
        }`}>
          <div className={`${
            isFocusPage 
              ? "max-w-[1400px] w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-10 py-6"
              : "p-4 md:p-8 max-w-[1920px] mx-auto w-full"
          }`}>
            {children}
          </div>
        </main>
      </div>
      <TourOverlay />
      <MinimizedFocusChip />
    </div>
  );
};

export default AppLayout;