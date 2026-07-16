import React, { useState } from "react";

import Sidebar from "./Sidebar";
import Header from "./Header";
import TourOverlay from "../tour/TourOverlay";

// ==========================================
// Main App Layout
// ==========================================
const AppLayout = ({ children }) => {

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
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-display">
      {/* Fixed Top Header */}
      <Header 
        toggleMobileMenu={toggleMobileMenu} 
        toggleDesktopSidebar={toggleDesktopSidebar}
        isSidebarCollapsed={isSidebarCollapsed}
      />
      
      {/* Main Content Area (Below Header) */}
      <div className="flex flex-1 pt-16 overflow-hidden">
        {/* Sidebar */}
        <Sidebar 
          isMobileMenuOpen={isMobileMenuOpen} 
          toggleMobileMenu={toggleMobileMenu}
          isSidebarCollapsed={isSidebarCollapsed}
        />
        
        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#F8FAFC]">
          <div className="p-4 md:p-8 max-w-[1920px] mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
      <TourOverlay />
    </div>
  );
};

export default AppLayout;