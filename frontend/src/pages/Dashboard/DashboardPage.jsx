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
  Bookmark
} from "lucide-react";
import Spinner from "../../components/common/Spinner";
import progressService from "../../services/progressService";
import { useAuth } from "../../context/AuthContext";
import { useTour } from "../../context/TourContext";
import moment from "moment";

const DashboardPage = () => {
  const { user } = useAuth();
  const { showWelcomeModal, setShowWelcomeModal, skipTour } = useTour();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
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
  }, []);

  if (loading) return <Spinner />;

  // 100% defensive displayName computation
  const displayName = 
    user?.username || 
    user?.firstName || 
    (user?.name && typeof user.name === 'string' ? user.name.split(' ')[0] : "") || 
    "Learner";

  // If no dashboard data exists or totalDocuments is 0, show empty state template
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
                  className="flex-1 h-11 px-5 border border-slate-200 text-slate-550 hover:text-slate-800 hover:bg-slate-50 rounded-xl text-xs font-bold transition-all cursor-pointer"
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

  // Defensive destructuring
  const overview = dashboardData.overview || {};
  const recentActivity = dashboardData.recentActivity || {};

  // Strictly filter array documents to ignore corrupt null database entries
  const recentDocs = Array.isArray(recentActivity.documents) 
    ? recentActivity.documents.filter(doc => doc && typeof doc === 'object') 
    : [];

  // Active Workspace: The document that was last accessed
  const activeDocument = recentDocs.length > 0 ? recentDocs[0] : null;

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-10 select-none">
      
      {/* 1. Welcoming Hero Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 p-8 sm:p-10 text-white shadow-xl shadow-emerald-500/15 overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
        {/* Decorative Grid Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-white/5 to-transparent pointer-events-none" />
        
        <div className="space-y-3 relative z-10 text-center md:text-left">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest text-emerald-50">
            <Sparkles className="w-3.5 h-3.5 text-white" /> Study Companion Active
          </span>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight font-display">
            Good to see you, {displayName}.
          </h1>
          <p className="text-emerald-50 text-sm sm:text-base font-semibold max-w-lg leading-relaxed">
            What are we learning today? Access your audio summaries, study sets, or practice assessments.
          </p>
        </div>

        <div className="relative z-10 shrink-0">
          <Link
            to="/documents"
            className="flex items-center gap-2 px-6 h-12 bg-white text-emerald-700 hover:text-emerald-800 rounded-2xl font-bold text-sm shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer tour-upload-section"
          >
            <Plus className="w-5 h-5" strokeWidth={2.5} />
            Upload PDF Document
          </Link>
        </div>
      </div>

      {/* 2. Featured Active Study Workspace */}
      {activeDocument && activeDocument._id && (
        <div className="space-y-4">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">
            Active Study Workspace
          </h2>
          <div className="bg-white border border-slate-200/85 rounded-3xl p-6 sm:p-8 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex items-start gap-4 flex-1 min-w-0">
              <div className="shrink-0 w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100/50">
                <FileText className="w-7 h-7" strokeWidth={2} />
              </div>
              <div className="space-y-1.5 min-w-0">
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                  LATEST ACCESS
                </span>
                <h3 className="text-xl font-bold text-slate-900 line-clamp-1 break-all" title={activeDocument.title || "Untitled Document"}>
                  {activeDocument.title || "Untitled Document"}
                </h3>
                <p className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Accessed {activeDocument.lastAccessed ? moment(activeDocument.lastAccessed).fromNow() : (activeDocument.createdAt ? moment(activeDocument.createdAt).fromNow() : "Recently")}
                </p>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full lg:w-auto">
              <Link
                to={`/documents/${activeDocument._id}`}
                className="flex items-center justify-center gap-1.5 px-4 h-10 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200/60 transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-blue-500" /> Read PDF
              </Link>
              <Link
                to={`/documents/${activeDocument._id}`}
                className="flex items-center justify-center gap-1.5 px-4 h-10 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200/60 transition-colors"
              >
                <Headphones className="w-3.5 h-3.5 text-emerald-500" /> Listen Podcast
              </Link>
              <Link
                to={`/documents/${activeDocument._id}`}
                className="flex items-center justify-center gap-1.5 px-4 h-10 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200/60 transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5 text-indigo-500" /> Flashcards
              </Link>
              <Link
                to={`/documents/${activeDocument._id}`}
                className="flex items-center justify-center gap-1.5 px-4 h-10 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200/60 transition-colors"
              >
                <BrainCircuit className="w-3.5 h-3.5 text-purple-500" /> Practice Quiz
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 3. Core Study Pillars Grid */}
      <div className="space-y-4">
        <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">
          Core Study Pillars
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pillar 1: Podcasts */}
          <div 
            onClick={() => navigate("/documents")}
            className="group cursor-pointer bg-white border border-slate-200/85 rounded-3xl p-6 shadow-xs hover:shadow-lg hover:border-emerald-300 transition-all duration-300 flex flex-col justify-between min-h-[220px]"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100/50 group-hover:scale-110 transition-transform duration-300">
                <Headphones className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">
                  AUDIO OVERVIEWS
                </span>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                  AI Podcasts
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                  Listen to natural, bilingual dialogues explaining concepts and technical terms in real time.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 pt-4 uppercase tracking-widest">
              Open Library <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </div>
          </div>

          {/* Pillar 2: Flashcards */}
          <div 
            onClick={() => navigate("/flashcards")}
            className="group cursor-pointer bg-white border border-slate-200/85 rounded-3xl p-6 shadow-xs hover:shadow-lg hover:border-indigo-300 transition-all duration-300 flex flex-col justify-between min-h-[220px]"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100/50 group-hover:scale-110 transition-transform duration-300">
                <BookOpen className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">
                  ACTIVE RECALL
                </span>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                  Study Decks
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                  Review key definitions, rules, and notes using modular card decks with tracking diagnostics.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-indigo-600 pt-4 uppercase tracking-widest">
              Review Decks <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </div>
          </div>

          {/* Pillar 3: Quizzes */}
          <div 
            onClick={() => navigate("/documents")}
            className="group cursor-pointer bg-white border border-slate-200/85 rounded-3xl p-6 shadow-xs hover:shadow-lg hover:border-purple-300 transition-all duration-300 flex flex-col justify-between min-h-[220px]"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100/50 group-hover:scale-110 transition-transform duration-300">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-black text-purple-600 uppercase tracking-widest">
                  COMPREHENSION CHECK
                </span>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
                  Assessments
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                  Test your document comprehension with detailed reviews and diagnostics on incorrect answers.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-purple-600 pt-4 uppercase tracking-widest">
              Take Assessment <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </div>
      </div>

      {/* 4. Bottom Row: Library Slider & Stats Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Recent Library Documents (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">
            Recent Library Uploads
          </h2>
          {recentDocs.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {recentDocs.slice(0, 4).map((doc) => {
                if (!doc || !doc._id) return null;
                return (
                  <Link
                    key={doc._id}
                    to={`/documents/${doc._id}`}
                    className="group block bg-white border border-slate-200/85 hover:border-emerald-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-11 h-11 bg-slate-50 group-hover:bg-emerald-50 text-slate-500 group-hover:text-emerald-600 border border-slate-100 rounded-xl flex items-center justify-center shrink-0 transition-colors">
                        <FileText className="w-5.5 h-5.5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-slate-900 line-clamp-2 break-all group-hover:text-emerald-700 transition-colors">
                          {doc.title || "Untitled Document"}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">
                          Accessed {doc.lastAccessed ? moment(doc.lastAccessed).fromNow() : (doc.createdAt ? moment(doc.createdAt).fromNow() : "Recently")}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="p-10 border border-slate-200 border-dashed rounded-3xl text-center bg-slate-50/20">
              <p className="text-slate-500 text-xs font-semibold">Your study materials list is empty.</p>
            </div>
          )}
        </div>

        {/* Right Column: Analytics & Quiz Activity (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Analytics Summary */}
          <div className="space-y-4">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">
              Activity Metrics
            </h2>
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Studied PDFs</p>
                <p className="text-lg font-extrabold text-slate-800">{overview.totalDocuments || 0}</p>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Cards Reviewed</p>
                <p className="text-lg font-extrabold text-slate-800">{overview.reviewedFlashcards || overview.totalFlashcards || 0}</p>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Quiz Completed</p>
                <p className="text-lg font-extrabold text-slate-800">{overview.completedQuizzes || overview.totalQuizzes || 0}</p>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Average Score</p>
                <p className="text-lg font-extrabold text-emerald-600">{overview.averageScore || 0}%</p>
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
            
            <p className="text-xs sm:text-sm text-slate-550 leading-relaxed font-semibold mb-8 max-w-sm mx-auto">
              Transform your textbooks, lecture notes, and PDFs into AI summaries, interactive quizzes, flashcard decks, and revision podcasts.
              <br /><br />
              Upload your first document to begin your customized learning path.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => skipTour()}
                className="flex-1 h-11 px-5 border border-slate-200 text-slate-550 hover:text-slate-800 hover:bg-slate-55 rounded-xl text-xs font-bold transition-all cursor-pointer"
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