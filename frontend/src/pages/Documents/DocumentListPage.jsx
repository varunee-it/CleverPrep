import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  FileText,
  Upload,
  X,
  Trash2,
  FolderOpen,
  Search,
  ArrowUpDown,
  LayoutGrid,
  List,
  Sparkles,
  BrainCircuit,
  BookOpen,
  CloudUpload,
  Eye,
} from "lucide-react";
import toast from "react-hot-toast";

import documentService from "../../services/documentService";
import Spinner from "../../components/common/Spinner";
import DocumentCard from "../../components/documents/DocumentCard";
import { useTour } from "../../context/TourContext";

const DocumentListPage = () => {
  const navigate = useNavigate();
  const { checkAndTriggerWalkthrough } = useTour();

  // ==========================================
  // State: Documents & Filtering
  // ==========================================
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState("grid");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // ==========================================
  // State: Upload Modal
  // ==========================================
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploading, setUploading] = useState(false);

  // ==========================================
  // State: Delete Modal
  // ==========================================
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);

  const searchInputRef = useRef(null);

  // ==========================================
  // Fetch Documents
  // ==========================================
  const fetchDocuments = async () => {
    try {
      const data = await documentService.getDocuments();
      setDocuments(data);
      checkAndTriggerWalkthrough(data);
    } catch (error) {
      toast.error("Failed to fetch documents.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // Keyboard Shortcut Handler
  // ==========================================
  useEffect(() => {
    fetchDocuments();

    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // ==========================================
  // Handle File Change
  // ==========================================
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
        toast.error("Only PDF files are allowed!");
        e.target.value = ""; // Reset
        setUploadFile(null);
        return;
      }
      setUploadFile(file);
      setUploadTitle(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  // ==========================================
  // Upload Document
  // ==========================================
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile || !uploadTitle) {
      toast.error("Please select a file to upload.");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", uploadFile);
    formData.append("title", uploadTitle);

    try {
      await documentService.uploadDocument(formData);
      toast.success("Document uploaded successfully!");
      setIsUploadModalOpen(false);
      setUploadFile(null);
      setUploadTitle("");
      setLoading(true);
      fetchDocuments();
    } catch (error) {
      console.error(error);
      toast.error(
        error?.response?.data?.message ||
        error.message ||
        "Upload failed."
      );
    } finally {
      setUploading(false);
    }
  };

  // ==========================================
  // Open Delete Modal
  // ==========================================
  const handleDeleteRequest = (doc) => {
    setSelectedDoc(doc);
    setIsDeleteModalOpen(true);
  };

  // ==========================================
  // Confirm Delete
  // ==========================================
  const handleConfirmDelete = async () => {
    if (!selectedDoc) return;
    setDeleting(true);

    try {
      await documentService.deleteDocument(selectedDoc._id);
      toast.success(`'${selectedDoc.title}' deleted.`);
      setIsDeleteModalOpen(false);
      setSelectedDoc(null);
      setDocuments(documents.filter((d) => d._id !== selectedDoc._id));
    } catch (error) {
      toast.error(error.message || "Failed to delete document.");
    } finally {
      setDeleting(false);
    }
  };

  const handleNavigate = (docId, tab = 'Content') => {
    navigate(`/documents/${docId}?tab=${tab}`);
  };

  // ==========================================
  // Statistics Calculations
  // ==========================================
  const totalUploaded = documents.length;
  const totalFlashcards = documents.reduce((sum, doc) => sum + (doc.flashcardCount || 0), 0);
  const totalQuizzes = documents.reduce((sum, doc) => sum + (doc.quizCount || 0), 0);
  const totalNotes = documents.reduce((sum, doc) => sum + (doc.status === 'ready' ? 1 : 0), 0);

  // ==========================================
  // Filtering & Sorting
  // ==========================================
  const filteredDocuments = documents
    .filter((doc) => doc.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "newest") return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === "oldest") return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === "title-asc") return a.title.localeCompare(b.title);
      if (sortBy === "title-desc") return b.title.localeCompare(a.title);
      if (sortBy === "flashcards") return (b.flashcardCount || 0) - (a.flashcardCount || 0);
      if (sortBy === "quizzes") return (b.quizCount || 0) - (a.quizCount || 0);
      return 0;
    });

  // ==========================================
  // Main Render
  // ==========================================
  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 relative z-10 animate-in fade-in duration-300">
      
      {/* Hero Header */}
      <div className="relative bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-teal-500/5 blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center gap-5 relative z-10">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-emerald-50 to-emerald-100/50 border border-emerald-100/50 flex items-center justify-center shrink-0 shadow-sm">
            <FolderOpen className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-600" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight font-display">
              Your Study Materials
            </h1>
            <p className="text-slate-500 text-sm mt-1 max-w-xl leading-relaxed font-medium">
              Access your documents, flashcards, quizzes and notes in one place.
            </p>
          </div>
        </div>

        <div className="relative z-10 shrink-0 self-stretch sm:self-auto flex items-center">
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-sm font-semibold rounded-full shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/25 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
          >
            <Plus className="w-4 h-4" strokeWidth={3} />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* Dashboard Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Documents */}
        <div className="bg-white/60 backdrop-blur-xl border border-slate-100 rounded-[20px] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.015)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.03)] hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" strokeWidth={1.5} />
          </div>
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Documents</span>
            <span className="text-2xl font-bold text-slate-800 leading-none">{totalUploaded}</span>
            <span className="text-[10px] text-slate-500 font-medium block mt-0.5">Total uploaded files</span>
          </div>
        </div>

        {/* Total Flashcards */}
        <div className="bg-white/60 backdrop-blur-xl border border-slate-100 rounded-[20px] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.015)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.03)] hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6" strokeWidth={1.5} />
          </div>
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Flashcards</span>
            <span className="text-2xl font-bold text-slate-800 leading-none">{totalFlashcards}</span>
            <span className="text-[10px] text-slate-500 font-medium block mt-0.5">Across all documents</span>
          </div>
        </div>

        {/* Total Quizzes */}
        <div className="bg-white/60 backdrop-blur-xl border border-slate-100 rounded-[20px] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.015)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.03)] hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
            <BrainCircuit className="w-6 h-6" strokeWidth={1.5} />
          </div>
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Quizzes</span>
            <span className="text-2xl font-bold text-slate-800 leading-none">{totalQuizzes}</span>
            <span className="text-[10px] text-slate-500 font-medium block mt-0.5">Across all documents</span>
          </div>
        </div>

        {/* Total Notes */}
        <div className="bg-white/60 backdrop-blur-xl border border-slate-100 rounded-[20px] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.015)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.03)] hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6" strokeWidth={1.5} />
          </div>
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Notes</span>
            <span className="text-2xl font-bold text-slate-800 leading-none">{totalNotes}</span>
            <span className="text-[10px] text-slate-500 font-medium block mt-0.5">Across all documents</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <Spinner />
        </div>
      ) : documents.length === 0 ? (
        /* Empty State */
        <div className="flex items-center justify-center min-h-[50vh] relative py-8">
          <div className="text-center max-w-md bg-white border border-slate-200/60 p-10 rounded-[32px] shadow-[0_12px_40px_rgba(0,0,0,0.02)] relative z-10 hover:shadow-lg transition-shadow duration-300">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-emerald-50/50 blur-xl pointer-events-none" />
            
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-[24px] bg-gradient-to-br from-emerald-50/80 to-teal-50/50 border border-emerald-100/50 text-emerald-600 mb-6 shadow-sm relative">
              <FolderOpen className="w-10 h-10 text-emerald-500" strokeWidth={1.5} />
            </div>

            <h3 className="text-xl font-extrabold text-slate-800 tracking-tight mb-2">
              No study materials yet
            </h3>
            <p className="text-sm text-slate-500 mb-8 leading-relaxed font-medium">
              Upload your first PDF and let CleverPrep generate AI-powered notes, quizzes and flashcards.
            </p>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-4">
              Click "Upload Document" at the top right to start
            </p>
          </div>
        </div>
      ) : (
        /* Library Content (Toolbar + List/Grid) */
        <div className="space-y-6">
          {/* Toolbar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white/80 backdrop-blur-md p-4 rounded-[20px] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
            
            {/* Search */}
            <div className="flex-1">
              <div className={`relative flex items-center transition-all duration-300 ease-out border rounded-xl ${
                isSearchFocused 
                  ? 'w-full md:w-96 ring-4 ring-emerald-500/10 border-emerald-500 shadow-sm' 
                  : 'w-full md:w-72 border-slate-200/80'
              }`}>
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Search size={16} className={`transition-colors duration-200 ${isSearchFocused ? 'text-emerald-500' : 'text-slate-400'}`} />
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  placeholder="Search documents, flashcards..."
                  className="w-full bg-white text-slate-800 text-xs rounded-xl pl-10 pr-12 py-2.5 outline-none border border-transparent placeholder:text-slate-400 font-medium"
                />
                <div className="absolute right-3.5 top-2.5 flex items-center gap-0.5 bg-slate-50 border border-slate-200/60 rounded px-1.5 py-0.5 text-[9px] font-bold text-slate-400 tracking-wider">
                  <span>Ctrl</span><span>K</span>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3 justify-between md:justify-end">
              
              {/* Sort dropdown */}
              <div className="relative flex items-center border border-slate-200/80 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:border-slate-300 transition-colors gap-2 cursor-pointer">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent outline-none cursor-pointer pr-1"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="title-asc">Alphabetical (A-Z)</option>
                  <option value="title-desc">Alphabetical (Z-A)</option>
                  <option value="flashcards">Most Cards</option>
                  <option value="quizzes">Most Quizzes</option>
                </select>
              </div>

              {/* Grid / List toggle */}
              <div className="flex items-center border border-slate-200/80 rounded-xl bg-slate-50 p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-emerald-600 shadow-xs border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-emerald-600 shadow-xs border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                  title="List View"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>


            </div>
          </div>

          {/* Grid or List of Document Cards */}
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-16 bg-white border border-slate-200/60 rounded-3xl max-w-md mx-auto shadow-xs">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-50 text-slate-400 border border-slate-100 mb-4">
                <Search className="w-6 h-6 text-slate-400" />
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-1">No search results</h3>
              <p className="text-xs text-slate-500 px-4 leading-relaxed mb-4">
                No study materials matched "{searchQuery}". Try adjusting your keywords.
              </p>
              <button
                onClick={() => setSearchQuery("")}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
              >
                Clear Search
              </button>
            </div>
          ) : viewMode === "grid" ? (
            /* Grid View */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-2">
              {filteredDocuments.map((doc) => (
                <DocumentCard
                  key={doc._id}
                  document={doc}
                  onDelete={handleDeleteRequest}
                />
              ))}
            </div>
          ) : (
            /* List View */
            <div className="space-y-4 pt-2">
              {filteredDocuments.map((doc) => {
                const docDesc = doc.description || `Interactive guide for ${doc.title}. Flashcards & practice quizzes ready.`;
                return (
                  <div 
                    key={doc._id}
                    className="group relative bg-white border border-slate-200/60 hover:border-emerald-300 rounded-[20px] p-4 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(16,185,129,0.04)] hover:-translate-y-0.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 flex items-center justify-center shrink-0 border border-emerald-100/20">
                        <FileText className="w-6 h-6 text-emerald-500" strokeWidth={1.5} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-800 truncate group-hover:text-emerald-800 transition-colors">
                            {doc.title}
                          </h3>
                          <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-600 text-[9px] font-bold border border-rose-100/50 uppercase tracking-wider">
                            PDF
                          </span>
                        </div>
                        <p className="text-[10px] font-semibold text-slate-400 mt-0.5">
                          Uploaded {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : "Recently"}
                        </p>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-1 hidden md:block">
                          {docDesc}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto shrink-0 border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0">
                      {/* Stats */}
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className="text-xs font-bold text-slate-800">{doc.flashcardCount || 0}</p>
                          <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Cards</p>
                        </div>
                        <div className="text-center border-l border-r border-slate-100 px-4">
                          <p className="text-xs font-bold text-slate-800">{doc.quizCount || 0}</p>
                          <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Quizzes</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-bold text-slate-800">{doc.status === 'ready' ? 1 : 0}</p>
                          <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Notes</p>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleNavigate(doc._id, 'Content')}
                          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-semibold rounded-xl transition-all duration-200 shadow-sm"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Read</span>
                        </button>
                        <button
                          onClick={() => handleDeleteRequest(doc)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors border border-transparent hover:border-red-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}


        </div>
      )}

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-white/95 backdrop-blur-xl border border-slate-200/60 rounded-3xl shadow-2xl p-8 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsUploadModalOpen(false)}
              className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition-all duration-200"
            >
              <X className="w-5 h-5" strokeWidth={2} />
            </button>

            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Upload New Document
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Add a PDF document to your library
              </p>
            </div>

            <form onSubmit={handleUpload} className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wide">
                  Document Title
                </label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  required
                  className="w-full h-12 px-4 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-800 placeholder-slate-400 text-xs font-semibold transition-all duration-200 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/5"
                  placeholder="e.g., React Interview Prep"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wide">
                  PDF File
                </label>
                <div className="relative border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 hover:border-emerald-400 transition-all duration-200">
                  <input
                    id="file-upload"
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    onChange={handleFileChange}
                    accept=".pdf"
                  />
                  <div className="flex flex-col items-center justify-center py-8 px-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 flex items-center justify-center mb-3">
                      <Upload className="w-6 h-6 text-emerald-600" strokeWidth={2} />
                    </div>
                    <p className="text-xs font-semibold text-slate-700 mb-1 text-center">
                      {uploadFile ? (
                        <span className="text-emerald-600">{uploadFile.name}</span>
                      ) : (
                        <>
                          <span className="text-emerald-600">Click to upload</span> or drag & drop
                        </>
                      )}
                    </p>
                    <p className="text-[10px] text-slate-400">PDF up to 10MB</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  disabled={uploading}
                  className="flex-1 h-11 border border-slate-200 rounded-xl bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 h-11 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-semibold rounded-xl transition-all duration-200 shadow-md shadow-emerald-500/10 disabled:opacity-50"
                >
                  {uploading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Uploading...
                    </span>
                  ) : (
                    "Upload"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
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
              Are you sure you want to delete this document:{" "}
              <span className="font-bold text-slate-800">
                {selectedDoc?.title}
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

export default DocumentListPage;