import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import useStudySession from "../../hooks/useStudySession";
import useStudyTimer from "../../hooks/useStudyTimer";
import useAmbientSound from "../../hooks/useAmbientSound";
import FocusProgress from "./FocusProgress";
import focusStorage from "../../services/FocusStorage";
import {
  STATUS_IDLE,
  STATUS_CREATED,
  STATUS_RUNNING,
  STATUS_PAUSED,
  STATUS_COMPLETED,
  STATUS_CANCELLED,
  ACTIVITY_QUICK,
  SOURCE_HEADER
} from "../../constants/StudySessionConstants";
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Target,
  Sparkles,
  Compass,
  ArrowRight,
  Music4,
  MoreVertical,
  Square,
  ArrowLeft,
  Calendar,
  Layers,
  ChevronRight,
  Clock,
  Zap
} from "lucide-react";

const STUDY_QUOTES = [
  "Discipline today, success tomorrow.",
  "Deep focus is the ultimate superpower.",
  "Quiet the mind, sharpen the focus.",
  "One step at a time, one block at a time.",
  "Energy flows where attention goes.",
  "Focus on the process, not the outcome.",
  "Make each day your masterpiece."
];

export const FocusOverlay = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    session,
    createSession,
    startSession,
    pauseSession,
    resumeSession,
    cancelSession,
    completeSession,
    resetSession,
    updateSession,
    canStart,
    canPause,
    canResume,
    canComplete,
    canCancel,
    canReset
  } = useStudySession();

  const { progressPercent, formattedTime } = useStudyTimer();
  const {
    currentSoundId,
    isMuted,
    volume,
    setVolume,
    setAmbientSound,
    toggleMute,
    ambientSounds,
    failedSoundIds
  } = useAmbientSound();

  const [inputGoal, setInputGoal] = useState("");
  const [setupDuration, setSetupDuration] = useState(25);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalText, setGoalText] = useState("");
  const [stats, setStats] = useState({});

  // Guided Workspace setup state
  const [setupStep, setSetupStep] = useState(1);
  const [isCustomDuration, setIsCustomDuration] = useState(false);
  const [customMinutes, setCustomMinutes] = useState("");

  // Leave Workspace Modal state
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  // Rotating study quote states
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [fadeQuote, setFadeQuote] = useState(true);

  // Ref to handle horizontal mouse wheel scrolling
  const scrollRef = useRef(null);

  const handleWheel = (e) => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft += e.deltaY;
    }
  };

  const handleStart = () => {
    if (canStart()) startSession();
  };

  const handlePause = () => {
    if (canPause()) pauseSession();
  };

  const handleResume = () => {
    if (canResume()) resumeSession();
  };

  const handleCancel = () => {
    if (canCancel()) cancelSession();
  };

  const handleComplete = () => {
    if (canComplete()) completeSession();
  };

  const handleReset = () => {
    if (canReset()) handleResetSessionClick();
  };

  const handleBackClick = () => {
    if (session && [STATUS_RUNNING, STATUS_PAUSED].includes(session.status)) {
      setShowLeaveModal(true);
    } else {
      navigate("/dashboard");
    }
  };

  // Keyboard navigation & Esc key handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (showLeaveModal) {
          setShowLeaveModal(false);
        } else if (isEditingGoal) {
          setIsEditingGoal(false);
        } else {
          handleBackClick();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [session?.status, showLeaveModal, isEditingGoal]);

  useEffect(() => {
    const timer = setInterval(() => {
      setFadeQuote(false);
      setTimeout(() => {
        setQuoteIndex((prev) => (prev + 1) % STUDY_QUOTES.length);
        setFadeQuote(true);
      }, 300);
    }, 120000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setStats(focusStorage.loadStats());
  }, [session]);

  const handleStartQuickSession = () => {
    const durationSeconds = setupDuration * 60;
    const created = createSession({
      mode: "quick",
      duration: durationSeconds,
      activityType: ACTIVITY_QUICK,
      goal: inputGoal.trim() || "Deep Focus Session",
      source: SOURCE_HEADER
    });
    if (created) {
      startSession();
    }
  };

  const handleGoalSubmit = (e) => {
    e.preventDefault();
    if (session) {
      updateSession({ goal: goalText });
    }
    setIsEditingGoal(false);
  };

  const startGoalEditing = () => {
    setGoalText(session?.goal || "");
    setIsEditingGoal(true);
  };

  const handleResetSessionClick = () => {
    if (canReset()) {
      resetSession();
    }
    setSetupStep(1);
    setIsCustomDuration(false);
    setCustomMinutes("");
  };

  const isSessionActive = session && ![STATUS_COMPLETED, STATUS_CANCELLED].includes(session.status);
  const isRunning = session?.status === STATUS_RUNNING;
  const isAtmospherePlaying = currentSoundId && isRunning && !isMuted;

  const currentSoundObj = currentSoundId ? ambientSounds.find((s) => s.id === currentSoundId) : null;
  const soundName = currentSoundObj ? currentSoundObj.title : "Silence Off";

  return (
    <div className="flex flex-col justify-between w-full h-full min-h-[calc(100vh-80px)] select-none text-white transition-all duration-300 font-display">
      
      {/* 1. Subheader Toolbar - Compact & Symmetrical */}
      <div className="relative z-10 flex items-center justify-between gap-4 w-full shrink-0 pb-1.5 border-b border-slate-900/50 select-none mb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={handleBackClick}
            className="p-1 bg-slate-900/40 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#10D28F] outline-none"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          
          <div className="flex flex-col text-left">
            <h2 className="text-xs font-extrabold text-white leading-tight">
              {isSessionActive 
                ? (session.mode === "smart" ? session.documentTitle : "Independent Focus")
                : "Focus Workspace"}
            </h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              {!isSessionActive ? (
                <>
                  <span className="w-1 h-1 rounded-full bg-slate-600" />
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none">
                    Configure Session
                  </span>
                </>
              ) : (
                <>
                  <span className="w-1 h-1 rounded-full bg-[#10D28F] animate-pulse" />
                  <span className="text-[8px] font-black text-[#10D28F] uppercase tracking-widest leading-none">
                    Active Session: {session.activityType}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => navigate("/focus/history")}
            className="px-2.5 py-1 bg-slate-900/60 hover:bg-slate-855 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-lg transition-all text-[9px] font-black uppercase tracking-wider focus-visible:ring-2 focus-visible:ring-[#10D28F] outline-none cursor-pointer"
          >
            History
          </button>
          <button
            onClick={() => navigate("/focus/analytics")}
            className="px-2.5 py-1 bg-slate-900/60 hover:bg-slate-855 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-lg transition-all text-[9px] font-black uppercase tracking-wider focus-visible:ring-2 focus-visible:ring-[#10D28F] outline-none cursor-pointer"
          >
            Analytics
          </button>
        </div>
      </div>

      {/* 2. Symmetrical Main Columns Grid (Compact & Visual Spacings) */}
      <div className="flex-1 flex flex-col items-center justify-center w-full py-1 overflow-hidden">
        {!isSessionActive ? (
          /* Guided Setup Card */
          <div className="w-full max-w-xs bg-[#111827]/40 border border-slate-900 rounded-xl p-4.5 backdrop-blur-2xl shadow-2xl animate-in zoom-in-98 duration-300">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-2">
              <Sparkles className="w-4 h-4 text-[#10D28F]" />
            </div>

            <h3 className="text-xs font-black text-white text-center tracking-tight leading-tight">
              Create Study Session
            </h3>
            
            <p className="text-[9px] text-slate-455 text-center leading-relaxed mt-1 mb-3.5 font-semibold">
              Disconnect from distractions. Dedicate structured focus blocks to master study concepts.
            </p>

            {/* Guided Step 1: Choose Duration */}
            {setupStep === 1 && (
              <div className="space-y-2.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <label className="text-[8px] font-black uppercase tracking-widest text-slate-505 block mb-0.5">
                  Step 1: Select Timer Duration
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[25, 30, 45, 60].map((mins) => (
                    <button
                      key={mins}
                      onClick={() => {
                        setSetupDuration(mins);
                        setIsCustomDuration(false);
                      }}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border focus-visible:ring-2 focus-visible:ring-[#10D28F] outline-none ${
                        !isCustomDuration && setupDuration === mins
                          ? "bg-emerald-500/10 border-emerald-500/40 text-[#10D28F] font-black"
                          : "bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900/80"
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
                
                {/* Custom minutes block */}
                <div className="pt-0.5">
                  <button
                    onClick={() => setIsCustomDuration(true)}
                    className={`w-full py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border focus-visible:ring-2 focus-visible:ring-[#10D28F] outline-none ${
                      isCustomDuration
                        ? "bg-emerald-500/10 border-emerald-500/40 text-[#10D28F] font-black"
                        : "bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900/80"
                    }`}
                  >
                    Custom Duration
                  </button>
                  {isCustomDuration && (
                    <div className="mt-1.5 animate-in slide-in-from-top-1 duration-200">
                      <input
                        type="number"
                        min="1"
                        max="240"
                        value={customMinutes}
                        onChange={(e) => {
                          setCustomMinutes(e.target.value);
                          const val = parseInt(e.target.value);
                          if (val > 0) setSetupDuration(val);
                        }}
                        placeholder="Enter minutes..."
                        className="w-full px-3 py-1.5 bg-slate-900/60 border border-slate-855 rounded-lg text-xs text-white placeholder-slate-650 focus:outline-none focus:border-emerald-500/40 focus:bg-slate-900/90 transition-all font-semibold focus-visible:ring-2 focus-visible:ring-[#10D28F]"
                      />
                    </div>
                  )}
                </div>

                <button
                  disabled={isCustomDuration && (!customMinutes || parseInt(customMinutes) <= 0)}
                  onClick={() => setSetupStep(2)}
                  className="w-full mt-2.5 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-lg text-xs font-extrabold shadow-lg shadow-emerald-500/20 transition-all cursor-pointer flex items-center justify-center gap-1 hover:-translate-y-0.5 disabled:opacity-40 disabled:pointer-events-none focus-visible:ring-2 focus-visible:ring-[#10D28F] outline-none"
                >
                  <span>Continue to Goal Setup</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Guided Step 2: Goal Input */}
            {setupStep === 2 && (
              <div className="space-y-2.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <label className="text-[8px] font-black uppercase tracking-widest text-slate-500 block mb-0.5">
                  Step 2: What are you working on?
                </label>
                <div className="relative">
                  <Target className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-550" />
                  <input
                    type="text"
                    value={inputGoal}
                    onChange={(e) => setInputGoal(e.target.value)}
                    placeholder="E.g. Study notes..."
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-900/40 border border-slate-855 rounded-lg text-xs text-white placeholder-slate-650 focus:outline-none focus:border-emerald-500/40 focus:bg-slate-900/80 transition-all font-semibold focus-visible:ring-2 focus-visible:ring-[#10D28F]"
                    autoFocus
                  />
                </div>

                <div className="flex gap-1.5 mt-2.5">
                  <button
                    onClick={() => setSetupStep(1)}
                    className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer text-center focus-visible:ring-2 focus-visible:ring-[#10D28F] outline-none"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleStartQuickSession}
                    className="flex-1 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-lg text-xs font-extrabold shadow-lg shadow-emerald-500/20 transition-all cursor-pointer text-center hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-[#10D28F] outline-none"
                  >
                    Begin Session
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Active Study Session Layout - Three-column balanced design */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1fr_380px_calc(1fr+var(--sidebar-width))] gap-4 items-center w-full my-auto py-1 animate-in fade-in duration-300">
            
            {/* Column 1: Info Cards (Goal & Activity) - Compact and dense */}
            <div className="flex flex-col gap-3 w-full max-w-sm mx-auto order-2 lg:order-1">
              
              {/* Study Info Card */}
              <div className="bg-[#111827]/30 border border-slate-900 hover:border-slate-850 p-3.5 rounded-xl backdrop-blur-2xl transition-all duration-300 shadow-sm flex flex-col justify-between hover:-translate-y-px h-[115px]">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1 flex items-center gap-1">
                  <Layers className="w-3 h-3 text-[#10D28F]" />
                  <span>Session Activity</span>
                </span>
                <p className="text-xs font-extrabold text-white leading-tight">
                  {session.mode === "smart" ? `Smart Workspace: Studying notes` : "Independent Study Block"}
                </p>
                {session.mode === "smart" && session.documentTitle && (
                  <span className="text-[8px] font-bold text-slate-550 truncate mt-1 block">
                    📖 Source: {session.documentTitle}
                  </span>
                )}
              </div>

              {/* Goal Card */}
              <div className="bg-[#111827]/30 border border-slate-900 hover:border-slate-850 p-3.5 rounded-xl backdrop-blur-2xl transition-all duration-300 shadow-sm flex flex-col justify-between hover:-translate-y-px h-[115px]">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1 flex items-center gap-1">
                  <Target className="w-3 h-3 text-teal-400" />
                  <span>Focus Goal</span>
                </span>
                {isEditingGoal ? (
                  <form onSubmit={handleGoalSubmit} className="flex gap-1.5 w-full">
                    <input
                      type="text"
                      value={goalText}
                      onChange={(e) => setGoalText(e.target.value)}
                      className="flex-1 px-2.5 py-1 bg-slate-900/80 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500 focus-visible:ring-2 focus-visible:ring-[#10D28F] font-semibold"
                      placeholder="Goal..."
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold cursor-pointer transition-all"
                    >
                      Save
                    </button>
                  </form>
                ) : (
                  <div className="flex items-center justify-between gap-1.5 w-full">
                    <p className="text-xs font-extrabold text-white truncate max-w-[170px]" title={session.goal}>
                      {session.goal || "Deep study block session"}
                    </p>
                    <button
                      onClick={startGoalEditing}
                      className="text-[8px] font-black uppercase text-[#10D28F] hover:text-[#19E39C] transition-colors cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>

            </div>

            {/* Column 2: Timer Centerpiece (Visual Hero - Always stays centered) */}
            <div className="flex flex-col items-center justify-center w-full max-w-[360px] mx-auto order-1 lg:order-2">
              <FocusProgress
                progressPercent={progressPercent}
                formattedTime={formattedTime}
                status={session.status}
              />

              {/* Playback Circular Controls */}
              <div className="flex items-center gap-3 py-1 mt-0.5 shrink-0">
                {canCancel() && (
                  <button
                    onClick={handleCancel}
                    className="w-8 h-8 rounded-full bg-slate-900 border border-slate-805 text-slate-405 hover:text-white transition-all duration-300 hover:scale-105 hover:bg-slate-850 hover:shadow-md cursor-pointer flex items-center justify-center group focus-visible:ring-2 focus-visible:ring-[#10D28F] outline-none"
                    title="Restart Session"
                    aria-label="Restart session"
                  >
                    <RotateCcw className="w-3 h-3 transition-transform group-hover:rotate-[-45deg]" />
                  </button>
                )}

                {canPause() && (
                  <button
                    onClick={handlePause}
                    className="w-10 h-10 rounded-full bg-[#10D28F] hover:bg-[#19E39C] text-black flex items-center justify-center transition-all duration-300 scale-102 hover:scale-105 shadow-md shadow-[#10D28F]/10 cursor-pointer focus-visible:ring-2 focus-visible:ring-white outline-none"
                    title="Pause Study Block"
                    aria-label="Pause session"
                  >
                    <Pause className="w-3.5 h-3.5 fill-current" />
                  </button>
                )}

                {canStart() && (
                  <button
                    onClick={handleStart}
                    className="w-10 h-10 rounded-full bg-[#10D28F] hover:bg-[#19E39C] text-black flex items-center justify-center transition-all duration-300 scale-102 hover:scale-105 shadow-md shadow-[#10D28F]/10 cursor-pointer focus-visible:ring-2 focus-visible:ring-white outline-none"
                    title="Start Study Block"
                    aria-label="Start session"
                  >
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  </button>
                )}

                {canResume() && (
                  <button
                    onClick={handleResume}
                    className="w-10 h-10 rounded-full bg-[#10D28F] hover:bg-[#19E39C] text-black flex items-center justify-center transition-all duration-300 scale-102 hover:scale-105 shadow-md shadow-[#10D28F]/10 cursor-pointer focus-visible:ring-2 focus-visible:ring-white outline-none"
                    title="Resume Study Block"
                    aria-label="Resume session"
                  >
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  </button>
                )}

                {canComplete() && (
                  <button
                    onClick={handleComplete}
                    className="w-8 h-8 rounded-full bg-slate-900 border border-slate-805 text-slate-405 hover:text-white transition-all duration-300 hover:scale-105 hover:bg-slate-850 hover:shadow-md cursor-pointer flex items-center justify-center group focus-visible:ring-2 focus-visible:ring-[#10D28F] outline-none"
                    title="Stop and Log Session"
                    aria-label="Stop and save session"
                  >
                    <Square className="w-3 h-3 fill-current group-hover:scale-95 transition-transform" />
                  </button>
                )}
              </div>
            </div>

            {/* Column 3: Environment, Target & Streaks (3 Compact Cards) */}
            <div className="flex flex-col gap-3 order-3 w-full max-w-sm mx-auto">
              
              {/* Environment details card */}
              <div className="bg-[#111827]/30 border border-slate-900 hover:border-slate-850 p-2.5 rounded-xl backdrop-blur-2xl transition-all duration-300 shadow-sm flex items-center justify-between hover:-translate-y-px h-[75px]">
                <div className="flex flex-col text-left min-w-0">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1 leading-none">
                    <Music4 className="w-3 h-3 text-[#10D28F]" />
                    <span>Atmosphere</span>
                  </span>
                  <h4 className="text-xs font-extrabold text-white truncate mt-1 leading-tight">{soundName}</h4>
                  <span className="text-[8px] font-bold text-slate-550 truncate mt-0.5 leading-none">
                    {currentSoundObj ? currentSoundObj.subtitle : "Silence off - pure study"}
                  </span>
                </div>
                
                {/* CSS Audio visualizer waves */}
                <div className="flex items-end gap-0.5 h-3 shrink-0 pr-0.5 select-none">
                  <div className={`w-0.5 bg-[#10D28F] rounded-full transition-all duration-300 ${isAtmospherePlaying ? "animate-audio-wave-1" : "h-1"}`} />
                  <div className={`w-0.5 bg-[#10D28F] rounded-full transition-all duration-300 ${isAtmospherePlaying ? "animate-audio-wave-2" : "h-1.5"}`} />
                  <div className={`w-0.5 bg-[#10D28F] rounded-full transition-all duration-300 ${isAtmospherePlaying ? "animate-audio-wave-3" : "h-1"}`} />
                </div>
              </div>

              {/* Progress target progress card */}
              <div className="bg-[#111827]/30 border border-slate-900 hover:border-slate-850 p-2.5 rounded-xl backdrop-blur-2xl transition-all duration-300 shadow-sm flex flex-col justify-between hover:-translate-y-px h-[75px]">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-0.5 flex items-center gap-1 leading-none">
                  <Calendar className="w-3 h-3 text-purple-400" />
                  <span>Today's Target</span>
                </span>
                <div className="flex items-center justify-between text-[9px] font-bold text-slate-455 mt-1 leading-none">
                  <span>Target completed</span>
                  <span className="text-white font-mono leading-none">
                    {Math.round((progressPercent / 100) * session.duration / 60)} / {Math.round(session.duration / 60)}m
                  </span>
                </div>
                <div className="w-full bg-slate-950/50 rounded-full h-1 mt-1 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, progressPercent)}%` }}
                  />
                </div>
              </div>

              {/* Study Streak Card */}
              <div className="bg-[#111827]/30 border border-slate-900 hover:border-slate-850 p-2.5 rounded-xl backdrop-blur-2xl transition-all duration-300 shadow-sm flex items-center gap-3 hover:-translate-y-px h-[75px]">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4 text-amber-500 fill-current animate-pulse" />
                </div>
                <div className="flex flex-col text-left min-w-0">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none">
                    Active Streak
                  </span>
                  <h4 className="text-xs font-extrabold text-white mt-1 leading-tight font-mono">
                    {stats.currentStreak || 0} Days Streak
                  </h4>
                  <span className="text-[8px] font-bold text-slate-550 truncate mt-0.5 leading-none">
                    Keep study rhythms aligned!
                  </span>
                </div>
              </div>

            </div>

          </div>
        )}
      </div>

      {/* 3. Study Environment Scrolling & Volume Controls Selector Row (Fit-to-Screen Spacings) */}
      {isSessionActive && (
        <div className="relative z-10 w-full flex flex-col md:flex-row items-center justify-between gap-4 w-full border-t border-slate-900/50 pt-2 mt-1 shrink-0 select-none pb-0.5">
          {/* horizontal chips selector */}
          <div className="flex-1 min-w-0 w-full flex flex-col gap-1 text-left">
            <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-widest text-slate-550 w-full px-0.5">
              <span className="flex items-center gap-1">
                <Music4 className="w-3 h-3 text-[#10D28F]" />
                <span>🎧 Landscapes Channels</span>
              </span>
              <button
                onClick={() => setAmbientSound(null)}
                className={`text-[8px] uppercase tracking-widest transition-all cursor-pointer font-extrabold focus-visible:ring-2 focus-visible:ring-[#10D28F] outline-none ${
                  currentSoundId === null
                    ? "text-[#10D28F] font-black"
                    : "text-slate-500 hover:text-slate-350"
                }`}
              >
                Silence Off
              </button>
            </div>

            <div className="w-full relative">
              <div 
                ref={scrollRef}
                onWheel={handleWheel}
                className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-hide py-0.5 px-0.5 w-full select-none scroll-smooth"
              >
                {ambientSounds
                  .filter((sound) => sound.category === "Focus Ambience")
                  .map((sound) => {
                    const isSelected = currentSoundId === sound.id;
                    const isFailed = failedSoundIds.includes(sound.id);
                    const isSoundEnabled = sound.enabled && !isFailed;
                    const displayTitle = isFailed ? "Unavailable" : sound.title;

                    return (
                      <button
                        key={sound.id}
                        disabled={!isSoundEnabled}
                        onClick={() => setAmbientSound(sound.id)}
                        className={`px-3 py-1 rounded-full text-[9px] font-bold transition-all duration-305 cursor-pointer flex items-center gap-1.5 border shrink-0 focus-visible:ring-2 focus-visible:ring-[#10D28F] outline-none ${
                          !isSoundEnabled
                            ? "opacity-20 bg-slate-950/10 border-slate-900 cursor-not-allowed border-dashed text-slate-655"
                            : isSelected
                              ? "bg-emerald-500/10 border-[#10D28F] text-[#10D28F] font-black shadow-md shadow-emerald-500/5 scale-102"
                              : "bg-slate-900/40 border-slate-805 hover:border-slate-700 text-slate-400 hover:text-white"
                        }`}
                        title={isFailed ? "Audio file missing or unavailable" : sound.title}
                      >
                        <span className="text-xs shrink-0">{sound.icon}</span>
                        <span>{displayTitle}</span>
                      </button>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* Volume details */}
          <div className="flex items-center gap-2.5 shrink-0 self-stretch md:self-end justify-center md:pb-0.5">
            <div className="flex items-center gap-1.5 bg-slate-900/30 border border-slate-850 px-2.5 py-1 rounded-full w-36 sm:w-40 shrink-0">
              <button
                onClick={toggleMute}
                disabled={!currentSoundId}
                className="text-slate-500 hover:text-slate-200 transition-colors disabled:opacity-20 cursor-pointer focus:outline-none shrink-0"
                aria-label="Mute toggle"
              >
                {isMuted ? <VolumeX className="w-3 h-3 text-rose-500" /> : <Volume2 className="w-3 h-3 text-slate-450" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                disabled={!currentSoundId}
                className="w-full accent-[#10D28F] bg-slate-800 rounded-lg appearance-none cursor-pointer h-0.5 -translate-y-px disabled:opacity-20 focus:outline-none"
                aria-label="Volume slider"
              />
              <span className="text-[8px] font-black text-slate-455 tabular-nums w-5 text-right shrink-0">
                {isMuted ? "0%" : `${Math.round(volume * 100)}%`}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 4. Study Quote Footer */}
      <div className="w-full shrink-0 pt-0.5 pb-0.5 text-center select-none z-10">
        <p className={`text-[8px] font-bold text-slate-500 italic tracking-wider transition-opacity duration-305 ${fadeQuote ? "opacity-60" : "opacity-0"}`}>
          ✨ {STUDY_QUOTES[quoteIndex]}
        </p>
      </div>

      {/* 6. Leave confirmation modal dialog */}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-[#090E18]/85 backdrop-blur-md z-[260] flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-slate-805 p-5 rounded-2xl max-w-xs w-full text-center shadow-2xl relative animate-in zoom-in-95 duration-200">
            <h3 className="text-sm font-extrabold text-white mb-1.5">Leave Focus Workspace?</h3>
            <p className="text-[10px] text-slate-455 mb-4 leading-relaxed">Your study session is still active.</p>
            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => setShowLeaveModal(false)}
                className="w-full py-2 bg-[#10D28F] hover:bg-[#19E39C] text-black font-extrabold rounded-xl text-xs transition-all cursor-pointer text-center focus-visible:ring-2 focus-visible:ring-white outline-none"
              >
                Continue Studying
              </button>
              <button
                onClick={() => {
                  setShowLeaveModal(false);
                  navigate("/dashboard");
                }}
                className="w-full py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-white font-bold rounded-xl text-xs transition-all cursor-pointer text-center focus-visible:ring-2 focus-visible:ring-[#10D28F] outline-none"
              >
                Minimize Session
              </button>
              <button
                onClick={() => {
                  setShowLeaveModal(false);
                  cancelSession();
                  navigate("/dashboard");
                }}
                className="w-full py-2 bg-rose-600/10 hover:bg-rose-600/20 border border-rose-900/50 hover:border-rose-800 text-rose-455 font-bold rounded-xl text-xs transition-all cursor-pointer text-center focus-visible:ring-2 focus-visible:ring-[#10D28F] outline-none"
              >
                End Session
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default FocusOverlay;
