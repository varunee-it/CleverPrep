import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  Activity,
  Zap,
  TrendingUp,
  Target,
  ChevronLeft,
  ChevronRight,
  Plus
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export const FocusHistoryPage = () => {
  const navigate = useNavigate();
  const { createSession } = useStudySession();
  const { user } = useAuth();

  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activityFilter, setActivityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");
  const [viewMode, setViewMode] = useState("calendar"); // "list", "timeline", "calendar"
  
  // Calendar navigation states
  const [currentDate, setCurrentDate] = useState(new Date());

  // Load history on mount
  useEffect(() => {
    setHistory(focusStorage.loadHistory());
    setStats(focusStorage.loadStats() || {});
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
    createSession({
      mode: "quick",
      duration: item.totalDuration * 60,
      activityType: item.activity,
      goal: item.goal,
      selectedSound: item.environment !== "Silence Off" ? item.environment : null
    });
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

  // Core Statistics calculations
  const totalSessions = history.length;
  const totalHours = (history.reduce((acc, item) => acc + item.completedDuration, 0) / 60).toFixed(1);
  const avgSession = history.length > 0 ? Math.round(history.reduce((acc, item) => acc + item.completedDuration, 0) / history.length) : 0;
  const currentStreak = user?.currentStreak || 0;
  const longestStreak = user?.longestStreak || 0;
  const deepWorkHours = (history.filter(item => item.completedDuration >= 25).reduce((acc, item) => acc + item.completedDuration, 0) / 60).toFixed(1);

  // Helper: Find day with highest focus minutes
  const getBestDay = () => {
    if (history.length === 0) return "N/A";
    const dayMap = {};
    history.forEach(item => {
      dayMap[item.date] = (dayMap[item.date] || 0) + item.completedDuration;
    });
    let bestDate = "N/A";
    let maxMin = 0;
    Object.keys(dayMap).forEach(d => {
      if (dayMap[d] > maxMin) {
        maxMin = dayMap[d];
        bestDate = d;
      }
    });
    if (bestDate === "N/A") return "N/A";
    const dateObj = new Date(bestDate);
    return dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + ` (${maxMin}m)`;
  };

  // Helper: Get most used sound atmosphere
  const getMostUsedAtmosphere = () => {
    if (history.length === 0) return "Silence";
    const map = {};
    history.forEach(item => {
      map[item.environment] = (map[item.environment] || 0) + 1;
    });
    let mode = "Silence";
    let max = 0;
    Object.keys(map).forEach(env => {
      if (map[env] > max) {
        max = map[env];
        mode = env;
      }
    });
    return mode;
  };

  const bestDay = getBestDay();
  const mostUsedEnv = getMostUsedAtmosphere();

  // Helper: Activity distribution list
  const getActivityDistribution = () => {
    if (history.length === 0) return [];
    const dist = {};
    history.forEach(item => {
      dist[item.activity] = (dist[item.activity] || 0) + 1;
    });
    return Object.keys(dist).map(act => ({
      activity: act,
      count: dist[act],
      pct: Math.round((dist[act] / history.length) * 100)
    })).sort((a, b) => b.count - a.count).slice(0, 3);
  };

  // Helper: Get color schemes for different activities
  const getEventColor = (activityType = "") => {
    const act = activityType.toLowerCase();
    if (act.includes("study") || act.includes("deep") || act.includes("quick")) {
      return "bg-indigo-500/10 border border-indigo-500/20 text-indigo-400";
    }
    if (act.includes("read") || act.includes("book") || act.includes("library")) {
      return "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400";
    }
    if (act.includes("flash") || act.includes("card")) {
      return "bg-sky-500/10 border border-sky-500/20 text-sky-400";
    }
    if (act.includes("quiz") || act.includes("test") || act.includes("take")) {
      return "bg-amber-500/10 border border-amber-500/20 text-amber-400";
    }
    if (act.includes("podcast") || act.includes("audio") || act.includes("listen")) {
      return "bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-400";
    }
    if (act.includes("break") || act.includes("rest")) {
      return "bg-slate-500/10 border border-slate-500/20 text-slate-400";
    }
    return "bg-primary/10 border border-primary/20 text-primary";
  };

  // Calendar rendering logic
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
      days.push(<div key={`empty-${i}`} className="h-16 bg-bg-base/10 border border-dashed border-border/20 rounded-lg opacity-25" />);
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
          className={`h-16 p-1.5 border rounded-lg flex flex-col justify-between transition-all duration-205 hover:bg-bg-surface/90 hover:border-primary/25 hover:shadow-theme-sm relative group cursor-pointer ${
            isToday 
              ? "border-primary bg-primary/[0.04] shadow-theme-sm" 
              : "border-border/60 bg-bg-surface/30"
          }`}
        >
          {/* Subtle grid background texture */}
          <div className="absolute inset-0 bg-linear-to-br from-white/[0.005] to-transparent pointer-events-none" />

          {/* Plus icon on hover for empty days */}
          {daySessions.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-30 transition-opacity duration-200 pointer-events-none">
              <Plus className="w-3.5 h-3.5 text-primary" />
            </div>
          )}

          <span className={`text-[9px] font-black leading-none ${isToday ? "text-primary font-black" : "text-text-muted"}`}>{day}</span>
          
          <div className="flex flex-col gap-0.5 overflow-hidden mt-0.5 relative z-10">
            {visibleSessions.map((session, idx) => {
              const isCompleted = session.completionStatus === "Completed";
              const colorsClass = getEventColor(session.activity);
              return (
                <div 
                  key={session.id || idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSearchQuery(session.goal);
                    setViewMode("list");
                  }}
                  className={`text-[7px] truncate px-1 py-0.5 rounded-sm font-extrabold leading-tight cursor-pointer transition-all hover:scale-102 ${colorsClass}`}
                  title={`${session.startTime} - ${session.goal}`}
                >
                  {session.goal}
                </div>
              );
            })}
            {hiddenCount > 0 && (
              <div 
                onClick={(e) => {
                  e.stopPropagation();
                  const dayDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  setSearchQuery(dayDate);
                  setViewMode("list");
                }}
                className="text-[7.5px] font-black text-primary text-center py-0.5 cursor-pointer hover:underline uppercase tracking-wider leading-none"
              >
                +{hiddenCount} more
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3 animate-in fade-in duration-300 text-left">
        {/* Calendar Nav header */}
        <div className="flex items-center justify-between bg-bg-surface/50 border border-border/80 rounded-xl px-3 py-1.5">
          <button 
            onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
            className="text-[9px] font-black text-text-secondary hover:text-text-primary hover:bg-bg-surface border border-border/80 rounded-lg px-2 py-1 cursor-pointer select-none transition-colors"
          >
            <ChevronLeft className="w-3 h-3 inline mr-0.5" /> Prev
          </button>
          
          <h4 className="text-[11px] font-extrabold text-text-primary tracking-tight select-none">
            {currentDate.toLocaleString("default", { month: "long", year: "numeric" })}
          </h4>
          
          <button 
            onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
            className="text-[9px] font-black text-text-secondary hover:text-text-primary hover:bg-bg-surface border border-border/80 rounded-lg px-2 py-1 cursor-pointer select-none transition-colors"
          >
            Next <ChevronRight className="w-3 h-3 inline ml-0.5" />
          </button>
        </div>

        {/* Days of Week */}
        <div className="grid grid-cols-7 gap-1 text-center bg-bg-surface/20 border border-border/40 p-1 rounded-xl">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
            <div key={d} className="text-[8px] font-black uppercase tracking-wider text-text-muted py-0.5">{d}</div>
          ))}
          {days}
        </div>
      </div>
    );
  };

  // Timeline view rendering
  const renderTimeline = () => {
    if (filteredHistory.length === 0) {
      return (
        <div className="text-center py-20 text-text-muted text-xs font-semibold">
          No study sessions matched your filter criteria.
        </div>
      );
    }

    return (
      <div className="relative border-l border-border/60 ml-4 md:ml-8 pl-5 space-y-4 pb-12 text-left animate-in fade-in duration-300">
        {filteredHistory.map((item, idx) => {
          const isCompleted = item.completionStatus === "Completed";
          const rate = Math.round((item.completedDuration / item.totalDuration) * 100);
          
          let envIcon = "🎧";
          if (item.environment.includes("Forest")) envIcon = "🌲";
          else if (item.environment.includes("Ocean") || item.environment.includes("Rain")) envIcon = "🌊";
          else if (item.environment.includes("Cafe")) envIcon = "☕";

          return (
            <div key={item.id || idx} className="relative group">
              <div className={`absolute -left-[29px] top-1 w-4.5 h-4.5 rounded-full border bg-bg-surface flex items-center justify-center text-[9px] shadow-theme-sm ${
                isCompleted ? "border-primary text-primary" : "border-rose-500/40 text-rose-500"
              }`}>
                {envIcon}
              </div>

              <div className="bg-bg-surface/30 border border-border/60 hover:border-border p-3.5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-200">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[8px] font-black text-text-muted font-mono uppercase tracking-wider">{item.date} • {item.startTime}</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-[7px] font-black uppercase tracking-wider border ${
                      isCompleted 
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400" 
                        : "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-455"
                    }`}>
                      {item.completionStatus}
                    </span>
                  </div>
                  <h4 className="text-xs font-extrabold text-text-primary truncate">🎯 {item.goal}</h4>
                  <p className="text-[9px] font-bold text-text-muted mt-1 leading-none">
                    Activity: <span className="text-text-secondary">{item.activity}</span> • Atmosphere: <span className="text-text-secondary">{item.environment}</span>
                  </p>
                </div>

                <div className="flex items-center gap-5 shrink-0 justify-between md:justify-end border-t md:border-t-0 border-border/50 pt-2.5 md:pt-0">
                  <div className="text-right">
                    <span className="text-[8px] font-black text-text-muted uppercase tracking-widest block leading-none">Productivity</span>
                    <span className="text-xs font-mono font-bold text-text-primary mt-1 block leading-none">{rate}% Score</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDuplicate(item)}
                      className="p-1 bg-bg-surface border border-border/80 text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover rounded-lg transition-colors cursor-pointer"
                      title="Quick Resume"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-500 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                      title="Delete log"
                    >
                      <Trash2 className="w-3 h-3" />
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
      className="fixed inset-0 z-[150] overflow-y-auto flex flex-col p-3 sm:p-5 pb-24 sm:pb-28 font-display select-none"
      style={{
        background: `linear-gradient(135deg, var(--color-bg-base) 0%, var(--color-bg-surface) 100%)`
      }}
    >
      {/* 1. Header Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-border pb-2.5 mb-4 shrink-0 gap-3 print:hidden">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/focus")}
            className="p-1 bg-bg-surface border border-border hover:border-border-hover text-text-secondary hover:text-text-primary rounded-lg transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            aria-label="Back"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <div className="text-left">
            <h2 className="text-sm font-extrabold text-text-primary leading-tight">Focus Journal</h2>
            <p className="text-[9px] font-bold text-text-muted tracking-wider uppercase mt-0.5">Session Logs History</p>
          </div>
        </div>

        {/* Global Toolbar Controllers */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Metrics display */}
          <div className="hidden sm:flex items-center gap-3 px-3 h-7 bg-bg-surface/40 border border-border/80 rounded-lg text-[9px] font-black text-text-secondary uppercase tracking-wider">
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span>{totalHours} hrs</span>
            </div>
            <div className="w-px h-3 bg-border/60" />
            <div>{totalSessions} Sessions</div>
          </div>

          <button
            onClick={() => navigate("/focus")}
            className="px-2.5 py-1 bg-bg-surface border border-border text-text-secondary hover:text-text-primary rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            Workspace
          </button>
          <button
            onClick={() => navigate("/focus/analytics")}
            className="px-2.5 py-1 bg-bg-surface border border-border text-text-secondary hover:text-text-primary rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            Analytics
          </button>

          {/* List vs Timeline vs Calendar views */}
          <div className="flex items-center bg-bg-surface/50 border border-border rounded-lg p-0.5">
            <button
              onClick={() => setViewMode("list")}
              className={`p-1 rounded-md transition-all cursor-pointer ${
                viewMode === "list" ? "bg-primary text-primary-text" : "text-text-secondary hover:text-text-primary"
              }`}
              title="List layout"
            >
              <List className="w-3 h-3" />
            </button>
            <button
              onClick={() => setViewMode("timeline")}
              className={`p-1 rounded-md transition-all cursor-pointer ${
                viewMode === "timeline" ? "bg-primary text-primary-text" : "text-text-secondary hover:text-text-primary"
              }`}
              title="Timeline flow"
            >
              <Activity className="w-3 h-3" />
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={`p-1 rounded-md transition-all cursor-pointer ${
                viewMode === "calendar" ? "bg-primary text-primary-text" : "text-text-secondary hover:text-text-primary"
              }`}
              title="Calendar grid"
            >
              <Calendar className="w-3 h-3" />
            </button>
          </div>

          {/* Export items */}
          <button
            onClick={handleExportCSV}
            disabled={history.length === 0}
            className="px-2.5 py-1 bg-bg-surface border border-border text-text-secondary hover:text-text-primary rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all disabled:opacity-20 cursor-pointer"
          >
            <FileSpreadsheet className="w-3 h-3 text-emerald-500" />
            <span>CSV</span>
          </button>
          <button
            onClick={handleExportPDF}
            disabled={history.length === 0}
            className="px-2.5 py-1 bg-bg-surface border border-border text-text-secondary hover:text-text-primary rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all disabled:opacity-20 cursor-pointer"
          >
            <FileText className="w-3 h-3 text-teal-500" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* Print Only Header */}
      <div className="hidden print:block text-black text-center mb-6">
        <h1 className="text-xl font-bold">CleverPrep Study Sessions Report</h1>
        <p className="text-xs text-gray-600">Generated on {new Date().toLocaleDateString()}</p>
      </div>

      {/* 2. Global Filters row - Compact & Clean */}
      {history.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-bg-surface/30 border border-border/60 p-2.5 rounded-xl mb-4 print:hidden">
          <div className="relative">
            <Search className="absolute left-2.5 top-2 w-3 h-3 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search goals..."
              className="w-full pl-7.5 pr-2.5 py-1 bg-bg-surface border border-border rounded-lg text-[10px] placeholder-text-muted text-text-primary focus:outline-none focus:border-primary/50 transition-all font-semibold"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-2.5 top-2 w-3 h-3 text-text-muted" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-7.5 pr-2 py-1 bg-bg-surface border border-border rounded-lg text-[10px] text-text-secondary focus:outline-none focus:border-primary/50 cursor-pointer font-bold"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="relative">
            <Compass className="absolute left-2.5 top-2 w-3 h-3 text-text-muted" />
            <select
              value={activityFilter}
              onChange={(e) => setActivityFilter(e.target.value)}
              className="w-full pl-7.5 pr-2 py-1 bg-bg-surface border border-border rounded-lg text-[10px] text-text-secondary focus:outline-none focus:border-primary/50 cursor-pointer font-bold"
            >
              <option value="all">All Activities</option>
              {uniqueActivities.map(act => (
                <option key={act} value={act}>{act}</option>
              ))}
            </select>
          </div>

          <div className="relative">
            <ArrowUpDown className="absolute left-2.5 top-2 w-3 h-3 text-text-muted" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full pl-7.5 pr-2 py-1 bg-bg-surface border border-border rounded-lg text-[10px] text-text-secondary focus:outline-none focus:border-primary/50 cursor-pointer font-bold"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="duration-desc">Longest Session</option>
              <option value="duration-asc">Shortest Session</option>
            </select>
          </div>
        </div>
      )}

      {/* 3. Main SaaS Symmetrical Grid Layout */}
      {history.length === 0 ? (
        /* Empty state block matching specs */
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-300 max-w-sm mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-bg-surface border border-border flex items-center justify-center mb-4">
            <Compass className="w-6 h-6 text-text-muted animate-pulse" />
          </div>
          <h3 className="text-sm font-extrabold text-text-primary">Your study journal is empty</h3>
          <p className="text-[11px] text-text-muted leading-relaxed font-semibold mt-1.5 mb-6">
            Complete focus sessions to record study metrics, milestones, and environment preferences.
          </p>
          <button
            onClick={() => navigate("/focus")}
            className="px-5 py-2 bg-primary hover:bg-primary-hover text-primary-text rounded-xl text-xs font-extrabold shadow-md cursor-pointer transition-all"
          >
            Start Focus Block
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[230px_1fr_240px] gap-5.5 w-full max-w-[1550px] mx-auto items-start pb-8">
          
          {/* ========================================== */}
          {/* COLUMN 1: LEFT STATISTICS SIDEBAR */}
          {/* ========================================== */}
          <div className="flex flex-col gap-3.5 order-2 lg:order-1">
            <h4 className="text-[8px] font-black uppercase tracking-widest text-text-muted text-left px-1">Metrics Sidebar</h4>
            
            {/* Focus Hours Card */}
            <div className="bg-bg-surface/35 border border-border/60 hover:border-border/90 p-3 rounded-xl shadow-xs text-left transition-all duration-205 hover:-translate-y-px">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <span className="text-[8.5px] font-black uppercase tracking-wider text-text-muted leading-none">Focus Hours</span>
              </div>
              <h3 className="text-sm font-black text-text-primary mt-1 leading-none">{totalHours} hrs</h3>
              <p className="text-[8px] font-bold text-text-muted mt-1.5 leading-none">{totalSessions} Focus Blocks logged</p>
            </div>

            {/* Streak Card */}
            <div className="bg-bg-surface/35 border border-border/60 hover:border-border/90 p-3 rounded-xl shadow-xs text-left transition-all duration-205 hover:-translate-y-px">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-6 h-6 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <span className="text-[8.5px] font-black uppercase tracking-wider text-text-muted leading-none">Active Streak</span>
              </div>
              <h3 className="text-sm font-black text-text-primary mt-1 leading-none">{currentStreak} Days</h3>
              <p className="text-[8px] font-bold text-text-muted mt-1.5 leading-none">Personal Best: {longestStreak} Days</p>
            </div>

            {/* Deep Work Hours Card */}
            <div className="bg-bg-surface/35 border border-border/60 hover:border-border/90 p-3 rounded-xl shadow-xs text-left transition-all duration-205 hover:-translate-y-px">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-6 h-6 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                  <Award className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <span className="text-[8.5px] font-black uppercase tracking-wider text-text-muted leading-none">Deep Work</span>
              </div>
              <h3 className="text-sm font-black text-text-primary mt-1 leading-none">{deepWorkHours} hrs</h3>
              <p className="text-[8px] font-bold text-text-muted mt-1.5 leading-none">Blocks longer than 25m</p>
            </div>

            {/* Acoustics Card */}
            <div className="bg-bg-surface/35 border border-border/60 hover:border-border/90 p-3 rounded-xl shadow-xs text-left transition-all duration-205 hover:-translate-y-px">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-6 h-6 rounded-lg bg-fuchsia-500/10 flex items-center justify-center">
                  <Music4 className="w-3.5 h-3.5 text-fuchsia-400" />
                </div>
                <span className="text-[8.5px] font-black uppercase tracking-wider text-text-muted leading-none">Acoustics</span>
              </div>
              <h3 className="text-xs font-black text-text-primary mt-1 truncate leading-tight">{mostUsedEnv}</h3>
              <p className="text-[8px] font-bold text-text-muted mt-1.5 leading-none">Most frequently selected environment</p>
            </div>
          </div>

          {/* ========================================== */}
          {/* COLUMN 2: CENTER CALENDAR / DATA VIEW */}
          {/* ========================================== */}
          <div className="order-1 lg:order-2 flex-1">
            {viewMode === "calendar" ? (
              renderCalendar()
            ) : viewMode === "timeline" ? (
              renderTimeline()
            ) : filteredHistory.length === 0 ? (
              <div className="text-center py-20 bg-bg-surface/30 border border-border/60 rounded-xl text-text-muted text-xs font-semibold">
                No study sessions matched your filter criteria.
              </div>
            ) : (
              /* Premium grid card layout (List view) */
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 animate-in fade-in duration-300 pb-8 text-left">
                {filteredHistory.map((item, idx) => {
                  const rate = Math.round((item.completedDuration / item.totalDuration) * 100);
                  const isCompleted = item.completionStatus === "Completed";
                  
                  let envIcon = "🎧";
                  if (item.environment.includes("Forest")) envIcon = "🌲";
                  else if (item.environment.includes("Ocean") || item.environment.includes("Rain")) envIcon = "🌊";
                  else if (item.environment.includes("Cafe")) envIcon = "☕";

                  return (
                    <div 
                      key={item.id || idx}
                      className="bg-bg-surface/30 border border-border hover:border-primary/25 p-3 rounded-xl flex flex-col justify-between transition-all duration-200 hover:-translate-y-px"
                    >
                      <div>
                        {/* Header info */}
                        <div className="flex items-center justify-between mb-2.5 shrink-0">
                          <span className="text-[8px] font-black text-text-muted font-mono tracking-wider">{item.date} • {item.startTime}</span>
                          <span className={`px-1.5 py-0.5 rounded-full text-[7px] font-black uppercase tracking-wider border ${
                            isCompleted 
                              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400" 
                              : "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-455"
                          }`}>
                            {item.completionStatus}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 mb-2 shrink-0">
                          <span className="text-xs select-none">{envIcon}</span>
                          <h4 className="text-xs font-extrabold text-text-primary truncate max-w-[130px]" title={item.goal}>
                            {item.goal}
                          </h4>
                        </div>

                        <div className="space-y-1 mt-2">
                          <div className="flex justify-between text-[8px] font-bold text-text-muted">
                            <span>Activity:</span>
                            <span className="text-text-secondary truncate max-w-[100px]">{item.activity}</span>
                          </div>
                          <div className="flex justify-between text-[8px] font-bold text-text-muted">
                            <span>Atmosphere:</span>
                            <span className="text-text-secondary truncate max-w-[100px]">{item.environment}</span>
                          </div>
                          {item.notes && (
                            <div className="text-[7.5px] text-text-muted mt-1.5 bg-bg-base/30 border border-border p-1.5 rounded-lg italic truncate">
                              "{item.notes}"
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-border/50">
                        <div className="flex items-center justify-between gap-4 mb-2">
                          <div className="text-left">
                            <span className="text-[7.5px] text-text-muted font-bold block leading-none">Duration</span>
                            <span className="text-[10px] font-mono font-black text-text-primary mt-1 block leading-none">
                              {item.completedDuration}m / {item.totalDuration}m
                            </span>
                          </div>

                          {/* Mini circular progress ring */}
                          <div className="relative shrink-0 flex items-center justify-center" title={`${rate}% Completeness`}>
                            <svg className="w-7 h-7 transform -rotate-90 select-none" viewBox="0 0 32 32">
                              <circle cx="16" cy="16" r="12" fill="none" stroke="var(--color-border)" strokeWidth="2.5" />
                              <circle cx="16" cy="16" r="12" fill="none" stroke={isCompleted ? "#10D28F" : "#ef4444"} strokeWidth="2.5" 
                                strokeDasharray={75.4} strokeDashoffset={75.4 - (75.4 * Math.min(100, rate)) / 100}
                                strokeLinecap="round" className="transition-all duration-300" />
                            </svg>
                            <span className="absolute text-[7.5px] font-mono font-black text-text-secondary">{rate}%</span>
                          </div>
                        </div>

                        {/* Actions panel */}
                        <div className="flex items-center justify-between gap-1 pt-1.5 border-t border-border/40 print:hidden">
                          <button
                            onClick={() => handleDuplicate(item)}
                            className="px-2 py-0.5 bg-bg-surface border border-border text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover rounded-md text-[8px] font-extrabold uppercase tracking-widest flex items-center gap-1 transition-colors cursor-pointer"
                            title="Quick Resume"
                          >
                            <Copy className="w-2.5 h-2.5 text-text-muted" />
                            <span>Resume</span>
                          </button>

                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1 text-text-muted hover:text-rose-500 hover:bg-rose-500/10 rounded-md transition-colors cursor-pointer"
                            title="Delete log"
                            aria-label="Delete entry"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ========================================== */}
          {/* COLUMN 3: RIGHT COMPACT SIDEBAR WIDGETS */}
          {/* ========================================== */}
          <div className="flex flex-col gap-3.5 order-3 text-left">
            <h4 className="text-[8px] font-black uppercase tracking-widest text-text-muted px-1">Widgets & Insights</h4>

            {/* Target Card */}
            <div className="bg-bg-surface/35 border border-border/60 p-3 rounded-xl shadow-xs">
              <span className="text-[8.5px] font-black uppercase tracking-wider text-text-muted flex items-center gap-1.5 leading-none">
                <Target className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                <span>Weekly Target</span>
              </span>
              <div className="flex items-center justify-between text-[9px] font-extrabold mt-2 leading-none text-text-primary">
                <span>Week Progress</span>
                <span className="font-mono">{totalHours} / 5.0h</span>
              </div>
              <div className="w-full rounded-full h-1 bg-bg-base border border-border/40 mt-1.5 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-primary to-accent h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (parseFloat(totalHours) / 5) * 100)}%` }}
                />
              </div>
            </div>

            {/* Focus Distribution */}
            {getActivityDistribution().length > 0 && (
              <div className="bg-bg-surface/35 border border-border/60 p-3 rounded-xl shadow-xs flex flex-col gap-2">
                <span className="text-[8.5px] font-black uppercase tracking-wider text-text-muted leading-none">Focus Area Distribution</span>
                <div className="space-y-1.5 mt-0.5">
                  {getActivityDistribution().map((dist, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-[8px] font-bold text-text-secondary">
                        <span className="truncate max-w-[120px]">{dist.activity}</span>
                        <span className="font-mono">{dist.pct}%</span>
                      </div>
                      <div className="w-full h-1 bg-bg-base border border-border/20 rounded-full overflow-hidden">
                        <div 
                          className="bg-primary h-full rounded-full transition-all"
                          style={{ width: `${dist.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Heatmap Legend */}
            <div className="bg-bg-surface/35 border border-border/60 p-3 rounded-xl shadow-xs">
              <span className="text-[8.5px] font-black uppercase tracking-wider text-text-muted leading-none">Study Rhythms</span>
              <div className="flex flex-col gap-1.5 mt-2">
                <div className="flex items-center gap-1.5 text-[8.5px] font-bold text-text-secondary">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 border border-emerald-500/20" />
                  <span>Completed Sessions</span>
                </div>
                <div className="flex items-center gap-1.5 text-[8.5px] font-bold text-text-secondary">
                  <span className="w-2 h-2 rounded-full bg-rose-500 border border-rose-500/20" />
                  <span>Cancelled Sessions</span>
                </div>
                <p className="text-[7.5px] font-bold text-text-muted italic mt-1.5 border-t border-border/30 pt-1.5">
                  "Deep focus is the ultimate superpower."
                </p>
              </div>
            </div>

            {/* Best Record */}
            <div className="bg-bg-surface/35 border border-border/60 p-3 rounded-xl shadow-xs">
              <div className="flex items-center gap-1.5 text-[8.5px] font-black uppercase tracking-wider text-text-muted leading-none">
                <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                <span>Personal Records</span>
              </div>
              <div className="space-y-1.5 mt-2.5">
                <div className="flex items-center justify-between text-[8.5px] font-bold text-text-secondary">
                  <span>Best Day:</span>
                  <span className="text-text-primary font-mono">{bestDay}</span>
                </div>
                <div className="flex items-center justify-between text-[8.5px] font-bold text-text-secondary">
                  <span>Avg Session:</span>
                  <span className="text-text-primary font-mono">{avgSession} mins</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default FocusHistoryPage;
