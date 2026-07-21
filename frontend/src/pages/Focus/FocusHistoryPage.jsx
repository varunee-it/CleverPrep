import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import focusStorage from "../../services/FocusStorage";
import useStudySession from "../../hooks/useStudySession";
import {
  ArrowLeft,
  Search,
  Filter,
  ArrowUpDown,
  Calendar,
  List,
  Trash2,
  Copy,
  FileSpreadsheet,
  FileText,
  Clock,
  Compass,
  Award,
  Music4,
  Activity
} from "lucide-react";

export const FocusHistoryPage = () => {
  const navigate = useNavigate();
  const { createSession, startSession } = useStudySession();

  const [history, setHistory] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activityFilter, setActivityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");
  const [viewMode, setViewMode] = useState("list"); // "list", "timeline", "calendar"
  
  // Calendar navigation states
  const [currentDate, setCurrentDate] = useState(new Date());

  // Load history on mount
  useEffect(() => {
    setHistory(focusStorage.loadHistory());
  }, []);

  // Filter & Sort computation
  const filteredHistory = history
    .filter(item => {
      const matchesSearch = 
        item.goal.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.activity.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesStatus = statusFilter === "all" || item.completionStatus.toLowerCase() === statusFilter.toLowerCase();
      const matchesActivity = activityFilter === "all" || item.activity.toLowerCase() === activityFilter.toLowerCase();

      return matchesSearch && matchesStatus && matchesActivity;
    })
    .sort((a, b) => {
      if (sortBy === "date-desc") return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === "date-asc") return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === "duration-desc") return b.completedDuration - a.completedDuration;
      if (sortBy === "duration-asc") return a.completedDuration - b.completedDuration;
      if (sortBy === "completion-desc") {
        const rateA = Math.round((a.completedDuration / a.totalDuration) * 100);
        const rateB = Math.round((b.completedDuration / b.totalDuration) * 100);
        return rateB - rateA;
      }
      return 0;
    });

  // Unique activities for filter dropdown
  const uniqueActivities = Array.from(new Set(history.map(item => item.activity)));

  // Actions handlers
  const handleDelete = (id) => {
    const updated = history.filter(item => item.id !== id);
    setHistory(updated);
    focusStorage.saveHistory(updated);
  };

  const handleDuplicate = (item) => {
    // Start session configuration with duplicated inputs
    createSession({
      mode: "quick",
      duration: item.totalDuration * 60,
      activityType: item.activity,
      goal: item.goal,
      selectedSound: item.environment !== "Silence Off" ? item.environment : null
    });
    // Redirect user to workspace
    navigate("/focus");
  };

  // CSV Export
  const handleExportCSV = () => {
    if (history.length === 0) return;
    const headers = ["Date", "Start Time", "End Time", "Total Duration (mins)", "Completed Duration (mins)", "Activity", "Goal", "Environment", "Status", "Notes"];
    const rows = history.map(item => [
      item.date,
      item.startTime,
      item.endTime,
      item.totalDuration,
      item.completedDuration,
      item.activity,
      `"${item.goal.replace(/"/g, '""')}"`,
      item.environment,
      item.completionStatus,
      item.notes ? `"${item.notes.replace(/"/g, '""')}"` : '""'
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `cleverprep_focus_history_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Friendly PDF Export
  const handleExportPDF = () => {
    window.print();
  };

  // Calendar render helpers
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayIndex = getFirstDayOfMonth(year, month);
    
    const days = [];
    // Blank padding cells
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(<div key={`empty-${i}`} className="h-22 bg-bg-base/30 border border-dashed border-border/40 rounded-xl opacity-30" />);
    }

    // Days in current month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const daySessions = history.filter(item => item.date === dateStr);
      const isToday = new Date().toLocaleDateString("en-CA") === dateStr;

      const maxVisible = 2;
      const visibleSessions = daySessions.slice(0, maxVisible);
      const hiddenCount = daySessions.length - maxVisible;

      days.push(
        <div 
          key={`day-${day}`} 
          className={`h-22 p-2 border rounded-xl flex flex-col justify-between transition-all duration-300 hover:bg-bg-surface/90 hover:shadow-theme-sm relative group ${
            isToday 
              ? "border-2 border-primary bg-primary/5 shadow-theme-sm" 
              : "border-border/60 bg-bg-surface/40"
          }`}
        >
          <span className={`text-[10px] font-black leading-none ${isToday ? "text-primary" : "text-text-muted"}`}>{day}</span>
          <div className="flex flex-col gap-1 overflow-hidden mt-1">
            {visibleSessions.map((session, idx) => {
              const isCompleted = session.completionStatus === "Completed";
              return (
                <div 
                  key={session.id || idx}
                  onClick={() => {
                    setSearchQuery(session.goal);
                    setViewMode("list");
                  }}
                  className={`text-[8px] truncate px-1.5 py-0.5 rounded font-bold cursor-pointer transition-all ${
                    isCompleted 
                      ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400" 
                      : "bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-455"
                  }`}
                  title={`${session.startTime} - ${session.goal}`}
                >
                  {session.goal}
                </div>
              );
            })}
            {hiddenCount > 0 && (
              <div 
                onClick={() => {
                  const dayDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  setSearchQuery(dayDate);
                  setViewMode("list");
                }}
                className="text-[7.5px] font-black text-primary text-center py-0.5 cursor-pointer hover:underline uppercase tracking-wider"
              >
                +{hiddenCount} more
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4 animate-in fade-in duration-300 text-left">
        {/* Calendar Nav header */}
        <div className="flex items-center justify-between bg-bg-surface/60 border border-border rounded-2xl px-4 py-2">
          <button 
            onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
            className="text-xs font-black text-text-secondary hover:text-text-primary cursor-pointer select-none"
          >
            ← Previous
          </button>
          <h4 className="text-xs font-extrabold text-text-primary select-none">
            {currentDate.toLocaleString("default", { month: "long", year: "numeric" })}
          </h4>
          <button 
            onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
            className="text-xs font-black text-text-secondary hover:text-text-primary cursor-pointer select-none"
          >
            Next →
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1.5 text-center">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
            <div key={d} className="text-[9px] font-black uppercase tracking-wider text-text-muted py-1">{d}</div>
          ))}
          {days}
        </div>
      </div>
    );
  };

  const renderTimeline = () => {
    if (filteredHistory.length === 0) {
      return (
        <div className="text-center py-20 text-text-muted text-xs font-semibold">
          No study sessions matched your filter criteria.
        </div>
      );
    }

    return (
      <div className="relative border-l border-border ml-4 md:ml-12 pl-6 space-y-6 pb-12 text-left animate-in fade-in duration-300">
        {filteredHistory.map((item, idx) => {
          const isCompleted = item.completionStatus === "Completed";
          const rate = Math.round((item.completedDuration / item.totalDuration) * 100);
          
          let envIcon = "🎧";
          if (item.environment.includes("Forest")) envIcon = "🌲";
          else if (item.environment.includes("Ocean") || item.environment.includes("Rain")) envIcon = "🌊";
          else if (item.environment.includes("Cafe")) envIcon = "☕";

          return (
            <div key={item.id || idx} className="relative group">
              <div className={`absolute -left-[35px] top-1.5 w-6 h-6 rounded-full border bg-bg-surface flex items-center justify-center text-xs shadow-theme-sm ${
                isCompleted ? "border-primary text-primary" : "border-rose-500/40 text-rose-500"
              }`}>
                {envIcon}
              </div>

              <div className="bg-bg-surface/50 border border-border hover:border-border-hover p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300 hover:scale-[1.005]">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] font-black text-text-muted font-mono uppercase tracking-wider">{item.date} • {item.startTime}</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-[7px] font-black uppercase tracking-wider border ${
                      isCompleted 
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400" 
                        : "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-455"
                    }`}>
                      {item.completionStatus}
                    </span>
                  </div>
                  <h4 className="text-xs font-extrabold text-text-primary truncate">🎯 {item.goal}</h4>
                  <p className="text-[9px] font-bold text-text-muted mt-1">
                    Activity: <span className="text-text-secondary">{item.activity}</span> • Atmosphere: <span className="text-text-secondary">{item.environment}</span>
                  </p>
                </div>

                <div className="flex items-center gap-6 shrink-0 justify-between md:justify-end border-t md:border-t-0 border-border pt-3 md:pt-0">
                  <div className="text-right">
                    <span className="text-[9px] font-black text-text-muted uppercase tracking-widest block leading-none">Productivity</span>
                    <span className="text-sm font-mono font-bold text-text-primary mt-1 block leading-none">{rate}% Score</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleDuplicate(item)}
                      className="p-1.5 bg-bg-surface border border-border text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover rounded-lg transition-colors cursor-pointer"
                      title="Quick Resume"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-500 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                      title="Delete log"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div 
      className="fixed inset-0 z-[150] overflow-y-auto flex flex-col p-4 sm:p-8 font-display select-none"
      style={{
        background: `linear-gradient(135deg, var(--color-bg-base) 0%, var(--color-bg-surface) 100%)`
      }}
    >
      
      {/* 1. Header Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-border pb-4 mb-6 shrink-0 gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/focus")}
            className="p-1.5 bg-bg-surface border border-border hover:border-border-hover text-text-secondary hover:text-text-primary rounded-xl transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-base font-extrabold text-text-primary leading-tight">Focus Journal</h2>
            <p className="text-[10px] font-bold text-text-muted tracking-wider uppercase mt-0.5">Session Logs History</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => navigate("/focus")}
            className="px-3 py-1.5 bg-bg-surface border border-border text-text-secondary hover:text-text-primary rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            Workspace
          </button>
          <button
            onClick={() => navigate("/focus/analytics")}
            className="px-3 py-1.5 bg-bg-surface border border-border text-text-secondary hover:text-text-primary rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            Analytics
          </button>

          {/* List vs Timeline vs Calendar views */}
          <div className="flex items-center bg-bg-surface/50 border border-border rounded-xl p-0.5">
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === "list" ? "bg-primary text-primary-text" : "text-text-secondary hover:text-text-primary"
              }`}
              title="List layout"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("timeline")}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === "timeline" ? "bg-primary text-primary-text" : "text-text-secondary hover:text-text-primary"
              }`}
              title="Timeline flow"
            >
              <Activity className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === "calendar" ? "bg-primary text-primary-text" : "text-text-secondary hover:text-text-primary"
              }`}
              title="Calendar grid"
            >
              <Calendar className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Export items */}
          <button
            onClick={handleExportCSV}
            disabled={history.length === 0}
            className="px-3 py-1.5 bg-bg-surface border border-border text-text-secondary hover:text-text-primary rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all disabled:opacity-20 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
            <span>CSV</span>
          </button>
          <button
            onClick={handleExportPDF}
            disabled={history.length === 0}
            className="px-3 py-1.5 bg-bg-surface border border-border text-text-secondary hover:text-text-primary rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all disabled:opacity-20 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-teal-500" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* Print Only Header */}
      <div className="hidden print:block text-black text-center mb-6">
        <h1 className="text-xl font-bold">CleverPrep Study Sessions Report</h1>
        <p className="text-xs text-gray-600">Generated on {new Date().toLocaleDateString()}</p>
      </div>

      {/* 2. Filters & Searches */}
      {viewMode === "list" && history.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-bg-surface/50 border border-border p-3 rounded-2xl mb-6 print:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search goals, notes..."
              className="w-full pl-9 pr-4 py-1.5 bg-bg-surface border border-border rounded-xl text-xs placeholder-text-muted text-text-primary focus:outline-none focus:border-primary/50 transition-all font-semibold"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-2.5 w-3.5 h-3.5 text-text-muted" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-bg-surface border border-border rounded-xl text-xs text-text-secondary focus:outline-none focus:border-primary/50 transition-all cursor-pointer font-bold"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="relative">
            <Compass className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
            <select
              value={activityFilter}
              onChange={(e) => setActivityFilter(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-950/40 border border-slate-850 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-emerald-500/40 transition-all cursor-pointer font-bold"
            >
              <option value="all">All Activities</option>
              {uniqueActivities.map(act => (
                <option key={act} value={act}>{act}</option>
              ))}
            </select>
          </div>

          <div className="relative">
            <ArrowUpDown className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-950/40 border border-slate-850 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-emerald-500/40 transition-all cursor-pointer font-bold"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="duration-desc">Longest Session</option>
              <option value="duration-asc">Shortest Session</option>
              <option value="completion-desc">Highest Completion</option>
            </select>
          </div>
        </div>
      )}

      {/* 3. Main Data Area */}
      <div className="flex-1 overflow-y-auto">
        {history.length === 0 ? (
          /* Empty state block matching specs */
          <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-300 max-w-sm mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4">
              <Compass className="w-6 h-6 text-slate-650 animate-pulse" />
            </div>
            <h3 className="text-sm font-extrabold text-white">Your study journal is empty</h3>
            <p className="text-[11px] text-slate-500 leading-relaxed font-semibold mt-1.5 mb-6">
              Complete focus sessions to record study metrics, milestones, and environment preferences.
            </p>
            <button
              onClick={() => navigate("/focus")}
              className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-emerald-500/20 cursor-pointer hover:-translate-y-0.5 transition-all"
            >
              Start Focus Block
            </button>
          </div>
        ) : viewMode === "calendar" ? (
          renderCalendar()
        ) : viewMode === "timeline" ? (
          renderTimeline()
        ) : filteredHistory.length === 0 ? (
          <div className="text-center py-20 text-slate-500 text-xs font-semibold">
            No study sessions matched your filter criteria.
          </div>
        ) : (
          /* Premium grid card layout (2-4 cards responsive) */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-in fade-in duration-300 pb-8 text-left">
            {filteredHistory.map((item, idx) => {
              const rate = Math.round((item.completedDuration / item.totalDuration) * 100);
              const isCompleted = item.completionStatus === "Completed";
              
              // Environment icon maps
              let envIcon = "🎧";
              if (item.environment.includes("Forest")) envIcon = "🌲";
              else if (item.environment.includes("Ocean") || item.environment.includes("Rain")) envIcon = "🌊";
              else if (item.environment.includes("Cafe")) envIcon = "☕";

              return (
                <div 
                  key={item.id || idx}
                  className="bg-[#111827]/40 border border-slate-900 hover:border-emerald-500/25 hover:shadow-emerald-500/5 p-4 rounded-2xl backdrop-blur-2xl shadow-md flex flex-col justify-between transition-all duration-300 hover:scale-[1.01] hover:-translate-y-0.5 hover:shadow-lg relative select-none print:bg-white print:text-black print:border-gray-300"
                >
                  <div>
                    {/* Header info */}
                    <div className="flex items-center justify-between mb-2.5 shrink-0">
                      <span className="text-[9px] font-black text-slate-550 font-mono tracking-wider">{item.date} • {item.startTime}</span>
                      <span className={`px-1.5 py-0.5 rounded-full text-[7px] font-black uppercase tracking-wider border ${
                        isCompleted 
                          ? "bg-emerald-950/60 border-emerald-900/60 text-[#10D28F]" 
                          : "bg-rose-950/60 border-rose-900/60 text-rose-455"
                      }`}>
                        {item.completionStatus}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mb-2 shrink-0">
                      <span className="text-base select-none">{envIcon}</span>
                      <h4 className="text-xs font-extrabold text-white truncate max-w-[130px] print:text-black animate-in fade-in" title={item.goal}>
                        {item.goal}
                      </h4>
                    </div>

                    <div className="space-y-1.5 mt-2.5">
                      <div className="flex justify-between text-[9px] font-bold text-slate-450">
                        <span>Activity:</span>
                        <span className="text-slate-300 truncate max-w-[100px] print:text-black">{item.activity}</span>
                      </div>
                      <div className="flex justify-between text-[9px] font-bold text-slate-450">
                        <span>Atmosphere:</span>
                        <span className="text-slate-300 truncate max-w-[100px] print:text-black">{item.environment}</span>
                      </div>
                      {item.notes && (
                        <div className="text-[8px] text-slate-500 mt-2 bg-slate-950/30 border border-slate-900 p-2 rounded-xl italic print:text-black print:border-gray-200 truncate">
                          "{item.notes}"
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-900/60 print:border-gray-200">
                    <div className="flex items-center justify-between gap-4 mb-2">
                      <div className="text-left">
                        <span className="text-[8px] text-slate-500 font-bold block leading-none">Duration</span>
                        <span className="text-xs font-mono font-black text-white mt-1 block leading-none print:text-black">
                          {item.completedDuration}m / {item.totalDuration}m
                        </span>
                      </div>

                      {/* Mini circular progress ring */}
                      <div className="relative shrink-0 flex items-center justify-center" title={`${rate}% Completeness`}>
                        <svg className="w-8 h-8 transform -rotate-90 select-none" viewBox="0 0 32 32">
                          <circle cx="16" cy="16" r="12" fill="none" stroke="#1e293b" strokeWidth="2.5" />
                          <circle cx="16" cy="16" r="12" fill="none" stroke={isCompleted ? "#10D28F" : "#ef4444"} strokeWidth="2.5" 
                            strokeDasharray={75.4} strokeDashoffset={75.4 - (75.4 * Math.min(100, rate)) / 100}
                            strokeLinecap="round" className="transition-all duration-500" />
                        </svg>
                        <span className="absolute text-[8px] font-mono font-black text-slate-350">{rate}%</span>
                      </div>
                    </div>

                    {/* Actions panel */}
                    <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-slate-900/30 print:hidden">
                      <button
                        onClick={() => handleDuplicate(item)}
                        className="px-2 py-0.5 bg-slate-900/60 hover:bg-slate-850 border border-slate-850 text-slate-400 hover:text-white rounded-lg text-[8px] font-extrabold uppercase tracking-widest flex items-center gap-1 transition-all cursor-pointer"
                        title="Quick Resume"
                      >
                        <Copy className="w-2.5 h-2.5 text-slate-550" />
                        <span>Resume</span>
                      </button>

                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1 text-slate-650 hover:text-rose-455 hover:bg-rose-955/10 rounded-lg transition-all cursor-pointer"
                        title="Delete log"
                        aria-label="Delete entry"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};

export default FocusHistoryPage;
