import React, { useState } from "react";

import Sidebar from "./Sidebar";
import Header from "./Header";

// ==========================================
// Main App Layout
// ==========================================
const AppLayout = ({ children }) => {

  // ==========================================
  // Sidebar State
  // ==========================================
  const [isSidebarOpen, setIsSidebarOpen] =
    useState(false);

  // ==========================================
  // Toggle Sidebar
  // ==========================================
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
   
   <div className="flex h-screen bg-neutural-50 text-neutural-900">
    <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
    <div className="flex-1 flex flex-col overflow-hidden">
    <Header toggleSidebar={toggleSidebar} />
    <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
      {children}
      
      </main>
   </div>
   </div>
  );
};

export default AppLayout;