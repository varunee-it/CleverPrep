import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { 
  FileText, BookOpen, BrainCircuit, Play, ArrowRight, Sparkles 
} from "lucide-react";
import Spinner from "../../components/common/Spinner";
import progressService from "../../services/progressService";
import { useAuth } from "../../context/AuthContext";

const DashboardPage = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const fetchInitiated = useRef(false);

  useEffect(() => {
    if (fetchInitiated.current) return;
    fetchInitiated.current = true;

    const fetchDashboardData = async () => {
      try {
        const data = await progressService.getDashboardData();
        setDashboardData(data.data);
      } catch (error) {
        toast.error("Failed to fetch dashboard data.");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) return <Spinner />;

  const displayName = user?.username || user?.firstName || user?.name?.split(' ')[0] || "Learner";

  if (!dashboardData || !dashboardData.overview) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-slate-400" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-medium text-slate-900 tracking-tight">Ready to learn, {displayName}?</h2>
          <p className="text-slate-500 max-w-sm mx-auto">Upload a document to start your learning journey. We'll automatically generate your study materials.</p>
        </div>
        <Link to="/documents" className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-full font-medium transition-colors mt-4">
          Upload Document
        </Link>
      </div>
    );
  }

  // Combine and sort recent activity for the Study Queue
  const allRecentItems = [
    ...(dashboardData.recentActivity.flashcards || []).map(fc => ({
      id: fc._id,
      title: fc.title || fc.documentId?.title || "Flashcard Set",
      timestamp: fc.lastAccessed || fc.createdAt,
      type: "Flashcards Due",
      link: fc.documentId?._id ? `/documents/${fc.documentId._id}/flashcards` : `/flashcards`,
      actionText: "Review Now",
      icon: BookOpen,
      iconColor: "text-emerald-500",
      bgClass: "bg-emerald-50"
    })),
    ...(dashboardData.recentActivity.quizzes || []).map(quiz => ({
      id: quiz._id,
      title: quiz.title,
      timestamp: quiz.lastAttempted || quiz.createdAt,
      type: "Practice Available",
      link: `/quizzes/${quiz._id}/results`,
      actionText: "Take Quiz",
      icon: BrainCircuit,
      iconColor: "text-purple-500",
      bgClass: "bg-purple-50"
    })),
    ...(dashboardData.recentActivity.documents || []).map(doc => ({
      id: doc._id,
      title: doc.title,
      timestamp: doc.lastAccessed || doc.createdAt,
      type: "Continue Reading",
      link: `/documents/${doc._id}`,
      actionText: "Resume",
      icon: FileText,
      iconColor: "text-blue-500",
      bgClass: "bg-blue-50"
    })),
  ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const heroItem = allRecentItems[0];
  const queueItems = allRecentItems.slice(1, 4);
  const recentActivity = allRecentItems.slice(4, 10); // Rest of the items for the right column

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-8">
      {/* minimal greeting at the top */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
          Good to see you, {displayName}.
        </h1>
        <p className="text-base text-slate-500 font-medium mt-1">
          What should we study next?
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: 70% (Continue Learning & Queue) */}
        <div className="lg:col-span-8 space-y-10">
          <section>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest">
                Continue Learning
              </h2>
            </div>
            
            {heroItem ? (
              <div className="space-y-6">
                {/* Hero Card */}
                <Link 
                  to={heroItem.link}
                  className="group block p-6 sm:p-8 bg-white/80 backdrop-blur-xl rounded-3xl shadow-sm border border-slate-100 hover:shadow-md hover:border-emerald-200 transition-all duration-300"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                      <div className={`shrink-0 w-14 h-14 rounded-2xl ${heroItem.bgClass} flex items-center justify-center`}>
                        <heroItem.icon className={`w-7 h-7 ${heroItem.iconColor}`} strokeWidth={2} />
                      </div>
                      <div>
                        <p className={`text-xs font-bold uppercase tracking-widest ${heroItem.iconColor} mb-1.5`}>
                          {heroItem.type}
                        </p>
                        <h3 className="text-xl font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
                          {heroItem.title}
                        </h3>
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-2 px-6 h-12 bg-slate-900 text-white rounded-xl font-semibold text-sm self-start sm:self-center group-hover:bg-slate-800 transition-colors">
                      {heroItem.actionText} <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
                    </div>
                  </div>
                </Link>

                {/* Queue Items */}
                {queueItems.length > 0 && (
                  <div className="bg-white/80 backdrop-blur-xl border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                    {queueItems.map((item, idx) => (
                      <Link 
                        key={`${item.type}-${item.id}-${idx}`} 
                        to={item.link}
                        className="group flex items-center justify-between p-5 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors duration-200"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`shrink-0 w-10 h-10 rounded-xl bg-slate-100/80 flex items-center justify-center text-slate-500 group-hover:${item.iconColor} transition-colors`}>
                            <item.icon className="w-5 h-5" strokeWidth={2} />
                          </div>
                          <div>
                            <h4 className="text-base font-semibold text-slate-900 line-clamp-1 group-hover:text-emerald-700 transition-colors">
                              {item.title}
                            </h4>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">
                              {item.type}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 group-hover:text-emerald-600 transition-all duration-200 uppercase tracking-widest">
                          {item.actionText} <Play className="w-3.5 h-3.5 fill-current" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-10 border border-slate-200 border-dashed rounded-3xl text-center bg-slate-50/30">
                <p className="text-slate-500 font-medium">Your queue is clear. Upload a document to begin.</p>
              </div>
            )}
          </section>
        </div>

        {/* Right Column: 30% (Learning Activity & Recent Activity) */}
        <div className="lg:col-span-4 space-y-10 pl-0 lg:pl-4">
          
          {/* Learning Activity */}
          <section className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-6">
              Learning Activity
            </h2>
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                 <p className="text-sm font-semibold text-slate-600">Study Streak</p>
                 <p className="text-lg font-bold text-orange-500">{dashboardData.overview.studyStreak || 0} Days</p>
              </div>
              <div className="flex items-center justify-between pt-5 border-t border-slate-100">
                 <p className="text-sm font-semibold text-slate-600">Documents Studied</p>
                 <p className="text-lg font-bold text-slate-900">{dashboardData.overview.totalDocuments}</p>
              </div>
              <div className="flex items-center justify-between">
                 <p className="text-sm font-semibold text-slate-600">Flashcards Reviewed</p>
                 <p className="text-lg font-bold text-slate-900">{dashboardData.overview.reviewedFlashcards || dashboardData.overview.totalFlashcards}</p>
              </div>
              <div className="flex items-center justify-between pt-5 border-t border-slate-100">
                 <p className="text-sm font-semibold text-slate-600">Quizzes Completed</p>
                 <p className="text-lg font-bold text-emerald-600">{dashboardData.overview.completedQuizzes || dashboardData.overview.totalQuizzes}</p>
              </div>
            </div>
          </section>

          {/* Recent Activity */}
          {recentActivity.length > 0 && (
            <section className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-6">
                Recent Activity
              </h2>
              <div className="space-y-5">
                {recentActivity.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-4">
                    <div className="shrink-0 w-2 h-2 rounded-full bg-slate-200 mt-1.5 group-hover:bg-emerald-400 transition-colors"></div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 line-clamp-1">{item.title}</p>
                      <p className="text-xs text-slate-500 font-medium mt-1 uppercase tracking-wider">{item.type} • {new Date(item.timestamp).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>
      </div>
    </div>
  );
};

export default DashboardPage;