import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useStudySession from "../../hooks/useStudySession";
import focusStorage from "../../services/FocusStorage";
import { Play, Sparkles, Clock, Target, ArrowRight, Zap } from "lucide-react";

export const FocusDashboardCard = () => {
  const navigate = useNavigate();
  const { session, createSession, startSession, setIsOverlayOpen } = useStudySession();

  const [stats, setStats] = useState({});
  const [history, setHistory] = useState([]);
  const [goals, setGoals] = useState({});

  useEffect(() => {
    setStats(focusStorage.loadStats());
    setHistory(focusStorage.loadHistory());
    setGoals(focusStorage.loadDailyGoals());
  }, [session]);

  const isSessionActive = session && ["created", "running", "paused"].includes(session.status);

  // Computations
  const todayDateStr = new Date().toLocaleDateString("en-CA");
  const todayMins = history
    .filter(h => h.date === todayDateStr && h.status === "completed")
    .reduce((sum, h) => sum + Math.round(h.completedDuration / 60), 0);

  const goalMinutes = goals.minutesTarget || 120;
  const pct = Math.min(100, Math.round((todayMins / goalMinutes) * 100));

  const handleStartFocus = () => {
    if (isSessionActive) {
      navigate("/focus");
      return;
    }
    // Create quick session defaults
    createSession({
      mode: "quick",
      duration: 25 * 60,
      activityType: "Quick Focus",
      goal: "Deep study block",
      source: "dashboard"
    });
    startSession();
    navigate("/focus");
  };

  return (
    <div className="bg-white border border-slate-200/85 rounded-xl p-4 shadow-xs hover:shadow-md transition-all duration-300 relative overflow-hidden select-none text-left flex flex-col justify-between min-h-[160px]">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-[#10D28F]" />
            <span>Smart Focus</span>
          </span>
          <span className="text-[10px] font-bold text-amber-500 flex items-center gap-0.5">
            <Zap className="w-3.5 h-3.5 text-amber-400 fill-current animate-pulse" />
            <span>{stats.currentStreak || 0}d Streak</span>
          </span>
        </div>

        <h4 className="text-xs font-bold text-slate-900 leading-tight">
          {isSessionActive 
            ? `Active: ${session.goal || "Deep study block"}` 
            : "Distraction-Free Study Window"}
        </h4>
        <p className="text-[10px] text-slate-500 mt-1 leading-relaxed max-w-[190px]">
          {isSessionActive
            ? "Your study session is currently running. Continue to log duration."
            : "Commit to focused blocks to generate diagnostics metrics."}
        </p>
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-3 mt-3">
        <div className="flex items-center gap-3">
          {/* Progress Ring */}
          <div className="relative shrink-0 flex items-center justify-center">
            <svg className="w-9 h-9 transform -rotate-90" viewBox="0 0 32 32">
              <circle cx="16" cy="16" r="13" fill="none" stroke="#f1f5f9" strokeWidth="2.5" />
              <circle cx="16" cy="16" r="13" fill="none" stroke="#10D28F" strokeWidth="2.5" 
                strokeDasharray={81.6} strokeDashoffset={81.6 - (81.6 * pct) / 100}
                strokeLinecap="round" className="transition-all duration-500" />
            </svg>
            <span className="absolute text-[8px] font-mono font-black text-slate-650">{pct}%</span>
          </div>

          <div>
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block leading-none">Today's Focus</span>
            <span className="text-xs font-mono font-bold text-slate-800 mt-1 block leading-none">{todayMins}m / {goalMinutes}m</span>
          </div>
        </div>

        <button
          onClick={handleStartFocus}
          className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer shadow-xs shrink-0"
        >
          <span>{isSessionActive ? "Continue" : "Start Focus"}</span>
          <ArrowRight className="w-3 h-3 text-[#10D28F]" />
        </button>
      </div>
    </div>
  );
};

export default FocusDashboardCard;
