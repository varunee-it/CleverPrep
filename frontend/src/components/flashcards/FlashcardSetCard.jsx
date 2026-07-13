import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Calendar, MoreVertical, Trash2 } from "lucide-react";
import moment from "moment";

const FlashcardSetCard = ({ flashcardSet, onDelete }) => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleStudyNow = () => {
    navigate(`/documents/${flashcardSet.documentId._id}/flashcards`);
  };

  const reviewedCount = flashcardSet.cards.filter(card => card.lastReviewed).length;
  const totalCards = flashcardSet.cards.length;
  const progressPercentage = totalCards > 0 ? Math.round((reviewedCount / totalCards) * 100) : 0;

  const docDescription = flashcardSet.documentId?.description || "AI-generated flashcards for quick revision and exam preparation.";

  return (
    <div className="group relative bg-white border border-slate-200 hover:border-emerald-300 rounded-[24px] p-6 transition-all duration-250 hover:shadow-[0_12px_40px_rgba(16,185,129,0.06)] hover:-translate-y-1.5 flex flex-col justify-between h-full cursor-pointer z-0">
      
      {/* Click-away backdrop overlay for dropdown menu */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 z-10" 
          onClick={(e) => {
            e.stopPropagation();
            setIsMenuOpen(false);
          }}
        />
      )}

      <div>
        {/* Top Gradient Preview Area */}
        <div className="relative h-32 rounded-[20px] bg-gradient-to-br from-emerald-50/60 via-teal-50/20 to-white border border-slate-100 flex items-center justify-center overflow-hidden mb-5 transition-all duration-300 group-hover:from-emerald-50/80 group-hover:via-teal-50/40">
          
          {/* Three-dot menu button */}
          <button
            onClick={(e) => { 
              e.stopPropagation(); 
              setIsMenuOpen(!isMenuOpen); 
            }}
            className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-white/80 rounded-lg transition-all z-20 border border-transparent hover:border-slate-100/50"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {/* Three-dot dropdown menu */}
          {isMenuOpen && (
            <div className="absolute right-3 top-11 bg-white border border-slate-100/80 rounded-xl shadow-lg py-1.5 z-20 min-w-[120px] animate-in fade-in slide-in-from-top-1 duration-150">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(false);
                  onDelete(flashcardSet);
                }}
                className="w-full px-4 py-2 text-left text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            </div>
          )}

          {/* Centered Flashcard icon */}
          <div className="relative flex items-center justify-center w-16 h-16 rounded-xl bg-white shadow-xs border border-slate-100 group-hover:scale-105 group-hover:shadow-md transition-all duration-300">
            <BookOpen className="w-8 h-8 text-emerald-500 transition-colors group-hover:text-emerald-600" strokeWidth={1.5} />
          </div>
        </div>

        {/* Info Area */}
        <div className="space-y-2 mb-4">
          <h3 className="text-base font-bold text-slate-800 line-clamp-1 break-all group-hover:text-emerald-800 transition-colors" title={flashcardSet.documentId?.title}>
            {flashcardSet.documentId?.title}
          </h3>
          
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Created {moment(flashcardSet.createdAt).fromNow()}</span>
          </p>

          <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 min-h-[32px]">
            {docDescription}
          </p>
        </div>

        {/* Metadata Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-full flex items-center">
            <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
              🃏 {totalCards} {totalCards === 1 ? 'Flashcard' : 'Flashcards'}
            </span>
          </div>
          {progressPercentage > 0 && (
            <div className="px-3 py-1 bg-emerald-50 border border-emerald-100/50 rounded-full flex items-center">
              <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                📈 {progressPercentage}% master
              </span>
            </div>
          )}
        </div>

        {/* Progress Section */}
        {totalCards > 0 && (
          <div className="space-y-1.5 mb-4">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
              <span>Progress</span>
              <span className="font-mono text-[11px] tracking-wider text-emerald-600">
                {"█".repeat(Math.round(progressPercentage / 10)) + "░".repeat(10 - Math.round(progressPercentage / 10))}
              </span>
            </div>
            <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-400 font-semibold text-right">
              {reviewedCount} / {totalCards} reviewed
            </div>
          </div>
        )}
      </div>

      {/* Study Button */}
      <div className="mt-4 pt-4 border-t border-slate-100/80">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleStudyNow();
          }}
          className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-sm shadow-emerald-500/10 hover:shadow-lg hover:shadow-emerald-500/20 active:scale-[0.99] flex items-center justify-center gap-2"
        >
          <span>✨</span>
          <span>Study Now</span>
        </button>
      </div>
    </div>
  );
};

export default FlashcardSetCard;