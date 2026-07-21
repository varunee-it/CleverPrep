import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import focusStorage from "../../services/FocusStorage";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import {
  ArrowLeft,
  Calendar,
  Sparkles,
  TrendingUp,
  Award,
  Zap,
  Target,
  Clock,
  Compass,
  Smile,
  Activity,
  Heart,
  Music4,
  CheckCircle,
  Trophy,
  BookOpen,
  FileText
} from "lucide-react";

export const FocusAnalyticsPage = () => {
  const navigate = useNavigate();

  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({});
  const [records, setRecords] = useState({});
  const [achievements, setAchievements] = useState([]);
  const [goals, setGoals] = useState({});

  useEffect(() => {
    setHistory(focusStorage.loadHistory());
    setStats(focusStorage.loadStats());
    setRecords(focusStorage.loadPersonalRecords());
    setAchievements(focusStorage.loadAchievements());
    setGoals(focusStorage.loadDailyGoals());
  }, []);

  const hasData = history.length > 0;

  // Basic Metrics Derivations
  const totalMinutes = history.reduce((sum, item) => sum + (item.completedDuration || 0), 0);
  const totalHours = (totalMinutes / 3600).toFixed(1);
  const completedSessions = history.filter((item) => item.status === "completed" || item.completionStatus === "Completed");
  const completionRate =
    history.length > 0
      ? Math.round((completedSessions.length / history.length) * 100)
      : 0;

  const totalDocsCount = history.length;
  const longestSession = history.length > 0
    ? Math.round(Math.max(...history.map((h) => h.completedDuration || 0)) / 60)
    : 0;
  const avgSessionDuration = history.length > 0
    ? Math.round((totalMinutes / history.length) / 60)
    : 0;

  // Most Productive Day Calculation
  const getBestDay = () => {
    if (history.length === 0) return "N/A";
    const daysMap = { 0: "Sunday", 1: "Monday", 2: "Tuesday", 3: "Wednesday", 4: "Thursday", 5: "Friday", 6: "Saturday" };
    const counts = {};
    history.forEach((h) => {
      const d = new Date(h.createdAt).getDay();
      counts[d] = (counts[d] || 0) + 1;
    });
    let max = -1;
    let bestDayIdx = 0;
    Object.keys(counts).forEach((idx) => {
      if (counts[idx] > max) {
        max = counts[idx];
        bestDayIdx = parseInt(idx);
      }
    });
    return daysMap[bestDayIdx];
  };

  // Most Productive Hour
  const getMostProductiveHour = () => {
    if (history.length === 0) return "N/A";
    const hours = {};
    history.forEach((item) => {
      if (!item.startTime) return;
      const parts = item.startTime.split(" ");
      let hr = parseInt(item.startTime.split(":")[0]);
      if (parts[1] === "PM" && hr < 12) hr += 12;
      if (parts[1] === "AM" && hr === 12) hr = 0;
      hours[hr] = (hours[hr] || 0) + 1;
    });
    let best = 0;
    let max = 0;
    Object.keys(hours).forEach((h) => {
      if (hours[h] > max) {
        max = hours[h];
        best = parseInt(h);
      }
    });
    const formatted =
      best === 0
        ? "12 AM"
        : best === 12
          ? "12 PM"
          : best > 12
            ? `${best - 12} PM`
            : `${best} AM`;
    return formatted;
  };

  const bestDay = getBestDay();
  const peakHour = getMostProductiveHour();

  const aiInsightsList = [
    { text: `Your study focus blocks are most frequent on ${bestDay}s.` },
    { text: `You have a peak study concentration around ${peakHour}.` }
  ];

  // Weekly calculations
  const now = Date.now();
  const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
  const thisWeekMins = history
    .filter((h) => new Date(h.createdAt).getTime() > now - oneWeekMs)
    .reduce((sum, h) => sum + Math.round(h.completedDuration / 60), 0);
  const lastWeekMins = history
    .filter(
      (h) =>
        new Date(h.createdAt).getTime() <= now - oneWeekMs &&
        new Date(h.createdAt).getTime() > now - 2 * oneWeekMs
    )
    .reduce((sum, h) => sum + Math.round(h.completedDuration / 60), 0);

  const weeklyHours = (thisWeekMins / 60).toFixed(1);
  const lastWeeklyHours = (lastWeekMins / 60).toFixed(1);
  const weeklyHoursDiff = (weeklyHours - lastWeeklyHours).toFixed(1);
  const weeklyHoursPercent = lastWeeklyHours > 0 
    ? Math.round(((weeklyHours - lastWeeklyHours) / lastWeeklyHours) * 100)
    : 100;


  // Daily study duration over the last 30 days
  const get30DaysData = () => {
    const data = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const target = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const targetStr = target.toLocaleDateString("en-CA");
      const daySessions = history.filter((h) => h.date === targetStr);
      const mins = daySessions.reduce(
        (sum, item) => sum + Math.round(item.completedDuration / 60),
        0
      );
      data.push({
        name: target.toLocaleDateString([], { month: "short", day: "numeric" }),
        minutes: mins,
        sessions: daySessions.filter((s) => s.status === "completed").length
      });
    }
    return data;
  };

  const chartData = get30DaysData();
  const averageMinsLine = chartData.reduce((sum, d) => sum + d.minutes, 0) / (chartData.length || 1);

  // Time distribution by Activity type
  const getDistributionData = () => {
    const categories = {
      "PDF Reading": 0,
      "Flashcards": 0,
      "Quizzes": 0,
      "Podcasts": 0,
      "AI Notes": 0,
      "Focus Sessions": 0
    };

    history.forEach(item => {
      const act = item.activity.toLowerCase();
      const mins = Math.round(item.completedDuration / 60);
      if (act.includes("pdf") || act.includes("document") || act.includes("read")) {
        categories["PDF Reading"] += mins;
      } else if (act.includes("flashcard")) {
        categories["Flashcards"] += mins;
      } else if (act.includes("quiz") || act.includes("assess")) {
        categories["Quizzes"] += mins;
      } else if (act.includes("podcast") || act.includes("audio")) {
        categories["Podcasts"] += mins;
      } else if (act.includes("note")) {
        categories["AI Notes"] += mins;
      } else {
        categories["Focus Sessions"] += mins;
      }
    });

    const colors = ["#10D28F", "#3b82f6", "#818cf8", "#a78bfa", "#f59e0b", "#ec4899"];

    return Object.keys(categories)
      .map((key, idx) => ({
        name: key,
        value: categories[key] || (idx === 0 && history.length > 0 ? 15 : 0), // fallback visual
        color: colors[idx]
      }))
      .filter(item => item.value > 0);
  };

  const distributionData = getDistributionData();

  // Custom tooltips rendering for Area Line chart
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl shadow-2xl text-left select-none pointer-events-none">
          <p className="text-[9px] font-black uppercase text-[#10D28F] tracking-wider border-b border-slate-900 pb-1 mb-1">
            📅 {data.name}
          </p>
          <div className="space-y-0.5 text-[9px] font-bold text-slate-400">
            <div className="flex items-center justify-between gap-6">
              <span>Duration:</span>
              <span className="text-white font-mono">{data.minutes} mins</span>
            </div>
            <div className="flex items-center justify-between gap-6">
              <span>Sessions:</span>
              <span className="text-white font-mono">{data.sessions} Completed</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Sparklines calculations
  const renderSparkline = (dataArr, color) => {
    if (dataArr.length === 0) return null;
    const points = dataArr.map((v, i) => `${(i * 12)},${25 - (v / 180) * 20}`).join(" ");
    return (
      <svg className="w-16 h-7 overflow-visible" viewBox="0 0 72 25">
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          points={points}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  const getKPISparklines = () => {
    const today = new Date();
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const target = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const targetStr = target.toLocaleDateString("en-CA");
      const mins = history
        .filter((h) => h.date === targetStr)
        .reduce((sum, item) => sum + Math.round(item.completedDuration / 60), 0);
      data.push(mins);
    }
    return data;
  };

  const sparklineData = getKPISparklines();

  // Heatmap Grid Cells
  const renderHeatmap = () => {
    const now = new Date();
    const cols = [];
    for (let w = 11; w >= 0; w--) {
      const colDays = [];
      for (let d = 0; d < 7; d++) {
        const offset = w * 7 + (6 - d);
        const day = new Date(now.getTime() - offset * 24 * 60 * 60 * 1000);
        const dateStr = day.toLocaleDateString("en-CA");
        const daySessions = history.filter((h) => h.date === dateStr);
        const dayMins = daySessions.reduce(
          (sum, item) => sum + Math.round(item.completedDuration / 60),
          0
        );

        let colorClass = "bg-slate-900 border-slate-950";
        if (dayMins > 0 && dayMins <= 15)
          colorClass = "bg-emerald-950/80 border-emerald-900/40";
        else if (dayMins > 15 && dayMins <= 45)
          colorClass = "bg-emerald-800 border-emerald-700/60";
        else if (dayMins > 45) colorClass = "bg-[#10D28F] border-emerald-500/60";

        colDays.push(
          <div
            key={`${w}-${d}`}
            className={`w-3 h-3 border rounded-xs transition-all cursor-pointer ${colorClass}`}
            title={`${dateStr}: ${dayMins} mins focused (${daySessions.filter(s => s.status === 'completed').length} completed)`}
          />
        );
      }
      cols.push(
        <div key={w} className="flex flex-col gap-0.5">
          {colDays}
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1 max-w-full justify-center lg:justify-start">
        <div className="flex flex-col justify-between text-[8px] font-black text-slate-550 pr-1 h-[95px] select-none text-left">
          <span>Mon</span>
          <span>Wed</span>
          <span>Fri</span>
        </div>
        <div className="flex gap-0.5">{cols}</div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[150] bg-[#090E18] overflow-y-auto flex flex-col p-4 sm:p-6 font-display select-none text-white">
      
      {/* 1. Header Toolbar */}
      <div className="flex items-center justify-between border-b border-slate-900/60 pb-3 mb-5 shrink-0">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate("/dashboard")}
            className="p-1 bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 text-slate-405 hover:text-white rounded-lg transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#10D28F]"
            aria-label="Back"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          
          <div className="flex flex-col text-left">
            <h2 className="text-xs sm:text-sm font-extrabold text-white leading-tight">Focus Analytics</h2>
            <p className="text-[9px] font-bold text-slate-500 tracking-wider uppercase mt-0.5">Productivity Dashboard</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => navigate("/focus")}
            className="px-2.5 py-1 bg-slate-900/60 hover:bg-slate-800/85 border border-slate-800 hover:border-slate-750 text-slate-400 hover:text-white rounded-lg transition-all text-[9px] font-black uppercase tracking-wider cursor-pointer"
          >
            Workspace
          </button>
          <button
            onClick={() => navigate("/focus/history")}
            className="px-2.5 py-1 bg-slate-900/60 hover:bg-slate-800/85 border border-slate-800 hover:border-slate-750 text-slate-400 hover:text-white rounded-lg transition-all text-[9px] font-black uppercase tracking-wider cursor-pointer"
          >
            History Logs
          </button>
        </div>
      </div>

      {!hasData ? (
        /* Empty states */
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-300 max-w-sm mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4">
            <Activity className="w-6 h-6 text-slate-650 animate-pulse" />
          </div>
          <h3 className="text-xs font-extrabold text-white">No Focus Sessions Yet</h3>
          <p className="text-[10px] text-slate-550 leading-relaxed font-semibold mt-1 mb-5">
            Start your first Focus Session to unlock premium study insights, distribution metrics, streaks, and AI productivity coach recommendation cards.
          </p>
          <button
            onClick={() => navigate("/focus")}
            className="px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg text-xs font-extrabold shadow-lg shadow-emerald-500/20 cursor-pointer"
          >
            Start Focus Session
          </button>
        </div>
      ) : (
        <div className="space-y-4 pb-12 animate-in fade-in duration-300">
          
          {/* Section 1: Performance Overview (KPI Cards with Sparklines) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { 
                title: "Today's Focus", 
                value: `${history.filter(h => h.date === new Date().toLocaleDateString("en-CA")).reduce((sum, h) => sum + Math.round(h.completedDuration / 60), 0)}m`, 
                trend: "Daily target progress", 
                diff: "vs last week average", 
                sparkline: renderSparkline(sparklineData, "#10D28F"),
                icon: <Clock className="w-4 h-4 text-emerald-400" /> 
              },
              { 
                title: "Current Streak", 
                value: `${stats.currentStreak || 0} days`, 
                trend: `Best streak: ${stats.longestStreak || 0}d`, 
                diff: "consecutive study logs", 
                sparkline: renderSparkline([2, 3, 3, 4, 4, 4, stats.currentStreak || 0], "#f59e0b"),
                icon: <Zap className="w-4 h-4 text-amber-400 animate-pulse" /> 
              },
              { 
                title: "Weekly Focus", 
                value: `${weeklyHours} hrs`, 
                trend: weeklyHoursDiff >= 0 ? `↑ +${weeklyHoursPercent}%` : `↓ ${weeklyHoursPercent}%`, 
                diff: `${weeklyHoursDiff >= 0 ? '+' : ''}${weeklyHoursDiff}h difference`, 
                sparkline: renderSparkline([1, 2.5, 4, 3, 5.5, 6, weeklyHours], "#3b82f6"),
                icon: <TrendingUp className="w-4 h-4 text-blue-400" /> 
              },
              { 
                title: "Completion Rate", 
                value: `${completionRate}%`, 
                trend: `${completedSessions.length} logged`, 
                diff: `${history.length - completedSessions.length} cancelled blocks`, 
                sparkline: renderSparkline([50, 75, 60, 80, 70, 90, completionRate], "#ec4899"),
                icon: <CheckCircle className="w-4 h-4 text-pink-400" /> 
              }
            ].map((metric, idx) => (
              <div 
                key={idx}
                className="bg-[#111827]/40 border border-slate-900 p-4 rounded-xl flex flex-col justify-between shadow-sm transition-all hover:border-slate-800 hover:-translate-y-0.5 duration-200 text-left"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{metric.title}</span>
                  {metric.icon}
                </div>
                <div className="flex items-end justify-between gap-4 mt-3">
                  <div>
                    <span className="text-xl font-mono font-bold text-white leading-none">{metric.value}</span>
                    <div className="flex items-baseline gap-1 mt-1 text-[8px] font-extrabold text-[#10D28F]">
                      <span>{metric.trend}</span>
                      <span className="text-slate-500 font-semibold">{metric.diff}</span>
                    </div>
                  </div>
                  <div className="shrink-0 pb-1">{metric.sparkline}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Section 2 & 3: Focus Activity Chart & Study Distribution Pie Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
            
            {/* Interactive Area Line Chart */}
            <div className="bg-[#111827]/40 border border-slate-900 p-4.5 rounded-2xl backdrop-blur-md flex flex-col justify-between text-left">
              <div className="border-b border-slate-900 pb-2.5 mb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Focus Activity (30 Days)</h3>
                  <p className="text-[9px] text-slate-455 mt-0.5">Daily study durations and target achievements line chart</p>
                </div>
                <div className="text-[8px] font-black uppercase tracking-widest text-slate-550 border border-slate-850 px-2 py-0.5 rounded-lg bg-slate-950/20">
                  Last 30 Days
                </div>
              </div>

              <div className="w-full h-48 animate-in fade-in duration-500">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={chartData}
                    margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorMinutes" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10D28F" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#10D28F" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#111827" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      stroke="#475569" 
                      fontSize={8} 
                      tickLine={false} 
                      axisLine={false} 
                      dy={6}
                    />
                    <YAxis 
                      stroke="#475569" 
                      fontSize={8} 
                      tickLine={false} 
                      axisLine={false} 
                      dx={-6}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine y={averageMinsLine} stroke="#475569" strokeDasharray="3 3" label={{ value: "avg", fill: "#475569", fontSize: 8, position: "left" }} />
                    <ReferenceLine y={45} stroke="#3b82f6" strokeDasharray="3 3" label={{ value: "goal", fill: "#3b82f6", fontSize: 8, position: "left" }} />
                    <Area 
                      type="monotone" 
                      dataKey="minutes" 
                      stroke="#10D28F" 
                      strokeWidth={1.5}
                      fillOpacity={1} 
                      fill="url(#colorMinutes)" 
                      animationDuration={1000}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Study Distribution Pie Chart */}
            <div className="bg-[#111827]/40 border border-slate-900 p-4.5 rounded-2xl backdrop-blur-md flex flex-col justify-between text-left">
              <div className="border-b border-slate-900 pb-2.5 mb-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Study Distribution</h3>
                <p className="text-[9px] text-slate-455 mt-0.5 font-bold">Minutes allocated by module activities</p>
              </div>

              <div className="w-full h-40 relative flex items-center justify-center select-none">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={3}
                      dataKey="value"
                      animationDuration={800}
                    >
                      {distributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value} mins`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-3 gap-1 mt-2 text-[8px] font-black uppercase text-slate-450 border-t border-slate-900/60 pt-2 flex-wrap">
                {distributionData.map((d, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 truncate">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                    <span className="truncate max-w-[80px]">{d.name}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Section 4: Study Heatmap (GitHub Grid) */}
          <div className="bg-[#111827]/40 border border-slate-900 p-4 rounded-2xl backdrop-blur-md text-left">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1 mb-2 border-b border-slate-900 pb-2">
              <Calendar className="w-3.5 h-3.5 text-purple-400" />
              <span>Study Frequency Heatmap</span>
            </h3>
            <p className="text-[8px] text-slate-500 font-bold mb-3 leading-relaxed">
              Track consistency over the past 12 weeks. Darker green blocks represent higher focus durations.
            </p>
            {renderHeatmap()}
            
            <div className="flex items-center justify-end gap-1.5 mt-2.5 text-[8px] font-black uppercase text-slate-500 select-none">
              <span>Less</span>
              <div className="w-2.5 h-2.5 rounded-xs bg-slate-900 border border-slate-950" />
              <div className="w-2.5 h-2.5 rounded-xs bg-emerald-950/80 border border-emerald-900/40" />
              <div className="w-2.5 h-2.5 rounded-xs bg-emerald-800 border border-emerald-700/60" />
              <div className="w-2.5 h-2.5 rounded-xs bg-[#10D28F] border-emerald-500/60" />
              <span>More</span>
            </div>
          </div>

          {/* Section 5: Achievements (Duolingo Badges style) */}
          <div className="bg-[#111827]/40 border border-slate-900 p-4 rounded-2xl backdrop-blur-md text-left">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1 mb-4 border-b border-slate-900 pb-2">
              <Trophy className="w-3.5 h-3.5 text-yellow-400" />
              <span>Achievements Canopy</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { id: "first_session", title: "🌱 First Session", desc: "Logged focus block", reward: "+50 FP", pct: 100 },
                { id: "streak_7", title: "🔥 7 Day Streak", desc: "Daily focus streak", reward: "+150 Coins", pct: stats.currentStreak >= 7 ? 100 : Math.round((stats.currentStreak / 7) * 100) },
                { id: "sessions_30", title: "🌳 Forest Keeper", desc: "Logged 30 blocks", reward: "+100 FP", pct: Math.min(100, Math.round((history.length / 30) * 100)) },
                { id: "night_owl", title: "🌙 Night Owl", desc: "Studied after 12 AM", reward: "+80 Coins", pct: achievements.find(a => a.id === "night_owl") ? 100 : 0 }
              ].map((crit) => {
                const unlocked = achievements.find((a) => a.id === crit.id) || crit.pct === 100;
                
                // SVG Progress Ring circumference (r=14 -> 2 * PI * 14 = 87.9)
                const circ = 87.9;
                const offset = circ - (crit.pct / 100) * circ;

                return (
                  <div 
                    key={crit.id}
                    className={`p-3 border rounded-xl flex items-center gap-3.5 h-20 transition-all duration-300 hover:scale-[1.015] ${
                      unlocked 
                        ? "bg-[#111827]/80 border-slate-800 text-white hover:border-[#10D28F]" 
                        : "bg-slate-950/20 border-slate-900/60 text-slate-550 opacity-40 grayscale"
                    }`}
                  >
                    {/* circular SVG Badge progress */}
                    <div className="relative shrink-0 flex items-center justify-center">
                      <svg className="w-10 h-10 transform -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="14" fill="none" stroke="#111827" strokeWidth="2.5" />
                        <circle cx="18" cy="18" r="14" fill="none" stroke={unlocked ? "#10D28F" : "#ef4444"} strokeWidth="2.5" 
                          strokeDasharray={circ} strokeDashoffset={offset}
                          strokeLinecap="round" className="transition-all duration-500" />
                      </svg>
                      <span className="absolute text-[8px] font-black">{crit.pct}%</span>
                    </div>

                    <div className="min-w-0 text-left flex flex-col justify-between h-full py-0.5">
                      <div>
                        <h4 className="text-[10px] font-black leading-tight truncate">{crit.title}</h4>
                        <span className="text-[8px] font-bold text-slate-500 block leading-none mt-0.5">{crit.desc}</span>
                      </div>
                      <span className="text-[8px] font-black text-amber-500 leading-none">{crit.reward}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 6: Study Records (Meaningful milestones) */}
          <div className="bg-[#111827]/40 border border-slate-900 p-4 rounded-2xl backdrop-blur-md text-left">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1 mb-4 border-b border-slate-900 pb-2">
              <Award className="w-3.5 h-3.5 text-blue-400" />
              <span>Personal Study Records</span>
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { title: "Longest Session", value: `${longestSession} mins`, desc: "Single continuous focus", icon: "⏱️" },
                { title: "Best Focus Day", value: getBestDay(), desc: "Most productive study block", icon: "📅" },
                { title: "Peak Hour", value: getMostProductiveHour(), desc: "Highest focus concentration", icon: "⚡" },
                { title: "Streak Records", value: `${stats.longestStreak || 0} Days`, desc: "Streaks consistency canopy", icon: "🔥" },
                { title: "Total Study Hours", value: `${totalHours} hrs`, desc: "Accumulated study logged", icon: "🧠" }
              ].map((rec, idx) => (
                <div 
                  key={idx}
                  className="bg-slate-900/30 border border-slate-900 p-3 rounded-xl flex flex-col justify-between h-20 shadow-md transition-all hover:border-slate-800"
                >
                  <div className="flex items-center justify-between gap-1 border-b border-slate-950 pb-1 mb-1">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider truncate max-w-[80px]">{rec.title}</span>
                    <span className="text-xs shrink-0 select-none">{rec.icon}</span>
                  </div>
                  <div className="text-left mt-2">
                    <span className="text-xs font-black text-white font-mono leading-none block">{rec.value}</span>
                    <span className="text-[8px] font-bold text-slate-500 block leading-tight mt-0.5 truncate">{rec.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 7: AI Productivity Coach (Premium Recommendation Cards) */}
          <div className="bg-[#111827]/40 border border-slate-900 p-4 rounded-2xl backdrop-blur-md text-left">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1 mb-4 border-b border-slate-900 pb-2">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              <span>AI Productivity Coach</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {aiInsightsList.map((ins, idx) => (
                <div 
                  key={idx}
                  className="bg-slate-900/50 border border-slate-900 p-3.5 rounded-xl flex items-start gap-3.5 transition-all hover:bg-slate-900/70"
                >
                  <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-teal-400 animate-pulse" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Insight Advice</h4>
                    <p className="text-[11px] text-slate-200 font-extrabold leading-relaxed mt-1">{ins.text}</p>
                  </div>
                </div>
              ))}
              {/* Extra personalized tips cards */}
              <div className="bg-slate-900/50 border border-slate-900 p-3.5 rounded-xl flex items-start gap-3.5 transition-all hover:bg-slate-900/70">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                  <Target className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recommendation</h4>
                  <p className="text-[11px] text-slate-200 font-extrabold leading-relaxed mt-1">
                    Your focus blocks length averages {avgSessionDuration} minutes. Scheduling a 5-minute break now keeps information retention rates locked high.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

export default FocusAnalyticsPage;
