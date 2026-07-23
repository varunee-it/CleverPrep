import React, { useState, useEffect } from "react";
import { Star, RotateCcw } from "lucide-react";

const Flashcard = React.memo(({ flashcard, onToggleStar, isFlipped, onFlip }) => {
    const [isAnimating, setIsAnimating] = useState(false);
    const [sparkleActive, setSparkleActive] = useState(false);

    // Track flip changes to apply scaling bounce animation
    useEffect(() => {
        setIsAnimating(true);
        const timer = setTimeout(() => setIsAnimating(false), 600);
        return () => clearTimeout(timer);
    }, [isFlipped]);

    // Star sparkle animation trigger
    useEffect(() => {
        if (flashcard.isStarred) {
            setSparkleActive(true);
            const timer = setTimeout(() => setSparkleActive(false), 600);
            return () => clearTimeout(timer);
        }
    }, [flashcard.isStarred]);

    const handleFlip = () => {
        if (isAnimating) return;
        onFlip(!isFlipped);
    };

    // Determine difficulty label and badge color
    const getDifficultyInfo = () => {
        const diff = String(flashcard.difficulty || "medium").toLowerCase();
        if (diff === "easy" || diff === "beginner") {
            return { label: "Beginner", classes: "bg-green-50 text-green-700 border-green-200/80" };
        }
        if (diff === "hard" || diff === "advanced") {
            return { label: "Advanced", classes: "bg-red-50 text-red-700 border-red-200/80" };
        }
        return { label: "Intermediate", classes: "bg-amber-50 text-amber-700 border-amber-200/80" };
    };

    const diffInfo = getDifficultyInfo();

    return (
        <div
            className="relative w-full h-[440px] sm:h-[480px] perspective-1200 outline-hidden"
            onClick={handleFlip}
            tabIndex={0}
            role="button"
            aria-label={`Flashcard: ${isFlipped ? "Answer side" : "Question side"}. Press Space or click to flip.`}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleFlip();
                }
            }}
        >
            <div
                className={`relative w-full h-full spring-flip-gpu preserve-3d cursor-pointer select-none
                    ${isFlipped ? '[transform:rotateY(180deg)]' : '[transform:rotateY(0deg)]'}
                    ${isAnimating ? 'scale-[1.03] shadow-2xl' : 'hover:scale-[1.01] hover:shadow-lg'}`}
            >
                {/* Front Side (Question) */}
                <div
                    className="absolute inset-0 w-full h-full bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-10 flex flex-col justify-between"
                    style={{
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        transform: 'rotateY(0deg)'
                    }}
                >
                    {/* Header Row: Difficulty Badge & Bookmark */}
                    <div className="flex items-center justify-between relative z-10">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${diffInfo.classes} animate-pulse`}>
                            {diffInfo.label}
                        </span>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleStar(flashcard._id);
                            }}
                            className={`relative w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 outline-hidden ${flashcard.isStarred
                                ? 'bg-amber-100 text-amber-500'
                                : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-amber-500'
                                }`}
                            aria-label={flashcard.isStarred ? "Remove Bookmark" : "Bookmark Flashcard"}
                        >
                            <Star className="w-5.5 h-5.5" strokeWidth={2} fill={flashcard.isStarred ? 'currentColor' : 'none'} />

                            {sparkleActive && (
                                <div className="absolute inset-0 pointer-events-none overflow-visible">
                                    {[
                                        { id: 1, x: '-22px', y: '-22px', delay: '0ms' },
                                        { id: 2, x: '22px', y: '-22px', delay: '40ms' },
                                        { id: 3, x: '-22px', y: '22px', delay: '80ms' },
                                        { id: 4, x: '22px', y: '22px', delay: '120ms' },
                                        { id: 5, x: '0px', y: '-32px', delay: '60ms' }
                                    ].map((s) => (
                                        <span
                                            key={s.id}
                                            className="absolute top-1/2 left-1/2 w-2 h-2 bg-amber-400 rounded-full animate-sparkle"
                                            style={{
                                                '--x': s.x,
                                                '--y': s.y,
                                                animationDelay: s.delay,
                                                transform: 'translate(-50%, -50%)',
                                            }}
                                        />
                                    ))}
                                </div>
                            )}
                        </button>
                    </div>

                    {/* Question Center */}
                    <div className="flex-1 flex items-center justify-center px-4 py-6">
                        <p className="text-2xl sm:text-3xl font-semibold text-center text-slate-900 leading-relaxed font-display">
                            {flashcard.question}
                        </p>
                    </div>

                    {/* Footer Guide */}
                    <div className="flex items-center justify-center gap-2 text-sm text-slate-400 font-medium">
                        <RotateCcw className="w-4 h-4 text-slate-400" strokeWidth={2} />
                        <span>Click or Press Space to reveal</span>
                    </div>
                </div>

                {/* Back Side (Answer) */}
                <div
                    className="absolute inset-0 w-full h-full bg-linear-to-br from-emerald-50 via-green-50 to-white border border-emerald-200/80 rounded-3xl p-6 sm:p-10 flex flex-col justify-between"
                    style={{
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)'
                    }}
                >
                    {/* Floating Success Badge */}
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-13 h-13 rounded-full bg-emerald-100 border-2 border-white flex items-center justify-center shadow-lg shadow-emerald-500/15 animate-badge-pulse">
                        <span className="text-2xl" role="img" aria-label="success">✅</span>
                    </div>

                    {/* Header Row: Difficulty & Star */}
                    <div className="flex items-center justify-between relative z-10">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${diffInfo.classes}`}>
                            {diffInfo.label}
                        </span>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleStar(flashcard._id);
                            }}
                            className={`relative w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 outline-hidden ${flashcard.isStarred
                                ? 'bg-amber-100 text-amber-500'
                                : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-amber-500'
                                }`}
                            aria-label={flashcard.isStarred ? "Remove Bookmark" : "Bookmark Flashcard"}
                        >
                            <Star className="w-5.5 h-5.5" strokeWidth={2} fill={flashcard.isStarred ? 'currentColor' : 'none'} />

                            {sparkleActive && (
                                <div className="absolute inset-0 pointer-events-none overflow-visible">
                                    {[
                                        { id: 1, x: '-22px', y: '-22px', delay: '0ms' },
                                        { id: 2, x: '22px', y: '-22px', delay: '40ms' },
                                        { id: 3, x: '-22px', y: '22px', delay: '80ms' },
                                        { id: 4, x: '22px', y: '22px', delay: '120ms' },
                                        { id: 5, x: '0px', y: '-32px', delay: '60ms' }
                                    ].map((s) => (
                                        <span
                                            key={s.id}
                                            className="absolute top-1/2 left-1/2 w-2 h-2 bg-amber-400 rounded-full animate-sparkle"
                                            style={{
                                                '--x': s.x,
                                                '--y': s.y,
                                                animationDelay: s.delay,
                                                transform: 'translate(-50%, -50%)',
                                            }}
                                        />
                                    ))}
                                </div>
                            )}
                        </button>
                    </div>

                    {/* Scrollable Answer / Explanations / Memory Tips */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar my-4 pr-1">
                        <div
                            className={`transition-all duration-500 ease-out transform flex flex-col items-center justify-center min-h-full w-full
                                ${isFlipped ? 'opacity-100 translate-y-0 scale-100 delay-150' : 'opacity-0 translate-y-4 scale-95'}`}
                        >
                            <span className="text-xs font-bold tracking-widest text-emerald-600 uppercase mb-2 select-none">
                                ✅ Correct Answer
                            </span>

                            <p
                                className={`font-bold text-slate-900 leading-[1.5] mb-6 px-4 font-display w-full max-w-md mx-auto ${(flashcard.answer.length > 45 || flashcard.answer.includes("\n"))
                                    ? 'text-left'
                                    : 'text-center'
                                    }`}
                                style={{ fontSize: 'clamp(18px, 2.2vw, 20px)' }}
                            >
                                {flashcard.answer}
                            </p>

                            <div className="w-full space-y-3.5">
                                {/* Explanation Card */}
                                {flashcard.explanation && (
                                    <div className="bg-emerald-100/70 border border-emerald-200/50 rounded-xl p-4 sm:p-5 flex gap-3 text-left">
                                        <span className="text-xl shrink-0 select-none">💡</span>
                                        <div className="space-y-1">
                                            <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-widest">
                                                Why?
                                            </h4>
                                            <p className="text-sm sm:text-base text-emerald-900 leading-relaxed font-semibold">
                                                {flashcard.explanation}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Memory Trick Card */}
                                {flashcard.memoryTip && (
                                    <div className="bg-blue-50 border border-blue-200/50 rounded-xl p-4 sm:p-5 flex gap-3 text-left">
                                        <span className="text-xl shrink-0 select-none">🧠</span>
                                        <div className="space-y-1">
                                            <h4 className="text-xs font-bold text-blue-950 uppercase tracking-widest">
                                                Memory Trick
                                            </h4>
                                            <p className="text-sm sm:text-base text-blue-900 leading-relaxed font-semibold">
                                                {flashcard.memoryTip}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer Guide */}
                    <div className="flex items-center justify-center gap-2 text-sm text-emerald-600/80 font-bold pt-2 border-t border-emerald-100/50">
                        <RotateCcw className="w-4 h-4 text-emerald-600/80" strokeWidth={2.5} />
                        <span>Click or Press Space to flip back</span>
                    </div>
                </div>
            </div>
        </div>
    );
});

export default Flashcard;