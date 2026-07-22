import React, { useState, useEffect } from "react";
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
  // Focus Workspace Global Theme Selector State
  // ==========================================
  const [globalTheme, setGlobalTheme] = useState(() => localStorage.getItem("cleverprep_global_theme") || "white");

  useEffect(() => {
    const handleThemeChange = () => {
      setGlobalTheme(localStorage.getItem("cleverprep_global_theme") || "white");
    };
    window.addEventListener("cleverprep-global-theme-changed", handleThemeChange);
    return () => window.removeEventListener("cleverprep-global-theme-changed", handleThemeChange);
  }, []);

  // Write theme dynamically to documentElement so all pages/elements inherit it
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", globalTheme);
  }, [globalTheme]);

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
    <div className="flex h-screen overflow-hidden font-display transition-colors duration-300 bg-bg-base text-text-primary">
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
        <main className="flex-1 overflow-x-hidden overflow-y-auto transition-colors duration-300 bg-bg-base">
          <div className={`${
            isFocusPage 
              ? "max-w-[1400px] w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-10 py-3 md:py-4"
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