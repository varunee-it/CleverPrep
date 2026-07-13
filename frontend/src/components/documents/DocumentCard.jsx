import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FileText, Trash2, BookOpen, BrainCircuit, MoreVertical, Sparkles, Eye } from "lucide-react";

const DocumentCard = ({ document, onDelete }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleNavigate = (tab = 'Content') => {
    navigate(`/documents/${document._id}?tab=${tab}`, { state: { from: location.pathname + location.search } });
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    onDelete(document);
  };

  const docDescription = document.description || `Interactive learning guide for ${document.title}. Explore flashcards, notes, and AI-tutor workspace.`;

  return (
    <div className="group relative bg-white border border-slate-200/80 hover:border-emerald-300 rounded-[24px] p-5 transition-all duration-300 hover:shadow-[0_12px_40px_rgba(16,185,129,0.06)] hover:-translate-y-1.5 flex flex-col h-full z-0">
      
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

      {/* Top Header Section with Pastel Gradient */}
      <div className="relative h-32 rounded-[20px] bg-gradient-to-br from-emerald-50/60 via-teal-50/20 to-white border border-slate-100/80 flex items-center justify-center overflow-hidden mb-4 transition-all duration-300 group-hover:from-emerald-50/80 group-hover:via-teal-50/40">
        
        {/* PDF Badge */}
        <div className="absolute top-3.5 left-3.5 px-2.5 py-0.5 rounded-md bg-rose-50 text-rose-600 text-[10px] font-bold tracking-wider border border-rose-100/50 uppercase">
          PDF
        </div>

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
              onClick={handleDelete}
              className="w-full px-4 py-2 text-left text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </div>
        )}

        {/* PDF Illustration/Icon in the center */}
        <div className="relative flex items-center justify-center w-16 h-16 rounded-xl bg-white shadow-xs border border-slate-100 group-hover:scale-105 group-hover:shadow-md transition-all duration-300">
          <FileText className="w-8 h-8 text-emerald-500 transition-colors group-hover:text-emerald-600" strokeWidth={1.5} />
          {document.status === 'processing' && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-500 border-2 border-white flex items-center justify-center" title="Processing">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
            </div>
          )}
          {document.status === 'failed' && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-red-500 border-2 border-white flex items-center justify-center" title="Processing Failed">
              <span className="text-[10px] text-white font-bold leading-none">!</span>
            </div>
          )}
        </div>
      </div>

      {/* Middle Section */}
      <div className="mb-4">
        <h3 className="text-base font-bold text-slate-800 line-clamp-1 break-all group-hover:text-emerald-800 transition-colors mb-0.5" title={document.title}>
          {document.title}
        </h3>
        
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
          {document.createdAt ? new Date(document.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently Added'}
        </p>

        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 min-h-[32px]">
          {docDescription}
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-2 border-t border-b border-slate-100 py-3 mb-4 text-center">
        <div>
          <p className="text-sm font-bold text-slate-800">{document.flashcardCount || 0}</p>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">Cards</p>
        </div>
        <div className="border-l border-r border-slate-100">
          <p className="text-sm font-bold text-slate-800">{document.quizCount || 0}</p>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">Quizzes</p>
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800">{document.status === 'ready' ? 1 : 0}</p>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">Notes</p>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="mt-auto space-y-3">
        <button
          onClick={() => handleNavigate('Content')}
          className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-sm shadow-emerald-500/10 hover:shadow-lg hover:shadow-emerald-500/20 active:scale-[0.99] flex items-center justify-center gap-2 group-hover:bg-emerald-500 group-hover:brightness-105"
        >
          <Eye className="w-4 h-4" />
          Continue Reading
        </button>
        <div className="flex gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); handleNavigate('Flashcards'); }}
            className="flex-1 py-1.5 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 text-slate-500 hover:text-emerald-700 text-[11px] font-semibold rounded-full border border-slate-100/50 hover:border-emerald-100/80 transition-all duration-200 flex items-center justify-center gap-1 group/chip active:scale-95"
          >
            <BookOpen className="w-3 h-3 text-slate-400 group-hover/chip:text-emerald-500 transition-colors" />
            <span>Cards</span>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleNavigate('Quizzes'); }}
            className="flex-1 py-1.5 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 text-slate-500 hover:text-emerald-700 text-[11px] font-semibold rounded-full border border-slate-100/50 hover:border-emerald-100/80 transition-all duration-200 flex items-center justify-center gap-1 group/chip active:scale-95"
          >
            <BrainCircuit className="w-3 h-3 text-slate-400 group-hover/chip:text-emerald-500 transition-colors" />
            <span>Quiz</span>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleNavigate('Summary'); }}
            className="flex-1 py-1.5 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 text-slate-500 hover:text-emerald-700 text-[11px] font-semibold rounded-full border border-slate-100/50 hover:border-emerald-100/80 transition-all duration-200 flex items-center justify-center gap-1 group/chip active:scale-95"
          >
            <Sparkles className="w-3 h-3 text-slate-400 group-hover/chip:text-emerald-500 transition-colors" />
            <span>Notes</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentCard;