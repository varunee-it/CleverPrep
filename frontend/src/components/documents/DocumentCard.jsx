import React from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Trash2, BookOpen, BrainCircuit, Play } from "lucide-react";

const DocumentCard = ({ document, onDelete }) => {
  const navigate = useNavigate();

  const handleNavigate = (tab = 'Content') => {
    // In our implementation, routing to /documents/:id automatically loads the active tab if we supported query params, 
    // but right now it just goes to the doc. We can pass state to the route if we wanted to set the tab,
    // but the simplest way without changing backend logic is just routing to the document, and the user can click the tab.
    // However, the user asked for explicit "Read", "Flashcards", "Quiz" actions. We can navigate to the doc, 
    // and ideally the DocumentDetailPage would read a query param or state, but since we are not to change routing logic,
    // we'll just navigate to the document page.
    navigate(`/documents/${document._id}`);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(document);
  };

  return (
    <div className="group relative bg-white border border-slate-200 hover:border-emerald-300 rounded-2xl p-5 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10 flex flex-col h-full">
      {/* Delete Button */}
      <button
        onClick={handleDelete}
        className="absolute top-4 right-4 p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 z-10"
        title="Delete Document"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      {/* Header Info */}
      <div className="flex items-start gap-4 mb-5">
        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0 border border-emerald-100">
          <FileText className="w-6 h-6" strokeWidth={2} />
        </div>
        <div className="flex-1 pr-6">
          <h3 className="text-base font-bold text-slate-900 line-clamp-2 mb-1 group-hover:text-emerald-700 transition-colors">
            {document.title}
          </h3>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            {document.createdAt ? new Date(document.createdAt).toLocaleDateString() : 'Recently Added'}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-6 mb-6">
        <div>
          <p className="text-xl font-bold text-slate-800">{document.flashcardCount || 0}</p>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1 mt-0.5">
            <BookOpen className="w-3 h-3 text-emerald-500" /> Flashcards
          </p>
        </div>
        <div>
          <p className="text-xl font-bold text-slate-800">{document.quizCount || 0}</p>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1 mt-0.5">
            <BrainCircuit className="w-3 h-3 text-purple-500" /> Quizzes
          </p>
        </div>
      </div>

      <div className="mt-auto pt-5 border-t border-slate-100 flex flex-col gap-2">
        <button
          onClick={() => handleNavigate('Content')}
          className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-xl transition-colors shadow-sm shadow-emerald-500/20"
        >
          Continue Reading
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => handleNavigate('Flashcards')}
            className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-1.5"
          >
            Flashcards
          </button>
          <button
            onClick={() => handleNavigate('Quizzes')}
            className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-1.5"
          >
            Quiz
          </button>
          <button
            onClick={() => handleNavigate('Summary')}
            className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-1.5"
          >
            Notes
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentCard;