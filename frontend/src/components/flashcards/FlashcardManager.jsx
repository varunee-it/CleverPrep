import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Plus,
    ChevronLeft,
    ChevronRight,
    Trash2,
    ArrowLeft,
    Sparkles,
    Brain,
    Search,
    Flame,
    Award,
    Clock,
    BookOpen,
    MessageSquare,
    Headphones,
    Wand2,
    Sliders,
    ChevronDown,
    ChevronUp,
    Bookmark,
    Activity,
    Info,
    RotateCcw
} from "lucide-react";
import toast from "react-hot-toast";
import moment from "moment";

import flashcardService from "../../services/flashcardService";
import aiService from "../../services/aiService";
import Spinner from "../common/Spinner";
import Modal from "../common/Modal";
import Flashcard from "./Flashcard";

const FlashcardManager = ({ documentId, onTabChange }) => {
    console.log("FlashcardManager rendered");

    // Core sets & selection states
    const [flashcardSets, setFlashcardSets] = useState([]);
    const [selectedSet, setSelectedSet] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [setToDelete, setSetToDelete] = useState(null);

    // Premium Generation Settings Modal
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [genPercent, setGenPercent] = useState(10);
    const [genLabel, setGenLabel] = useState("Reading document...");

    // Selection values for AI custom generation
    const [studyMode, setStudyMode] = useState("Balanced Study");
    const [cardCount, setCardCount] = useState("10");
    const [difficulty, setDifficulty] = useState("Intermediate");
    const [rememberPrefs, setRememberPrefs] = useState(true);
    const [isAdvancedExpanded, setIsAdvancedExpanded] = useState(false);

    // Active Study Deck states
    const [filteredDeck, setFilteredDeck] = useState([]);
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    // Search and Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState("All");

    // Session Metrics & Streaks
    const [startTime, setStartTime] = useState(null);
    const [cardStartTime, setCardStartTime] = useState(null);
    const [responseTimes, setResponseTimes] = useState([]);
    const [sessionFinished, setSessionFinished] = useState(false);
    const [viewedCardIds, setViewedCardIds] = useState(new Set());

    // Load preferences from localStorage on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem("cleverprep_flashcard_prefs");
            if (saved) {
                const parsed = JSON.parse(saved);
                setStudyMode(parsed.studyMode || "Balanced Study");
                setCardCount(parsed.cardCount || "10");
                setDifficulty(parsed.difficulty || "Intermediate");
                setRememberPrefs(parsed.rememberPrefs !== false);
            }
        } catch (e) {
            console.error("Failed to load preferences from localStorage", e);
        }
    }, []);

    // Save preferences to localStorage if enabled
    const savePrefsToStorage = (prefs) => {
        if (prefs.rememberPrefs) {
            localStorage.setItem("cleverprep_flashcard_prefs", JSON.stringify(prefs));
        } else {
            localStorage.removeItem("cleverprep_flashcard_prefs");
        }
    };

    const fetchFlashcardSets = async () => {
        setLoading(true);
        try {
            const response = await flashcardService.getFlashcardsForDocument(documentId);
            const data = response.data?.data || response.data || [];
            setFlashcardSets(Array.isArray(data) ? data : []);
        } catch (error) {
            toast.error("Failed to fetch flashcard sets.");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (documentId) {
            fetchFlashcardSets();
        }
    }, [documentId]);

    // Handle Generation Action
    const handleGenerateSubmit = async () => {
        const prefs = {
            studyMode,
            cardCount,
            difficulty,
            rememberPrefs
        };

        savePrefsToStorage(prefs);
        setGenerating(true);
        setGenPercent(10);
        setGenLabel("Reading document...");

        // Setup progressive loader milestones
        const timers = [
            setTimeout(() => {
                setGenPercent(30);
                setGenLabel("Understanding concepts...");
            }, 1800),
            setTimeout(() => {
                setGenPercent(60);
                setGenLabel("Generating flashcards...");
            }, 3800),
            setTimeout(() => {
                setGenPercent(85);
                setGenLabel("Preparing study session...");
            }, 6800)
        ];

        try {
            await aiService.generateFlashcards(documentId, {
                count: cardCount,
                studyMode,
                difficulty
            });

            // Clear progress intervals
            timers.forEach(t => clearTimeout(t));

            setGenPercent(100);
            setGenLabel("Success!");

            setTimeout(() => {
                toast.success("Flashcards created successfully!");
                fetchFlashcardSets();
                setGenerating(false);
                setIsConfigModalOpen(false);
            }, 500);

        } catch (error) {
            timers.forEach(t => clearTimeout(t));
            setGenerating(false);
            toast.error(error.message || "Failed to generate flashcards.");
        }
    };

    // Initialize filtered deck from selectedSet cards, search, and filters
    useEffect(() => {
        if (!selectedSet || !selectedSet.cards) {
            setFilteredDeck([]);
            return;
        }

        let deck = [...selectedSet.cards];

        // Apply Search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            deck = deck.filter(c => 
                (c.question && c.question.toLowerCase().includes(query)) ||
                (c.answer && c.answer.toLowerCase().includes(query))
            );
        }

        // Apply filters
        if (activeFilter !== "All") {
            if (activeFilter === "Bookmarked") {
                deck = deck.filter(c => c.isStarred);
            } else {
                const diffLower = activeFilter.toLowerCase();
                deck = deck.filter(c => {
                    const cardDiff = String(c.difficulty || "medium").toLowerCase();
                    if (diffLower === "beginner") return cardDiff === "easy" || cardDiff === "beginner";
                    if (diffLower === "advanced") return cardDiff === "hard" || cardDiff === "advanced";
                    return cardDiff === "medium" || cardDiff === "intermediate";
                });
            }
        }

        setFilteredDeck(deck);
        setCurrentCardIndex(0);
        setIsFlipped(false);
    }, [selectedSet, searchQuery, activeFilter]);

    // Flip resets when current card changes
    useEffect(() => {
        setIsFlipped(false);
        setCardStartTime(Date.now());
    }, [currentCardIndex, filteredDeck]);

    // Unique viewed cards tracking
    useEffect(() => {
        if (filteredDeck.length > 0 && filteredDeck[currentCardIndex]) {
            setViewedCardIds(prev => {
                const nextSet = new Set(prev);
                nextSet.add(filteredDeck[currentCardIndex]._id);
                return nextSet;
            });
        }
    }, [currentCardIndex, filteredDeck]);

    // Keyboard Shortcuts effect
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!selectedSet || filteredDeck.length === 0 || sessionFinished) return;

            // Avoid triggers when typing in text fields
            if (
                document.activeElement.tagName === 'INPUT' ||
                document.activeElement.tagName === 'TEXTAREA' ||
                document.activeElement.isContentEditable
            ) {
                return;
            }

            switch (e.key) {
                case ' ':
                    e.preventDefault();
                    setIsFlipped((prev) => !prev);
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    handlePrevCard();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    handleNextCard();
                    break;
                default:
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [selectedSet, isFlipped, currentCardIndex, filteredDeck, sessionFinished]);

    const handleNextCard = () => {
        // Record elapsed response time
        if (cardStartTime) {
            const elapsed = Date.now() - cardStartTime;
            setResponseTimes(prev => [...prev, elapsed]);
        }

        if (currentCardIndex < filteredDeck.length - 1) {
            setCurrentCardIndex(prev => prev + 1);
        } else {
            handleCompleteSession();
        }
    };

    const handlePrevCard = () => {
        if (currentCardIndex > 0) {
            setCurrentCardIndex(prev => prev - 1);
        }
    };

    // Calculate metrics and save analytics to server
    const handleCompleteSession = async () => {
        setSessionFinished(true);
        const duration = Math.round((Date.now() - startTime) / 1000);
        const bookmarked = filteredDeck.filter(c => c.isStarred).length;
        const avgTime = responseTimes.length > 0 
            ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) 
            : 0;

        try {
            await flashcardService.saveSessionAnalytics(selectedSet._id, {
                studyDuration: duration,
                cardsReviewed: viewedCardIds.size,
                cardsBookmarked: bookmarked,
                againCount: 0,
                goodCount: viewedCardIds.size,
                easyCount: 0,
                avgResponseTime: avgTime
            });
            console.log("Session analytics saved successfully.");
        } catch (error) {
            console.error("Failed to save session analytics", error);
        }
    };

    const handleToggleStar = async (cardId) => {
        try {
            const currentCard = selectedSet.cards.find(c => c._id === cardId);
            const wasStarred = currentCard?.isStarred;

            await flashcardService.toggleStar(cardId);

            const updatedSets = flashcardSets.map((set) => {
                if (set._id === selectedSet._id) {
                    const updatedCards = set.cards.map((card) =>
                        card._id === cardId ? { ...card, isStarred: !card.isStarred } : card
                    );
                    return { ...set, cards: updatedCards };
                }
                return set;
            });

            setFlashcardSets(updatedSets);
            setSelectedSet(updatedSets.find((set) => set._id === selectedSet._id));

            if (!wasStarred) {
                toast.success("Saved for Revision ⭐");
            } else {
                toast.success("Removed from Revision");
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to update star status.");
        }
    };

    const handleDeleteRequest = (e, set) => {
        e.stopPropagation();
        setSetToDelete(set);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!setToDelete) return;

        setDeleting(true);
        try {
            await flashcardService.deleteFlashcardSet(setToDelete._id);
            toast.success("Flashcard set deleted successfully!");
            setIsDeleteModalOpen(false);
            setSetToDelete(null);
            fetchFlashcardSets();
        } catch (error) {
            toast.error(error.message || "Failed to delete flashcard set.");
        } finally {
            setDeleting(false);
        }
    };

    const handleSelectSet = (set) => {
        setSelectedSet(set);
        setCurrentCardIndex(0);
        setStartTime(Date.now());
        setCardStartTime(Date.now());
        setResponseTimes([]);
        setSessionFinished(false);
        setViewedCardIds(new Set([set.cards[0]?._id].filter(Boolean)));
    };

    const resetStudyMode = () => {
        setCurrentCardIndex(0);
        setIsFlipped(false);
        setStartTime(Date.now());
        setCardStartTime(Date.now());
        setResponseTimes([]);
        setSessionFinished(false);
        setViewedCardIds(new Set([filteredDeck[0]?._id].filter(Boolean)));
    };

    // Redirect trigger to workspace tabs
    const handleWorkspaceRedirect = (tabId) => {
        if (onTabChange) {
            onTabChange(tabId);
        } else {
            // route back to document details with active tab parameter
            window.location.href = `/documents/${documentId}?tab=${tabId}`;
        }
    };

    // Confetti rain overlay
    const ConfettiRain = () => {
        const colors = ['bg-emerald-500', 'bg-blue-500', 'bg-amber-500', 'bg-rose-500', 'bg-teal-500', 'bg-indigo-500'];
        const particles = useMemo(() => Array.from({ length: 45 }).map((_, i) => {
            const left = `${Math.random() * 100}%`;
            const delay = `${Math.random() * 2}s`;
            const duration = `${2.5 + Math.random() * 2.5}s`;
            const color = colors[Math.floor(Math.random() * colors.length)];
            const size = Math.random() > 0.5 ? 'w-2 h-4 rounded-xs' : 'w-3 h-3 rounded-full';
            return (
                <div
                    key={i}
                    className={`absolute top-0 animate-confetti pointer-events-none opacity-0 ${color} ${size}`}
                    style={{
                        left,
                        '--fall-duration': duration,
                        animationDelay: delay,
                    }}
                />
            );
        }), []);

        return (
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-50">
                {particles}
            </div>
        );
    };

    const renderFlashcardViewer = () => {
        const totalCards = filteredDeck.length;

        if (sessionFinished) {
            const duration = Math.round((Date.now() - startTime) / 1000);
            const minutes = Math.floor(duration / 60);
            const seconds = duration % 60;
            const completionPct = totalCards > 0 ? Math.round((viewedCardIds.size / totalCards) * 100) : 0;
            const bookmarkedCount = filteredDeck.filter(c => c.isStarred).length;

            return (
                <div className="relative space-y-8 max-w-2xl mx-auto w-full pt-4 text-center select-none">
                    <ConfettiRain />

                    {/* Completion Title */}
                    <div className="space-y-2 animate-in fade-in zoom-in duration-500">
                        <span className="text-5xl" role="img" aria-label="party">🎉</span>
                        <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">
                            Great Job!
                        </h2>
                        <p className="text-slate-500 font-semibold text-sm">
                            Study Session Complete. Excellent progress!
                        </p>
                    </div>

                    {/* Simplified Metric Cards Grid */}
                    <div className="grid grid-cols-2 gap-4 pt-4">
                        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                Cards Studied
                            </span>
                            <span className="text-3xl font-black text-slate-800">
                                {viewedCardIds.size}
                            </span>
                        </div>
                        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                Bookmarked Cards
                            </span>
                            <span className="text-3xl font-black text-amber-500">
                                {bookmarkedCount}
                            </span>
                        </div>
                        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                Time Spent
                            </span>
                            <span className="text-3xl font-black text-slate-800">
                                {minutes > 0 ? `${minutes}m ` : ""}{seconds}s
                            </span>
                        </div>
                        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                Completion Rate
                            </span>
                            <span className="text-3xl font-black text-emerald-600">
                                {completionPct}%
                            </span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3 pt-6 border-t border-slate-100">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <button
                                onClick={resetStudyMode}
                                className="flex items-center justify-center gap-2 h-12 rounded-xl border-2 border-slate-200 hover:border-slate-300 bg-white text-slate-700 font-bold text-sm transition-all duration-200 active:scale-98 shadow-xs hover:shadow-md outline-hidden"
                            >
                                <RotateCcw className="w-4.5 h-4.5 text-slate-500" />
                                Study Again
                            </button>
                            <button
                                onClick={() => setIsConfigModalOpen(true)}
                                className="flex items-center justify-center gap-2 h-12 rounded-xl bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-sm transition-all duration-200 active:scale-98 shadow-md hover:shadow-lg hover:shadow-emerald-500/15 outline-hidden"
                            >
                                <Sparkles className="w-4.5 h-4.5" />
                                Generate New Set
                            </button>
                            <button
                                onClick={() => handleWorkspaceRedirect('Summary')}
                                className="flex items-center justify-center gap-2 h-12 rounded-xl border-2 border-slate-200 hover:border-slate-300 bg-white text-slate-700 font-bold text-sm transition-all duration-200 active:scale-98 shadow-xs hover:shadow-md outline-hidden"
                            >
                                <Wand2 className="w-4.5 h-4.5 text-slate-500" />
                                Return to Dashboard
                            </button>
                        </div>
                    </div>

                    {/* Smart Study Flow - Continue Learning */}
                    <div className="space-y-4 pt-6 border-t border-slate-100">
                        <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                            <Activity className="w-4 h-4 text-emerald-500" />
                            <span>Continue Learning Journey</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <button
                                onClick={() => handleWorkspaceRedirect('Chat')}
                                className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-all hover:shadow-sm gap-2 outline-hidden"
                            >
                                <MessageSquare className="w-5 h-5 text-emerald-500" />
                                <span className="text-xs font-bold text-slate-700">Open AI Tutor</span>
                            </button>
                            <button
                                onClick={() => handleWorkspaceRedirect('Quizzes')}
                                className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-all hover:shadow-sm gap-2 outline-hidden"
                            >
                                <Award className="w-5 h-5 text-emerald-500" />
                                <span className="text-xs font-bold text-slate-700">Start AI Quiz</span>
                            </button>
                            <button
                                onClick={() => handleWorkspaceRedirect('Podcast')}
                                className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-all hover:shadow-sm gap-2 outline-hidden"
                            >
                                <Headphones className="w-5 h-5 text-emerald-500" />
                                <span className="text-xs font-bold text-slate-700">AI Study Session</span>
                            </button>
                            <button
                                onClick={() => handleWorkspaceRedirect('Summary')}
                                className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-all hover:shadow-sm gap-2 outline-hidden"
                            >
                                <Wand2 className="w-5 h-5 text-emerald-500" />
                                <span className="text-xs font-bold text-slate-700">Smart Notes</span>
                            </button>
                        </div>
                    </div>

                    <div className="pt-6">
                        <button
                            onClick={() => setSelectedSet(null)}
                            className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-700 font-semibold text-sm transition-colors outline-hidden cursor-pointer"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Return to Flashcard Sets
                        </button>
                    </div>
                </div>
            );
        }

        // Render card stack study view
        const currentCard = filteredDeck[currentCardIndex];

        // If filtering leaves the deck empty
        if (totalCards === 0) {
            return (
                <div className="max-w-md mx-auto py-16 px-6 text-center select-none">
                    <span className="text-5xl block mb-4" role="img" aria-label="not-found">🔍</span>
                    <h4 className="text-lg font-bold text-slate-800 mb-1">
                        No Matching Flashcards
                    </h4>
                    <p className="text-sm text-slate-400 mb-6">
                        Try modifying your active filter or search query to load matching cards.
                    </p>
                    <button
                        onClick={() => { setSearchQuery(""); setActiveFilter("All"); }}
                        className="px-5 h-11 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-sm rounded-xl transition-all outline-hidden"
                    >
                        Reset Search & Filters
                    </button>
                </div>
            );
        }

        const cardsReviewed = currentCardIndex;
        const cardsRemaining = totalCards - cardsReviewed;
        const completionPct = totalCards > 0 ? Math.round((viewedCardIds.size / totalCards) * 100) : 0;

        const hasInsights = selectedSet.insights && Object.keys(selectedSet.insights).length > 0;

        return (
            <div className="space-y-6 max-w-3xl mx-auto w-full pt-1">
                {/* Header Back Button */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => setSelectedSet(null)}
                        className="group inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors outline-hidden cursor-pointer"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" />
                        Back to Flashcard Sets
                    </button>
                </div>

                {/* AI Insights Card (Conditional on Generation Metadata) */}
                {hasInsights && (
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs relative overflow-hidden flex items-center gap-3.5 select-none">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full -mr-6 -mt-6 select-none pointer-events-none" />
                        <span className="text-xl shrink-0 select-none">🧠</span>
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5 flex-1 min-w-0">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                                AI Study Insights:
                            </h4>
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">📊 Complexity</span>
                                <span className="text-xs font-extrabold text-slate-700 bg-slate-100 border border-slate-200/60 px-2.5 py-0.5 rounded-md">
                                    {selectedSet.insights.complexity || "Medium"}
                                </span>
                            </div>
                            {selectedSet.insights.docLengthNotice && (
                                <p className="text-xs font-semibold text-emerald-600/90 flex items-center gap-1.5 ml-auto">
                                    <Info className="w-3.5 h-3.5 shrink-0" />
                                    {selectedSet.insights.docLengthNotice}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Live Search & Filter Toolbar */}
                <div className="flex flex-col md:flex-row gap-3 bg-white border border-slate-200/80 rounded-2xl p-3 shadow-xs">
                    {/* Search Field */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search flashcards..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl text-sm font-semibold text-slate-700 focus:ring-1 focus:ring-emerald-500 outline-hidden"
                        />
                    </div>
                    {/* Filters Pill Row */}
                    <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar">
                        {["All", "Bookmarked", "Beginner", "Intermediate", "Advanced"].map((filterOpt) => (
                            <button
                                key={filterOpt}
                                onClick={() => setActiveFilter(filterOpt)}
                                className={`h-9 px-4.5 rounded-lg text-xs font-bold border whitespace-nowrap transition-all outline-hidden ${
                                    activeFilter === filterOpt
                                        ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                                }`}
                            >
                                {filterOpt}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Rebalanced Spacing-Efficient metrics HUD */}
                <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs select-none">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Mastered Progress Indicator */}
                        <div className="space-y-1 md:border-r md:border-slate-100 md:pr-6">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Today's Progress</span>
                            <div className="flex items-center justify-between text-slate-800 font-extrabold text-sm mb-1.5">
                                <span>{viewedCardIds.size} / {totalCards} cards viewed</span>
                                <span>{completionPct}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-emerald-500 transition-all duration-500 ease-out"
                                    style={{ width: `${completionPct}%` }}
                                />
                            </div>
                        </div>

                        {/* Remaining count */}
                        <div className="space-y-0.5 md:pl-6 flex flex-col justify-center">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Remaining</span>
                            <div className="flex items-baseline gap-1.5 mt-0.5">
                                <span className="text-2xl font-black text-slate-800">{cardsRemaining}</span>
                                <span className="text-xs text-slate-400 font-bold">cards left in active deck</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Lazy-Rendered Flashcard Display Stack */}
                <div className="flex flex-col items-center">
                    <div className="w-full relative min-h-[440px] sm:min-h-[480px]">
                        {filteredDeck.map((card, idx) => {
                            const isVisible = idx === currentCardIndex || idx === currentCardIndex - 1 || idx === currentCardIndex + 1;
                            if (!isVisible) return null;

                            return (
                                <div 
                                    key={card._id}
                                    className={`w-full absolute inset-0 ${idx === currentCardIndex ? 'block pointer-events-auto z-10' : 'hidden pointer-events-none'}`}
                                >
                                    <Flashcard
                                        flashcard={card}
                                        onToggleStar={handleToggleStar}
                                        isFlipped={isFlipped}
                                        onFlip={setIsFlipped}
                                    />
                                </div>
                            );
                        })}
                    </div>
                    
                    {/* Centered Premium Navigation Controls */}
                    <div className="w-full mt-5 flex justify-center items-center gap-6 select-none animate-in fade-in duration-300">
                        <button
                            onClick={handlePrevCard}
                            disabled={currentCardIndex === 0}
                            className="w-13 h-13 rounded-full border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white disabled:hover:translate-y-0 transition-all duration-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 active:scale-95 text-slate-500 hover:text-slate-800 flex items-center justify-center focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 outline-hidden"
                            aria-label="Previous card (Left Arrow)"
                        >
                            <ChevronLeft className="w-6 h-6" strokeWidth={2.5} />
                        </button>
                        <span className="text-sm font-bold text-slate-500 bg-slate-100 border border-slate-200 px-4 py-2 rounded-full min-w-[85px] text-center">
                            {currentCardIndex + 1} / {totalCards}
                        </span>
                        <button
                            onClick={handleNextCard}
                            className="w-13 h-13 rounded-full border border-slate-200 bg-white hover:bg-slate-50 transition-all duration-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 active:scale-95 text-slate-500 hover:text-slate-800 flex items-center justify-center focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 outline-hidden"
                            aria-label="Next card (Right Arrow)"
                        >
                            <ChevronRight className="w-6 h-6" strokeWidth={2.5} />
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderSetList = () => {
        if (loading) {
            return (
                <div className="flex items-center justify-center py-20">
                    <Spinner />
                </div>
            );
        }

        if (flashcardSets.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center py-16 px-6 bg-white border border-slate-200 rounded-3xl shadow-sm text-center">
                    <span className="text-6xl mb-6 select-none animate-pulse" role="img" aria-label="brain">🧠</span>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">
                        No flashcards generated yet.
                    </h3>
                    <p className="text-sm text-slate-500 max-w-sm mb-6 leading-relaxed">
                        Reinforce your knowledge by generating custom flashcards based on this document.
                    </p>
                    <button
                        onClick={() => setIsConfigModalOpen(true)}
                        className="group inline-flex items-center gap-2 px-6 h-12 bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold text-sm rounded-xl transition-all duration-200 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/35 hover:-translate-y-0.5 active:scale-95 outline-hidden"
                    >
                        <Sparkles className="w-4 h-4" strokeWidth={2} />
                        Generate Flashcards
                    </button>
                </div>
            );
        }

        return (
            <div className="space-y-6 select-none">
                {/* Header with Generate Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">
                            Your Flashcard Sets
                        </h3>
                        <p className="text-sm text-slate-500 mt-0.5">
                            {flashcardSets.length}{" "}
                            {flashcardSets.length === 1 ? "set" : "sets"} available
                        </p>
                    </div>

                    <button
                        onClick={() => setIsConfigModalOpen(true)}
                        className="group inline-flex items-center justify-center gap-2 px-5 h-11 bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold text-sm rounded-xl transition-all duration-200 shadow-lg shadow-emerald-500/25 active:scale-95 outline-hidden"
                    >
                        <Plus className="w-4 h-4" strokeWidth={2.5} />
                        Generate New Set
                    </button>
                </div>

                {/* Flashcard Sets Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.isArray(flashcardSets) && flashcardSets.map((set) => (
                        <div
                            key={set._id}
                            onClick={() => handleSelectSet(set)}
                            className="group relative bg-white border-2 border-slate-200 hover:border-emerald-300 rounded-2xl p-6 cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/10"
                        >
                            {/* Delete Button */}
                            <button
                                onClick={(e) => handleDeleteRequest(e, set)}
                                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100 outline-hidden"
                            >
                                <Trash2 className="w-4 h-4" strokeWidth={2} />
                            </button>

                            {/* Set Content */}
                            <div className="space-y-4">
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-linear-to-br from-emerald-100 to-teal-100">
                                    <Brain className="w-6 h-6 text-emerald-600" strokeWidth={2} />
                                </div>

                                <div>
                                    <h4 className="text-base font-semibold text-slate-900 mb-1">
                                        Flashcard Set
                                    </h4>
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                                        Created {moment(set.createdAt).format("MMM D, YYYY")}
                                    </p>
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                    <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                                        <span className="text-sm font-semibold text-emerald-700">
                                            {set.cards.length} {set.cards.length === 1 ? "card" : "cards"}
                                        </span>
                                    </div>
                                    {set.settings && (
                                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-sm uppercase tracking-wider block">
                                            {set.settings.studyMode || "Balanced"}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    };

    const studyModesList = [
        { id: "Quick Revision", icon: "⚡", label: "Quick Revision", desc: "Focus on the most important concepts." },
        { id: "Balanced Study", icon: "📘", label: "Balanced Study", desc: "Balanced coverage of the document.", recommended: true },
        { id: "Deep Learning", icon: "🎓", label: "Deep Learning", desc: "More detailed conceptual learning." },
        { id: "Exam Preparation", icon: "📝", label: "Exam Prep", desc: "Definitions, facts, and revision-oriented questions." }
    ];

    const countOptionsList = [
        { id: "5", count: "5", label: "Cards", time: "~30 seconds" },
        { id: "10", count: "10", label: "Cards", time: "~1 minute" },
        { id: "15", count: "15", label: "Cards", time: "~2 minutes" },
        { id: "20", count: "20", label: "Cards", time: "~3 minutes" }
    ];

    return (
        <>
            <div className="bg-white border border-slate-200/60 rounded-3xl shadow-xl shadow-slate-200/50 p-6 sm:p-8">
                {selectedSet ? renderFlashcardViewer() : renderSetList()}
            </div>

            {/* Config & Custom Preferences Modal */}
            <Modal
                isOpen={isConfigModalOpen}
                onClose={() => { if (!generating) setIsConfigModalOpen(false); }}
                title={generating ? "Creating Flashcards..." : "🧠 Create AI Flashcards"}
            >
                {generating ? (
                    <div className="space-y-6 py-6 text-center select-none">
                        {/* Progressive Milestone Loader */}
                        <div className="relative w-20 h-20 mx-auto mb-4 flex items-center justify-center bg-emerald-50 rounded-full border-2 border-emerald-100 shadow-sm animate-pulse">
                            <Brain className="w-10 h-10 text-emerald-600" />
                        </div>
                        
                        <div className="space-y-2">
                            <h3 className="text-lg font-bold text-slate-800">
                                {genLabel}
                            </h3>
                            <p className="text-sm text-slate-500 font-semibold">
                                Please wait while Gemini crafts your premium study cards.
                            </p>
                        </div>

                        {/* Milestone Progress Bar */}
                        <div className="w-full space-y-1">
                            <div className="flex justify-between text-xs font-bold text-slate-400 px-1">
                                <span>Generating Progress</span>
                                <span>{genPercent}%</span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-emerald-500 transition-all duration-1000 ease-out"
                                    style={{ width: `${genPercent}%` }}
                                />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6 select-none animate-in fade-in duration-300">
                        <p className="text-sm text-slate-500 font-semibold">
                            Customize how you'd like your AI flashcards to be generated.
                        </p>

                        {/* Study Mode Selector */}
                        <div className="space-y-2.5">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">
                                Study Mode
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {studyModesList.map((mode) => {
                                    const isSelected = studyMode === mode.id;
                                    return (
                                        <div
                                            key={mode.id}
                                            onClick={() => setStudyMode(mode.id)}
                                            className={`relative border-2 rounded-2xl p-4.5 cursor-pointer transition-all duration-300 flex items-start gap-3.5 hover:shadow-md ${
                                                isSelected
                                                    ? 'border-emerald-500 bg-emerald-50/40 shadow-md shadow-emerald-500/10 -translate-y-0.5 scale-[1.01]'
                                                    : 'border-slate-200 hover:border-slate-300 bg-white hover:-translate-y-0.5'
                                            }`}
                                        >
                                            {mode.recommended && !isSelected && (
                                                <span className="absolute top-2 right-2 text-[9px] font-black uppercase text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-sm">
                                                    ★ Recommended
                                                </span>
                                            )}
                                            <span className="text-2xl pt-0.5 select-none shrink-0">{mode.icon}</span>
                                            <div className="min-w-0">
                                                <h5 className="text-sm font-bold text-slate-800 leading-tight">{mode.label}</h5>
                                                <p className="text-xs text-slate-400 leading-normal mt-1 font-medium">{mode.desc}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Premium Sized Card Count Selector */}
                        <div className="space-y-2.5">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">
                                Flashcard Count
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {countOptionsList.map((c) => {
                                    const isSelected = cardCount === c.id;
                                    return (
                                        <div
                                            key={c.id}
                                            onClick={() => setCardCount(c.id)}
                                            className={`relative border-2 rounded-2xl p-6 cursor-pointer text-center flex flex-col justify-center items-center gap-3 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 min-h-[140px] ${
                                                isSelected
                                                    ? 'border-emerald-500 bg-emerald-50/40 text-emerald-800 shadow-md shadow-emerald-500/10'
                                                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600'
                                            }`}
                                        >
                                            <div className="flex flex-col items-center justify-center">
                                                <span className="text-4xl font-extrabold tracking-tight font-display">
                                                    {c.count}
                                                </span>
                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1 block">
                                                    {c.label}
                                                </span>
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 rounded-md py-1 px-2.5 border border-slate-200/60 inline-block">
                                                {c.time}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Collapsible Advanced Options (Difficulty Only) */}
                        <div className="border border-slate-200 rounded-2xl p-4.5 space-y-3.5 bg-slate-50/40">
                            <button
                                type="button"
                                onClick={() => setIsAdvancedExpanded(p => !p)}
                                className="w-full flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-widest outline-hidden"
                            >
                                <span className="flex items-center gap-2">
                                    <Sliders className="w-4 h-4 text-slate-400" />
                                    Advanced Options
                                </span>
                                {isAdvancedExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>

                            {isAdvancedExpanded && (
                                <div className="space-y-4 pt-4 border-t border-slate-200/80 animate-in fade-in duration-200">
                                    <div className="space-y-2">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Difficulty</span>
                                        <div className="flex gap-2">
                                            {["Beginner", "Intermediate", "Advanced"].map((lvl) => (
                                                <button
                                                    key={lvl}
                                                    type="button"
                                                    onClick={() => setDifficulty(lvl)}
                                                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all duration-200 outline-hidden ${
                                                        difficulty === lvl
                                                            ? 'border-emerald-500 bg-emerald-500 text-white shadow-xs'
                                                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                                                    }`}
                                                >
                                                    {lvl === "Intermediate" ? "Intermediate ★" : lvl}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Remember Preferences */}
                        <div className="flex items-center justify-between pt-2">
                            <label className="flex items-center gap-3 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={rememberPrefs}
                                    onChange={(e) => setRememberPrefs(e.target.checked)}
                                    className="w-4.5 h-4.5 rounded-sm border-slate-300 text-emerald-600 focus:ring-emerald-500 accent-emerald-500"
                                />
                                <span className="text-xs font-bold text-slate-500">Remember my preferences</span>
                            </label>
                        </div>

                        {/* Modal Action Buttons */}
                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setIsConfigModalOpen(false)}
                                className="px-5 h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all outline-hidden"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleGenerateSubmit}
                                className="group inline-flex items-center gap-2 px-5 h-11 bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-emerald-500/25 outline-hidden"
                            >
                                <Sparkles className="w-4.5 h-4.5" />
                                Generate Flashcards
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Delete Flashcard Set?"
            >
                <div className="space-y-6 select-none">
                    <p className="text-sm text-slate-600">
                        Are you sure you want to delete this flashcard set? This action
                        cannot be undone and all cards will be permanently removed.
                    </p>
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => setIsDeleteModalOpen(false)}
                            disabled={deleting}
                            className="px-5 h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed outline-hidden"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirmDelete}
                            disabled={deleting}
                            className="px-5 h-11 bg-linear-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 text-white font-semibold text-xs rounded-xl transition-all shadow-lg shadow-rose-500/25 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 outline-hidden"
                        >
                            {deleting ? (
                                <span className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Deleting...
                                </span>
                            ) : (
                                "Delete Set"
                            )}
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    )
}

export default FlashcardManager;