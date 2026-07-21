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
              
              <p className="text-xs sm:text-sm text-slate-550 leading-relaxed font-semibold mb-8 max-w-sm mx-auto">
                Transform your textbooks, lecture notes, and PDFs into AI summaries, interactive quizzes, flashcard decks, and revision podcasts.
                <br /><br />
                Upload your first document to begin your customized learning path.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => skipTour()}
                  className="flex-1 h-11 px-5 border border-slate-200 text-slate-555 hover:text-slate-800 hover:bg-slate-50 rounded-xl text-xs font-bold transition-all cursor-pointer"
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

  return (
    <div className="max-w-[1500px] mx-auto px-6 md:px-8 py-6 space-y-5 select-none font-display text-slate-850">
      
      {/* 1. Welcoming Hero Banner - Compact & Spacing Optimized */}
      <div className="relative rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 p-5 text-white shadow-md overflow-hidden flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-white/5 to-transparent pointer-events-none" />
        
        <div className="space-y-1 relative z-10 text-center md:text-left">
          <h1 className="text-lg sm:text-xl font-extrabold tracking-tight font-display flex items-center justify-center md:justify-start gap-1.5 leading-snug">
            Good Evening, {displayName} 👋
          </h1>
          {activeDocument ? (
            <p className="text-emerald-50 text-xs font-semibold leading-relaxed">
              Continue learning <span className="font-bold underline">{activeDocument.title}</span>
            </p>
          ) : (
            <p className="text-emerald-50 text-xs font-semibold leading-relaxed">
              Start your learning journey by studying a PDF notes document.
            </p>
          )}
          {activeDocument && (
            <p className="text-[10px] text-emerald-100/70 font-semibold leading-none">
              Last Activity • {moment(activeDocument.lastAccessed || activeDocument.createdAt).fromNow()}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0 relative z-10">
          {activeDocument && (
            <Link
              to={`/documents/${activeDocument._id}`}
              className="flex items-center justify-center gap-1 px-4 h-9 bg-white text-emerald-700 hover:text-emerald-800 rounded-xl font-bold text-xs shadow-xs hover:shadow-sm transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Continue Learning</span>
            </Link>
          )}
          <Link
            to="/documents"
            className="flex items-center justify-center gap-1.5 px-4 h-9 bg-emerald-700/30 border border-white/20 text-white hover:bg-emerald-700/50 rounded-xl font-bold text-xs shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            <span>Upload Document</span>
          </Link>
        </div>
      </div>

      {/* 2. Compact Statistics Dashboard Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 select-none">
        {[
          { title: "Today's Study", value: `${dashboardData.focusMinutesToday || 0} mins`, desc: "Focused block logged today", color: "text-emerald-600", icon: <Clock className="w-4 h-4 text-emerald-500" /> },
          { title: "Current Streak", value: `${stats.currentStreak || 0} days`, desc: "Streaks consistency calendar", color: "text-amber-500", icon: <Zap className="w-4 h-4 text-amber-500 animate-pulse" /> },
          { title: "Documents", value: overview.totalDocuments || 0, desc: "PDF files in library uploads", color: "text-blue-500", icon: <FileText className="w-4 h-4 text-blue-500" /> },
          { title: "Average Score", value: `${overview.averageScore || 0}%`, desc: "Quiz accuracy metric", color: "text-indigo-600", icon: <Award className="w-4 h-4 text-indigo-500" /> }
        ].map((stat, idx) => (
          <div key={idx} className="bg-white border border-slate-200/85 p-3.5 rounded-xl shadow-xs text-left flex items-start justify-between hover:border-slate-300 transition-all duration-200">
            <div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none">{stat.title}</span>
              <span className={`text-base font-extrabold font-mono block mt-1.5 leading-none ${stat.color}`}>{stat.value}</span>
              <span className="text-[8px] text-slate-450 mt-1 block font-semibold leading-relaxed">{stat.desc}</span>
            </div>
            <div className="shrink-0 mt-0.5">{stat.icon}</div>
          </div>
        ))}
      </div>

      {/* 3. Three-Column Dense Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start select-none">
        
        {/* Column 1: Recent Documents, Activity List, Quick Actions (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Recent Documents Table Card */}
          <div className="bg-white border border-slate-200/85 rounded-xl p-4 text-left shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Recent Documents</h3>
              <Link to="/documents" className="text-[9px] font-black text-emerald-600 hover:text-emerald-700 uppercase tracking-widest flex items-center gap-0.5">
                <span>+ View All</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            
            {recentDocs.length > 0 ? (
              <div className="space-y-1.5">
                {recentDocs.slice(0, 3).map((doc) => (
                  <div key={doc._id} className="flex items-center justify-between gap-3 p-1 rounded-lg hover:bg-slate-50 transition-colors group">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 shrink-0" />
                      <div className="min-w-0">
                        <h4 className="text-xs font-extrabold text-slate-800 truncate max-w-[170px] group-hover:text-emerald-700" title={doc.title}>
                          {doc.title || "Untitled Document"}
                        </h4>
                        <span className="text-[9px] text-slate-400 font-bold block">
                          Opened {moment(doc.lastAccessed || doc.createdAt).fromNow()}
                        </span>
                      </div>
                    </div>
                    <Link 
                      to={`/documents/${doc._id}`}
                      className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-emerald-650 font-bold text-[9px] rounded-lg border border-slate-200/60 tracking-wider uppercase transition-colors shrink-0"
                    >
                      Open
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-slate-450 italic py-2">No library files uploaded.</p>
            )}
          </div>

          {/* Quick Actions Panel */}
          <div className="bg-white border border-slate-200/85 rounded-xl p-4 text-left shadow-xs">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-2 mb-3">
              Quick Actions Channels
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Read PDF Summary", icon: <FileText className="w-3.5 h-3.5 text-blue-500" />, path: "/documents" },
                { label: "Active Flashcards", icon: <BookOpen className="w-3.5 h-3.5 text-indigo-500" />, path: "/flashcards" },
                { label: "Revision Podcast", icon: <Headphones className="w-3.5 h-3.5 text-emerald-500" />, path: "/documents" },
                { label: "Practice Quizzes", icon: <BrainCircuit className="w-3.5 h-3.5 text-purple-500" />, path: "/documents" },
                { label: "Study Note Book", icon: <Bookmark className="w-3.5 h-3.5 text-orange-500" />, path: "/documents" },
                { label: "Focus Workspace", icon: <Clock className="w-3.5 h-3.5 text-[#10D28F]" />, path: "/focus" }
              ].map((act, idx) => (
                <Link
                  key={idx}
                  to={act.path}
                  className="flex items-center gap-2.5 px-3 h-10 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200/40 hover:border-slate-350 transition-all hover:scale-[1.01] hover:-translate-y-px duration-250 cursor-pointer"
                >
                  {act.icon}
                  <span>{act.label}</span>
                </Link>
              ))}
            </div>
          </div>

        </div>

        {/* Column 2: Focus Study Session Widget (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <FocusDashboardCard />
        </div>

        {/* Column 3: Daily Progress & Streaks Stats Card (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Daily Goals Panel */}
          <div className="bg-white border border-slate-200/85 rounded-xl p-4 text-left shadow-xs">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1 mb-3 border-b border-slate-100 pb-2">
              <Target className="w-3.5 h-3.5 text-[#10D28F]" />
              <span>Daily Study Targets</span>
            </h3>

            <div className="space-y-3">
              {[
                { label: "Duration Studied (mins)", key: "minutesCompleted", completed: goals.minutesCompleted || 0, target: goals.minutesTarget || 120 },
                { label: "Sessions Completed", key: "sessionsCompleted", completed: goals.sessionsCompleted || 0, target: goals.sessionsTarget || 4 },
                { label: "PDF Documents Read", key: "pdfsCompleted", completed: goals.pdfsCompleted || 0, target: goals.pdfsTarget || 1 },
                { label: "Flashcards sets Reviewed", key: "flashcardsCompleted", completed: goals.flashcardsCompleted || 0, target: goals.flashcardsTarget || 1 }
              ].map((goal, idx) => {
                const rate = Math.round((goal.completed / goal.target) * 100);
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between items-center text-[9px] font-bold text-slate-500 leading-none">
                      <span>{goal.label}</span>
                      <button 
                        onClick={() => handleGoalToggle(goal.key, goal.completed, goal.target)}
                        className={`cursor-pointer transition-all hover:text-slate-800 ${rate >= 100 ? "text-[#10D28F]" : ""}`}
                        title="Click to increment manually"
                      >
                        {goal.completed}/{goal.target}
                      </button>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
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

          {/* Streaks Analytics */}
          <div className="bg-white border border-slate-200/85 rounded-xl p-4 text-left shadow-xs flex flex-col justify-between min-h-[100px]">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-2.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Streaks Canopy</span>
            </span>
            <div className="flex items-center gap-3">
              <span className="text-2xl select-none">🔥</span>
              <div>
                <h4 className="text-xs font-extrabold text-slate-850 leading-tight">
                  Streaks Consistency: {stats.longestStreak || 0} days
                </h4>
                <p className="text-[8px] text-slate-450 mt-1 font-semibold leading-relaxed">
                  Longest consecutive daily completed blocks logged. Keep study rhythms aligned!
                </p>
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