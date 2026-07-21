import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { 
  FileText, 
  BookOpen, 
  BrainCircuit, 
  Play, 
  ArrowRight, 
  Sparkles, 
  Headphones, 
  Plus, 
  Award, 
  TrendingUp, 
  Clock, 
  ChevronRight,
  Bookmark,
  Calendar,
  Activity,
  Zap,
  Smile,
  Target
} from "lucide-react";
import Spinner from "../../components/common/Spinner";
import progressService from "../../services/progressService";
import focusStorage from "../../services/FocusStorage";
import { useAuth } from "../../context/AuthContext";
import { useTour } from "../../context/TourContext";
import FocusDashboardCard from "../../components/focus/FocusDashboardCard";
import moment from "moment";

const DashboardPage = () => {
  const { user } = useAuth();
  const { showWelcomeModal, setShowWelcomeModal, skipTour } = useTour();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [stats, setStats] = useState({});
  const [goals, setGoals] = useState({});
  const [loading, setLoading] = useState(true);
  const fetchInitiated = useRef(false);

  const [globalTheme, setGlobalTheme] = useState(() => localStorage.getItem("cleverprep_global_theme") || "white");

  useEffect(() => {
    const handleThemeChange = () => {
      setGlobalTheme(localStorage.getItem("cleverprep_global_theme") || "white");
    };
    window.addEventListener("cleverprep-global-theme-changed", handleThemeChange);
    return () => window.removeEventListener("cleverprep-global-theme-changed", handleThemeChange);
  }, []);

  useEffect(() => {
    if (fetchInitiated.current) return;
    fetchInitiated.current = true;

    const fetchDashboardData = async () => {
      try {
        const data = await progressService.getDashboardData();
        setDashboardData(data?.data || data);
      } catch (error) {
        toast.error("Failed to fetch dashboard data.");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
    setStats(focusStorage.loadStats());
    setGoals(focusStorage.loadDailyGoals());
  }, []);

  if (loading) return <Spinner />;

  const displayName = 
    user?.username || 
    user?.firstName || 
    (user?.name && typeof user.name === 'string' ? user.name.split(' ')[0] : "") || 
    "Learner";

  const totalDocsCount = dashboardData?.overview?.totalDocuments || 0;
  if (!dashboardData || !dashboardData.overview || totalDocsCount === 0) {
    return (
      <div className="max-w-4xl mx-auto min-h-[80vh] flex flex-col items-center justify-center p-6 text-center space-y-8 select-none">
        <div className="relative">
          <div className="absolute inset-0 bg-emerald-500/10 rounded-3xl blur-xl" />
          <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 flex items-center justify-center shadow-md animate-pulse">
            <Sparkles className="w-10 h-10 text-emerald-500" strokeWidth={1.5} />
          </div>
        </div>
        
        <div className="space-y-3">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-display">
            Ready to learn, {displayName}?
          </h2>
          <p className="text-slate-500 max-w-md mx-auto text-sm sm:text-base leading-relaxed">
            Welcome to CleverPrep! Upload a lecture note, textbook page, or document PDF to generate premium podcasts, flashcard sets, and mock quizzes instantly.
          </p>
        </div>

        <Link 
          to="/documents" 
          className="inline-flex items-center gap-2 px-8 h-12 bg-slate-900 hover:bg-slate-800 text-white rounded-full font-bold text-sm shadow-lg shadow-slate-900/10 hover:shadow-xl transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer tour-upload-section"
        >
          <Plus className="w-4.5 h-4.5 text-white" strokeWidth={2.5} />
          Upload Your First Document
        </Link>

        {showWelcomeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div 
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 border border-slate-100 text-center animate-in fade-in zoom-in-95 duration-200"
              role="dialog"
              aria-modal="true"
              aria-labelledby="welcome-modal-title"
            >
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/20">
                <Sparkles className="w-8 h-8" />
              </div>
              
              <h3 id="welcome-modal-title" className="text-xl sm:text-2xl font-black text-slate-900 mb-3 font-display">
                Welcome to CleverPrep!
              </h3>
              
              <p className="text-xs sm:text-sm text-slate-555 leading-relaxed font-semibold mb-8 max-w-sm mx-auto">
                Transform your textbooks, lecture notes, and PDFs into AI summaries, interactive quizzes, flashcard decks, and revision podcasts.
                <br /><br />
                Upload your first document to begin your customized learning path.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => skipTour()}
                  className="flex-1 h-11 px-5 border border-slate-200 text-slate-555 hover:text-slate-800 hover:bg-slate-55 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Skip
                </button>
                <button
                  onClick={() => {
                    setShowWelcomeModal(false);
                    navigate("/documents");
                  }}
                  className="flex-1 h-11 px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-lg shadow-slate-900/10 transition-all cursor-pointer"
                >
                  Upload First Document
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const overview = dashboardData.overview || {};
  const recentActivity = dashboardData.recentActivity || {};

  const recentDocs = Array.isArray(recentActivity.documents) 
    ? recentActivity.documents.filter(doc => doc && typeof doc === 'object') 
    : [];

  const activeDocument = recentDocs.length > 0 ? recentDocs[0] : null;

  const handleGoalToggle = (key, completedVal, targetVal) => {
    if (completedVal >= targetVal) return;
    const updated = { ...goals, [key]: completedVal + 1 };
    setGoals(updated);
    focusStorage.saveDailyGoals(updated);
  };

  // Theme variable class definitions using design tokens
  const pageTextClass = "text-text-primary";
  const heroWrapperClass = "bg-bg-surface border-border text-text-primary";
  const heroTitleTextClass = "text-text-primary";
  const heroMetaTextClass = "text-text-secondary";
  const continueBtnClass = "bg-primary hover:bg-primary-hover text-primary-text shadow-theme-md";
  const uploadBtnClass = "bg-bg-base hover:bg-bg-surface-hover text-text-secondary border-border";
  const cardClass = "bg-bg-surface border-border hover:border-border-hover text-text-primary shadow-theme-sm";
  const cardTitleClass = "text-text-muted";
  const cardContentTextClass = "text-text-primary";
  const cardMetaTextClass = "text-text-secondary";
  const cardBorderClass = "border-border";
  const cardListItemBgClass = "hover:bg-bg-surface-hover";
  const progressTrackBgClass = "bg-bg-base";
  const openBtnClass = "bg-bg-surface hover:bg-bg-surface-hover text-text-secondary border-border";
  const streakCardIconBg = "bg-accent/15 border border-accent/30";

  return (
    <div className={`max-w-[1500px] mx-auto px-8 md:px-10 py-7 space-y-6 select-none font-display ${pageTextClass}`}>
      
      {/* 1. Calm, Premium Workspace Header */}
      <div className={`relative rounded-2xl p-6 shadow-xs overflow-hidden flex flex-col md:flex-row items-center justify-between gap-5 border ${heroWrapperClass}`}>
        <div className="absolute inset-0 bg-slate-50/10 pointer-events-none" />
        
        <div className="space-y-1 relative z-10 text-center md:text-left">
          <h1 className={`text-xl sm:text-2xl font-extrabold tracking-tight leading-snug flex items-center justify-center md:justify-start gap-1.5 ${heroTitleTextClass}`}>
            Good Evening, {displayName} 👋
          </h1>
          {activeDocument ? (
            <p className={`text-[13px] font-semibold leading-relaxed ${heroMetaTextClass}`}>
              Active flow: Continue learning <span className="font-bold underline text-slate-800">{activeDocument.title}</span>
            </p>
          ) : (
            <p className={`text-[13px] font-semibold leading-relaxed ${heroMetaTextClass}`}>
              Start your study flow by uploading a PDF notes document.
            </p>
          )}
          
          <div className="flex items-center justify-center md:justify-start gap-3 mt-1.5 text-[10px] font-bold uppercase tracking-wider select-none text-slate-400">
            <span className="flex items-center gap-1">🔥 {stats.currentStreak || 0}d Streak</span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
            <span className="flex items-center gap-1">⏱️ {dashboardData.focusMinutesToday || 0}m logged today</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 relative z-10">
          {activeDocument && (
            <Link
              to={`/documents/${activeDocument._id}`}
              className={`flex items-center justify-center gap-1.5 px-5 h-11 rounded-xl font-bold text-xs transition-all hover:scale-[1.015] shadow-md ${continueBtnClass}`}
            >
              <Play className="w-3.5 h-3.5 fill-current text-white" />
              <span>Continue Learning</span>
            </Link>
          )}
          <Link
            to="/documents"
            className={`flex items-center justify-center gap-1.5 px-5 h-11 rounded-xl font-bold text-xs border shadow-xs transition-all hover:scale-[1.015] ${uploadBtnClass}`}
          >
            <Plus className="w-4.5 h-4.5" strokeWidth={2.5} />
            <span>Upload Document</span>
          </Link>
        </div>
      </div>

      {/* 2. Cohesive Grid Layout: Left Study Block, Right Analytics panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start select-none">
        
        {/* Left Column: Smart Focus Space, Recent learning activity, Quick Actions (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Smart Focus centerpiece (attracts primary attention) */}
          <FocusDashboardCard />

          {/* Recent documents activity */}
          <div className={`rounded-xl p-5 text-left border ${cardClass}`}>
            <div className={`flex items-center justify-between border-b pb-2 mb-3 ${cardBorderClass}`}>
              <span className={`text-[11px] font-black uppercase tracking-widest ${cardTitleClass}`}>Recent Activity</span>
              <Link to="/documents" className="text-[10px] font-black text-emerald-600 hover:text-emerald-700 uppercase tracking-widest flex items-center gap-0.5">
                <span>+ View All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            
            {recentDocs.length > 0 ? (
              <div className="space-y-2">
                {recentDocs.slice(0, 3).map((doc) => (
                  <div key={doc._id} className={`flex items-center justify-between gap-4 p-1.5 rounded-lg transition-colors group ${cardListItemBgClass}`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8.5 h-8.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 text-slate-400 group-hover:text-emerald-600 group-hover:bg-emerald-50 transition-colors">
                        <FileText className="w-4.5 h-4.5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className={`text-[13px] font-extrabold truncate max-w-[280px] group-hover:text-emerald-700 ${cardContentTextClass}`} title={doc.title}>
                          {doc.title || "Untitled Document"}
                        </h4>
                        <span className={`text-[10px] font-bold block ${cardMetaTextClass}`}>
                          Last opened • {moment(doc.lastAccessed || doc.createdAt).fromNow()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider px-2 py-0.5 bg-slate-100 rounded-md">Active</span>
                      <Link 
                        to={`/documents/${doc._id}`}
                        className={`px-3.5 py-1.5 font-bold text-[10px] rounded-lg tracking-wider uppercase transition-all shadow-xs ${openBtnClass}`}
                      >
                        Open
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className={`text-[11px] italic py-2 ${cardMetaTextClass}`}>No library files uploaded.</p>
            )}
          </div>

          {/* Quick Actions Launcher Grid */}
          <div className={`rounded-xl p-5 text-left border ${cardClass}`}>
            <h3 className={`text-[11px] font-black uppercase tracking-widest border-b pb-2 mb-3 ${cardBorderClass}`}>
              Productivity Launcher
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: "Read Summary", icon: <FileText className="w-4 h-4 text-blue-500" />, path: "/documents" },
                { label: "Flashcards", icon: <BookOpen className="w-4 h-4 text-indigo-500" />, path: "/flashcards" },
                { label: "Listen Podcast", icon: <Headphones className="w-4 h-4 text-emerald-500" />, path: "/documents" },
                { label: "Practice Quiz", icon: <BrainCircuit className="w-4 h-4 text-purple-500" />, path: "/documents" },
                { label: "Study Notes", icon: <Bookmark className="w-4 h-4 text-orange-500" />, path: "/documents" },
                { label: "Focus Workspace", icon: <Clock className="w-4 h-4 text-[#10D28F]" />, path: "/focus" }
              ].map((act, idx) => (
                <Link
                  key={idx}
                  to={act.path}
                  className={`flex items-center gap-3 px-4 h-12 font-bold text-[13px] rounded-xl border transition-all hover:scale-[1.01] hover:-translate-y-px duration-250 cursor-pointer ${openBtnClass}`}
                >
                  {act.icon}
                  <span>{act.label}</span>
                </Link>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Unified Study Progress, Daily Targets, Streaks Analytics (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Unified Study Progress Panel (combines kpis + goals) */}
          <div className={`rounded-xl p-5 shadow-xs text-left border ${cardClass}`}>
            <h3 className={`text-[11px] font-black uppercase tracking-widest border-b pb-2 mb-3 ${cardBorderClass}`}>
              Study Progress
            </h3>
            
            {/* Unified KPI Grid */}
            <div className={`grid grid-cols-2 gap-4 pb-4 border-b mb-4 select-none ${cardBorderClass}`}>
              <div className="text-left">
                <span className={`text-[10px] font-bold uppercase tracking-wider block ${cardTitleClass}`}>Today's Focus</span>
                <span className={`text-base font-extrabold font-mono block mt-1 ${cardContentTextClass}`}>{dashboardData.focusMinutesToday || 0}m</span>
              </div>
              <div className={`text-left border-l pl-4 ${cardBorderClass}`}>
                <span className={`text-[10px] font-bold uppercase tracking-wider block ${cardTitleClass}`}>Current Streak</span>
                <span className="text-base font-extrabold font-mono text-amber-500 block mt-1">{stats.currentStreak || 0}d</span>
              </div>
              <div className={`text-left pt-2 border-t ${cardBorderClass}`}>
                <span className={`text-[10px] font-bold uppercase tracking-wider block ${cardTitleClass}`}>Documents</span>
                <span className={`text-base font-extrabold font-mono block mt-1 ${cardContentTextClass}`}>{overview.totalDocuments || 0}</span>
              </div>
              <div className={`text-left pt-2 border-t border-l pl-4 ${cardBorderClass}`}>
                <span className={`text-[10px] font-bold uppercase tracking-wider block ${cardTitleClass}`}>Avg Score</span>
                <span className={`text-base font-extrabold font-mono block mt-1 ${cardContentTextClass}`}>{overview.averageScore || 0}%</span>
              </div>
            </div>

            {/* Daily Goals Progress Bars */}
            <div className="space-y-3.5 select-none">
              <span className={`text-[10px] font-black uppercase tracking-widest block mb-2.5 ${cardTitleClass}`}>Daily Targets Progress</span>
              {[
                { label: "Duration Studied (mins)", key: "minutesCompleted", completed: goals.minutesCompleted || 0, target: goals.minutesTarget || 120 },
                { label: "Sessions Completed", key: "sessionsCompleted", completed: goals.sessionsCompleted || 0, target: goals.sessionsTarget || 4 },
                { label: "PDF Documents Read", key: "pdfsCompleted", completed: goals.pdfsCompleted || 0, target: goals.pdfsTarget || 1 },
                { label: "Flashcards sets Reviewed", key: "flashcardsCompleted", completed: goals.flashcardsCompleted || 0, target: goals.flashcardsTarget || 1 }
              ].map((goal, idx) => {
                const rate = Math.round((goal.completed / goal.target) * 100);
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 leading-none">
                      <span className={cardMetaTextClass}>{goal.label}</span>
                      <button 
                        onClick={() => handleGoalToggle(goal.key, goal.completed, goal.target)}
                        className={`cursor-pointer transition-all hover:text-slate-800 ${rate >= 100 ? "text-[#10D28F]" : ""}`}
                        title="Click to increment manually"
                      >
                        {goal.completed}/{goal.target}
                      </button>
                    </div>
                    <div className={`w-full rounded-full h-1.5 overflow-hidden ${progressTrackBgClass}`}>
                      <div 
                        className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, rate)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Compact Streak canopy card */}
          <div className={`rounded-xl p-5 text-left shadow-xs flex flex-col justify-between min-h-[110px] border ${cardClass}`}>
            <span className={`text-[11px] font-black uppercase tracking-widest flex items-center gap-1.5 mb-2.5 ${cardTitleClass}`}>
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Streaks Canopy</span>
            </span>
            <div className="flex items-center gap-3.5">
              <span className="text-3xl select-none">🔥</span>
              <div>
                <h4 className={`text-[13px] font-extrabold leading-tight ${cardContentTextClass}`}>
                  Consistency Streak: {stats.currentStreak || 0}d
                </h4>
                <span className={`text-[10px] mt-1 font-semibold leading-relaxed block ${cardMetaTextClass}`}>
                  Your longest recorded streak is {stats.longestStreak || 0} days. Keep focus rhythms active!
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {showWelcomeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 border border-slate-100 text-center animate-in fade-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="welcome-modal-title-normal"
          >
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/20">
              <Sparkles className="w-8 h-8" />
            </div>
            
            <h3 id="welcome-modal-title-normal" className="text-xl sm:text-2xl font-black text-slate-900 mb-3 font-display">
              Welcome to CleverPrep!
            </h3>
            
            <p className="text-xs sm:text-sm text-slate-555 leading-relaxed font-semibold mb-8 max-w-sm mx-auto">
              Transform your textbooks, lecture notes, and PDFs into AI summaries, interactive quizzes, flashcard decks, and revision podcasts.
              <br /><br />
              Upload your first document to begin your customized learning path.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => skipTour()}
                className="flex-1 h-11 px-5 border border-slate-200 text-slate-555 hover:text-slate-800 hover:bg-slate-55 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Skip
              </button>
              <button
                onClick={() => {
                  setShowWelcomeModal(false);
                  navigate("/documents");
                }}
                className="flex-1 h-11 px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-550/20 transition-all cursor-pointer"
              >
                Upload First Document
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;