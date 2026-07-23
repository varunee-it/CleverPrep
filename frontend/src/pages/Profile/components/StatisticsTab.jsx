import React from "react";
import { Link } from "react-router-dom";
import { FileText, BrainCircuit, BookOpen, Flame, Clock } from "lucide-react";
import moment from "moment";

const StatisticsTab = ({ statsData, loading }) => {
  if (loading) {
    return (
      <div className="h-48 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  const overview = statsData?.overview || {};
  const recentActivity = statsData?.recentActivity || { documents: [], quizzes: [] };

  const totalDocuments = overview.totalDocuments || 0;
  const totalFlashcards = overview.totalFlashcards || 0;
  const completedQuizzes = overview.completedQuizzes || 0;
  const studyStreak = overview.currentStreak || 0;

  const hasRecentActivity = 
    (recentActivity.documents && recentActivity.documents.length > 0) || 
    (recentActivity.quizzes && recentActivity.quizzes.length > 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="space-y-1">
        <h4 className="text-lg font-bold text-slate-900">Learning Analytics</h4>
        <p className="text-xs text-slate-500 font-semibold">Verify your progress and content creation milestones.</p>
      </div>

      {/* Grid of stats cards */}
      <div className="pt-6 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Documents */}
        <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 text-center">
          <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2.5">
            <FileText className="w-4.5 h-4.5" />
          </div>
          <p className="text-xl font-bold text-slate-900 mb-0.5">{totalDocuments}</p>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">
            Docs Uploaded
          </p>
        </div>

        {/* Flashcards */}
        <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 text-center">
          <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2.5">
            <BrainCircuit className="w-4.5 h-4.5" />
          </div>
          <p className="text-xl font-bold text-slate-900 mb-0.5">{totalFlashcards}</p>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">
            Cards Created
          </p>
        </div>

        {/* Quizzes */}
        <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 text-center">
          <div className="w-9 h-9 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-2.5">
            <BookOpen className="w-4.5 h-4.5" />
          </div>
          <p className="text-xl font-bold text-slate-900 mb-0.5">{completedQuizzes}</p>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">
            Quizzes Done
          </p>
        </div>

        {/* Streak */}
        <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 text-center">
          <div className="w-9 h-9 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-2.5">
            <Flame className="w-4.5 h-4.5" />
          </div>
          <p className="text-xl font-bold text-slate-900 mb-0.5">{studyStreak}d</p>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">
            Study Streak
          </p>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="space-y-3 pt-2">
        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Recent Activity
        </h5>

        {hasRecentActivity ? (
          <div className="border border-slate-200/80 rounded-2xl p-4 bg-slate-50/20 divide-y divide-slate-100">
            {recentActivity.documents?.slice(0, 2).map((doc, idx) => (
              <div key={`doc-${doc._id || idx}`} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <span className="text-sm">📄</span>
                  <div>
                    <p className="text-xs font-bold text-slate-800 truncate max-w-[200px] sm:max-w-xs">{doc.title}</p>
                    <p className="text-[10px] text-slate-400 font-semibold">Study Document Uploaded</p>
                  </div>
                </div>
                {doc.lastAccessed && (
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                    {moment(doc.lastAccessed).fromNow()}
                  </span>
                )}
              </div>
            ))}

            {recentActivity.quizzes?.slice(0, 2).map((quiz, idx) => (
              <div key={`quiz-${quiz._id || idx}`} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <span className="text-sm">📝</span>
                  <div>
                    <p className="text-xs font-bold text-slate-800 truncate max-w-[200px] sm:max-w-xs">{quiz.title}</p>
                    <p className="text-[10px] text-slate-400 font-semibold">Completed Quiz (Score: {quiz.score}%)</p>
                  </div>
                </div>
                {quiz.completedAt && (
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                    {moment(quiz.completedAt).fromNow()}
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-6 border border-slate-200/80 rounded-2xl bg-slate-50/20 space-y-4">
            <p className="text-xs text-slate-400 font-semibold">No learning activity yet.</p>
            <Link
              to="/documents"
              className="px-5 h-9 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-500/10 transition-all flex items-center justify-center cursor-pointer"
            >
              Upload your first document
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatisticsTab;
