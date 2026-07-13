import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  BookOpen,
  FolderOpen,
  CheckCircle2,
  TrendingUp,
  X,
  Trash2,
  ArrowUpDown,
} from "lucide-react";
import toast from "react-hot-toast";

import flashcardService from "../../services/flashcardService";
import Spinner from "../../components/common/Spinner";
import FlashcardSetCard from "../../components/flashcards/FlashcardSetCard";

const FlashcardsListPage = () => {
  const navigate = useNavigate();

  // ==========================================
  // States
  // ==========================================
  const [flashcardSets, setFlashcardSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("recent");

  // ==========================================
  // Delete Modal States
  // ==========================================
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedSet, setSelectedSet] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // ==========================================
  // Fetch Flashcard Sets
  // ==========================================
  const fetchFlashcardSets = async () => {
    try {
      const response = await flashcardService.getAllFlashcardSets();
      const data = response.data.data || response.data;
      setFlashcardSets(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error("Failed to fetch flashcard sets.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlashcardSets();
  }, []);

  // ==========================================
  // Delete Handler
  // ==========================================
  const handleDeleteRequest = (set) => {
    setSelectedSet(set);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedSet) return;
    setDeleting(true);

    try {
      await flashcardService.deleteFlashcardSet(selectedSet._id);
      toast.success("Flashcard set deleted successfully.");
      setFlashcardSets((prev) => prev.filter((s) => s._id !== selectedSet._id));
      setIsDeleteModalOpen(false);
      setSelectedSet(null);
    } catch (error) {
      toast.error("Failed to delete flashcard set.");
      console.error(error);
    } finally {
      setDeleting(false);
    }
  };

  // ==========================================
  // Statistics Calculations
  // ==========================================
  const totalSets = flashcardSets.length;
  const totalCards = flashcardSets.reduce((sum, set) => sum + set.cards.length, 0);
  const totalReviewed = flashcardSets.reduce(
    (sum, set) => sum + set.cards.filter((c) => c.lastReviewed).length,
    0
  );
  const overallProgress =
    totalCards > 0 ? Math.round((totalReviewed / totalCards) * 100) : 0;

  // ==========================================
  // Sorting Logic
  // ==========================================
  const sortedSets = [...flashcardSets].sort((a, b) => {
    if (sortBy === "recent") return new Date(b.createdAt) - new Date(a.createdAt);
    if (sortBy === "oldest") return new Date(a.createdAt) - new Date(b.createdAt);
    if (sortBy === "reviewed") {
      const aRev = a.cards.filter((c) => c.lastReviewed).length;
      const bRev = b.cards.filter((c) => c.lastReviewed).length;
      return bRev - aRev;
    }
    if (sortBy === "alphabetical") {
      const aTitle = a.documentId?.title || "";
      const bTitle = b.documentId?.title || "";
      return aTitle.localeCompare(bTitle);
    }
    return 0;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 relative z-10 animate-in fade-in duration-300">
      
      {/* Hero Header */}
      <div className="relative bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-teal-500/5 blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center gap-5 relative z-10">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-emerald-50 to-emerald-100/50 border border-emerald-100/50 flex items-center justify-center shrink-0 shadow-sm">
            <BookOpen className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-600" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight font-display flex items-center gap-2">
              📚 All Flashcard Sets
            </h1>
            <p className="text-slate-500 text-sm mt-1 max-w-xl leading-relaxed font-medium">
              Review, learn, and master concepts with AI-powered flashcards.
            </p>
          </div>
        </div>

        {/* Sort Controls */}
        <div className="relative z-10 shrink-0 self-stretch sm:self-auto flex items-center">
          <div className="relative flex items-center border border-slate-200/80 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:border-slate-300 transition-colors gap-2 cursor-pointer w-full sm:w-auto">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent outline-none cursor-pointer pr-1 w-full"
            >
              <option value="recent">Recently Created</option>
              <option value="oldest">Oldest</option>
              <option value="reviewed">Most Reviewed</option>
              <option value="alphabetical">A–Z</option>
            </select>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Sets */}
        <div className="bg-white/60 backdrop-blur-xl border border-slate-100 rounded-[20px] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.015)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.03)] hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
            <FolderOpen className="w-6 h-6" strokeWidth={1.5} />
          </div>
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Total Sets</span>
            <span className="text-2xl font-bold text-slate-800 leading-none">{totalSets}</span>
            <span className="text-[10px] text-slate-500 font-medium block mt-0.5">Study sets generated</span>
          </div>
        </div>

        {/* Total Flashcards */}
        <div className="bg-white/60 backdrop-blur-xl border border-slate-100 rounded-[20px] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.015)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.03)] hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6" strokeWidth={1.5} />
          </div>
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Total Flashcards</span>
            <span className="text-2xl font-bold text-slate-800 leading-none">{totalCards}</span>
            <span className="text-[10px] text-slate-500 font-medium block mt-0.5">Across all sets</span>
          </div>
        </div>

        {/* Cards Reviewed */}
        <div className="bg-white/60 backdrop-blur-xl border border-slate-100 rounded-[20px] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.015)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.03)] hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" strokeWidth={1.5} />
          </div>
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Cards Reviewed</span>
            <span className="text-2xl font-bold text-slate-800 leading-none">{totalReviewed}</span>
            <span className="text-[10px] text-slate-500 font-medium block mt-0.5">Study cards completed</span>
          </div>
        </div>

        {/* Overall Progress */}
        <div className="bg-white/60 backdrop-blur-xl border border-slate-100 rounded-[20px] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.015)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.03)] hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" strokeWidth={1.5} />
          </div>
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Overall Progress</span>
            <span className="text-2xl font-bold text-slate-800 leading-none">{overallProgress}%</span>
            <span className="text-[10px] text-slate-500 font-medium block mt-0.5">Average mastery level</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <Spinner />
        </div>
      ) : sortedSets.length === 0 ? (
        /* Empty State */
        <div className="flex items-center justify-center min-h-[50vh] relative py-8">
          <div className="text-center max-w-md bg-white border border-slate-200/60 p-10 rounded-[32px] shadow-[0_12px_40px_rgba(0,0,0,0.02)] relative z-10 hover:shadow-lg transition-shadow duration-300">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-emerald-50/50 blur-xl pointer-events-none" />
            
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-[24px] bg-gradient-to-br from-emerald-50/80 to-teal-50/50 border border-emerald-100/50 text-emerald-600 mb-6 shadow-sm relative">
              <BookOpen className="w-10 h-10 text-emerald-500" strokeWidth={1.5} />
            </div>

            <h3 className="text-xl font-extrabold text-slate-800 tracking-tight mb-2">
              No Flashcard Sets Yet
            </h3>
            <p className="text-sm text-slate-500 mb-8 leading-relaxed font-medium">
              Generate your first AI flashcards from a document to start studying smarter.
            </p>
            <button
              onClick={() => navigate("/documents")}
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-sm font-semibold rounded-full shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 transition-all duration-200 hover:-translate-y-0.5 active:scale-98"
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              Generate Flashcards
            </button>
          </div>
        </div>
      ) : (
        /* Cards Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 pt-2">
          {sortedSets.map((set) => (
            <FlashcardSetCard
              key={set._id}
              flashcardSet={set}
              onDelete={handleDeleteRequest}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white/95 backdrop-blur-xl border border-slate-200/60 rounded-3xl shadow-2xl p-8 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition-all duration-200"
            >
              <X className="w-5 h-5" strokeWidth={2} />
            </button>

            <div className="mb-6">
              <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6 text-red-600" strokeWidth={2} />
              </div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Confirm Deletion
              </h2>
            </div>

            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Are you sure you want to delete this flashcard set generated from:{" "}
              <span className="font-bold text-slate-800">
                {selectedSet?.documentId?.title}
              </span>
              ? This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={deleting}
                className="flex-1 h-11 border border-slate-200 rounded-xl bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-all duration-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="flex-1 h-11 px-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-xs font-semibold rounded-xl transition-all duration-200 shadow-md shadow-red-500/10 disabled:opacity-50"
              >
                {deleting ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Deleting...
                  </span>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlashcardsListPage;