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

  // Global Theme Selector
  const [globalTheme, setGlobalTheme] = useState(() => localStorage.getItem("cleverprep_global_theme") || "white");

  useEffect(() => {
    const handleThemeChange = () => {
      setGlobalTheme(localStorage.getItem("cleverprep_global_theme") || "white");
    };
    window.addEventListener("cleverprep-global-theme-changed", handleThemeChange);
    return () => window.removeEventListener("cleverprep-global-theme-changed", handleThemeChange);
  }, []);

  const handleThemeChange = (newTheme) => {
    setGlobalTheme(newTheme);
    localStorage.setItem("cleverprep_global_theme", newTheme);
    window.dispatchEvent(new Event("cleverprep-global-theme-changed"));
  };

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

  const handleStartStudySession = () => {
    const durationSeconds = setupDuration * 60;
    const created = createSession({
      mode: "quick",
      duration: durationSeconds,
      activityType: ACTIVITY_QUICK,
      goal: inputGoal.trim() || "Study Session",
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

  const isSessionActive = session && ![STATUS_COMPLETED, STATUS_CANCELLED].includes(session.status);
  const isRunning = session?.status === STATUS_RUNNING;
  const isAtmospherePlaying = currentSoundId && isRunning && !isMuted;

  const currentSoundObj = currentSoundId ? ambientSounds.find((s) => s.id === currentSoundId) : null;
  const soundName = currentSoundObj ? currentSoundObj.title : "Silence Off";

  // Dynamic Theme Styling mappings using design tokens
  const bgClass = "text-text-primary";
  const subheaderBorderClass = "border-b border-border";
  const subheaderTextClass = "text-text-primary";
  const btnSecondaryClass = "bg-bg-surface border-border text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover";
  
  const themeSegmentContainer = "bg-bg-base border-border";
  const themeButtonSelected = "bg-primary text-primary-text";
  const themeButtonUnselected = "text-text-muted hover:text-text-primary";
  
  const cardClass = "bg-bg-surface border-border hover:border-border-hover text-text-primary shadow-theme-sm";
  const cardTitleClass = "text-text-muted";
  const cardContentTextClass = "text-text-primary";
  const cardMetaTextClass = "text-text-secondary";
  
  const inputClass = "bg-bg-surface border border-border text-text-primary placeholder:text-text-muted focus:border-primary/50 focus:bg-bg-surface";
  const controlBtnClass = "bg-bg-surface border border-border text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover shadow-theme-sm";
  const streakCardIconBg = "bg-accent/15 border border-accent/30";
  const targetProgressBgClass = "bg-bg-base";
  
  const landscapesBtnUnselected = "bg-bg-surface border border-border hover:border-border-hover text-text-secondary hover:text-text-primary shadow-theme-sm transition-all duration-300";
  const landscapesBtnSelected = "bg-primary text-primary-text border-primary font-black scale-102 shadow-theme-md transition-all duration-300";
  
  const volumeSliderContainerClass = "bg-bg-surface/50 border border-border";
  const volumeSliderTrackClass = "bg-bg-base";
  const quoteTextClass = "text-text-muted";

  return (
    <div className={`flex flex-col justify-between w-full min-h-[calc(100vh-130px)] lg:min-h-0 lg:h-full overflow-hidden select-none transition-all duration-300 font-display ${bgClass}`}>
      
      {/* 1. Subheader Toolbar - Compact & Symmetrical */}
      <div className={`relative z-10 flex items-center justify-between gap-4 w-full shrink-0 pb-1 select-none mb-1.5 border-b ${subheaderBorderClass}`}>
        <div className="flex items-center gap-2">
          <button
            onClick={handleBackClick}
            className={`p-1 border rounded-lg transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#10D28F] outline-none ${btnSecondaryClass}`}
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          
          <div className="flex flex-col text-left justify-center">
            <h2 className={`text-xs font-extrabold leading-none ${subheaderTextClass}`}>
              {isSessionActive ? "Study Session" : "Focus Workspace"}
            </h2>
          </div>
        </div>

        {/* Center/Right: Action Buttons */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => navigate("/focus/history")}
              className={`px-2.5 py-1 border rounded-lg transition-all text-[9px] font-black uppercase tracking-wider focus-visible:ring-2 focus-visible:ring-[#10D28F] outline-none cursor-pointer ${btnSecondaryClass}`}
            >
              History
            </button>
            <button
              onClick={() => navigate("/focus/analytics")}
              className={`px-2.5 py-1 border rounded-lg transition-all text-[9px] font-black uppercase tracking-wider focus-visible:ring-2 focus-visible:ring-[#10D28F] outline-none cursor-pointer ${btnSecondaryClass}`}
            >
              Analytics
            </button>
          </div>
        </div>
      </div>

      {/* 2. Symmetrical Main Columns Grid (Compact & Visual Spacings) */}
      <div className="flex-1 flex flex-col items-center justify-center w-full py-1 overflow-hidden relative">
        {!isSessionActive && (
          <div className="absolute inset-0 bg-primary/[0.025] pointer-events-none [mask-image:radial-gradient(circle_at_center,black_30%,transparent_70%)]" />
        )}

        {!isSessionActive ? (
          /* Guided Setup Card */
          <div className="w-full max-w-[540px] rounded-2xl p-8 shadow-theme-lg animate-in zoom-in-99 duration-300 border bg-bg-surface/65 backdrop-blur-md border-border/80 relative z-10 mx-auto">
            <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-5 transition-transform hover:scale-105 duration-300">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>

            <h3 className="text-base font-black text-center tracking-tight leading-tight mb-2 text-text-primary">
              Create Study Session
            </h3>
            
            <p className={`text-[10px] text-center leading-relaxed mb-8 max-w-[380px] mx-auto font-medium ${cardMetaTextClass}`}>
              Disconnect from distractions. Dedicate structured focus blocks to master study concepts.
            </p>

            {/* Guided Step 1: Choose Duration */}
            {setupStep === 1 && (
              <div className="space-y-3.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <label className={`text-[8px] font-black uppercase tracking-widest block mb-0.5 ${cardTitleClass}`}>
                  Step 1: Select Timer Duration
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {[25, 30, 45, 60].map((mins) => (
                    <button
                      key={mins}
                      onClick={() => {
                        setSetupDuration(mins);
                        setIsCustomDuration(false);
                      }}
                      className={`py-2 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer border h-9.5 flex items-center justify-center focus-visible:ring-2 focus-visible:ring-primary/50 outline-none ${
                        !isCustomDuration && setupDuration === mins
                          ? "bg-primary text-primary-text border-primary font-black shadow-theme-sm"
                          : landscapesBtnUnselected
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
                    className={`w-full py-2 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer border h-9.5 flex items-center justify-center focus-visible:ring-2 focus-visible:ring-primary/50 outline-none ${
                      isCustomDuration
                        ? "bg-primary text-primary-text border-primary font-black shadow-theme-sm"
                        : landscapesBtnUnselected
                    }`}
                  >
                    Custom Duration
                  </button>
                  {isCustomDuration && (
                    <div className="mt-2 animate-in slide-in-from-top-1 duration-200">
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
                        className={`w-full h-10 px-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all text-xs ${inputClass}`}
                      />
                    </div>
                  )}
                </div>

                <button
                  disabled={isCustomDuration && (!customMinutes || parseInt(customMinutes) <= 0)}
                  onClick={() => setSetupStep(2)}
                  className="w-full mt-4 py-2.5 bg-primary hover:bg-primary-hover text-primary-text rounded-xl text-xs font-black shadow-theme-md transition-all cursor-pointer flex items-center justify-center gap-1.5 hover:-translate-y-0.5 disabled:opacity-40 disabled:pointer-events-none focus-visible:ring-2 focus-visible:ring-primary/50 outline-none h-10"
                >
                  <span>Continue to Goal Setup</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Guided Step 2: Goal Input */}
            {setupStep === 2 && (
              <div className="space-y-3.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <label className={`text-[8px] font-black uppercase tracking-widest block mb-0.5 ${cardTitleClass}`}>
                  Step 2: What are you working on?
                </label>
                <div className="relative">
                  <Target className={`absolute left-3.5 top-3 w-4 h-4 ${cardMetaTextClass}`} />
                  <input
                    type="text"
                    value={inputGoal}
                    onChange={(e) => setInputGoal(e.target.value)}
                    placeholder="E.g. Study notes, solve practice quiz..."
                    className={`w-full pl-10.5 h-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all text-xs ${inputClass}`}
                    autoFocus
                  />
                </div>

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => setSetupStep(1)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-center focus-visible:ring-2 focus-visible:ring-primary/50 outline-none h-10 ${landscapesBtnUnselected}`}
                  >
                    Back
                  </button>
                  <button
                    onClick={handleStartStudySession}
                    className="flex-1 py-2.5 bg-primary hover:bg-primary-hover text-primary-text rounded-xl text-xs font-black shadow-theme-md transition-all cursor-pointer text-center hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-primary/50 outline-none h-10"
                  >
                    Begin Session
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Active Study Session Layout - Three-column balanced grid centered with premium max-width */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[260px_1fr_260px] gap-4.5 w-full max-w-[1050px] mx-auto items-center py-0.5 animate-in fade-in duration-300">
            
            {/* Column 1: Info Cards (Goal & Activity) - Compact and dense */}
            <div className="flex flex-col gap-2.5 w-full max-w-sm mx-auto order-2 lg:order-1">
              
              {/* Study Info Card */}
              <div className={`p-3 rounded-xl border border-l-4 border-l-primary/75 transition-all duration-300 shadow-sm flex flex-col justify-between hover:-translate-y-px h-[82px] ${cardClass}`}>
                <span className={`text-[8px] font-black uppercase tracking-widest block mb-0.5 flex items-center gap-1.5 ${cardTitleClass}`}>
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  <span>Session Status</span>
                </span>
                <p className={`text-xs font-extrabold leading-tight ${cardContentTextClass}`}>
                  Study Session Active
                </p>
                {session.documentTitle ? (
                  <span className={`text-[8px] font-bold truncate mt-0.5 block ${cardMetaTextClass}`}>
                    📖 Source: {session.documentTitle}
                  </span>
                ) : (
                  <span className={`text-[8px] font-bold truncate mt-0.5 block ${cardMetaTextClass}`}>
                    ⏱️ Logging minutes to daily goals
                  </span>
                )}
              </div>

              {/* Goal Card */}
              <div className={`p-3 rounded-xl border border-l-4 border-l-accent/75 transition-all duration-300 shadow-sm flex flex-col justify-between hover:-translate-y-px h-[82px] ${cardClass}`}>
                <span className={`text-[8px] font-black uppercase tracking-widest block mb-0.5 flex items-center gap-1.5 ${cardTitleClass}`}>
                  <Target className="w-3.5 h-3.5 text-accent" />
                  <span>Focus Goal</span>
                </span>
                {isEditingGoal ? (
                  <form onSubmit={handleGoalSubmit} className="flex gap-1.5 w-full">
                    <input
                      type="text"
                      value={goalText}
                      onChange={(e) => setGoalText(e.target.value)}
                      className={`flex-1 px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-primary/50 ${inputClass}`}
                      placeholder="Goal..."
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="px-2.5 py-1 bg-primary hover:bg-primary-hover text-primary-text rounded-lg text-xs font-bold cursor-pointer transition-all"
                    >
                      Save
                    </button>
                  </form>
                ) : (
                  <div className="flex items-center justify-between gap-1.5 w-full">
                    <p className={`text-xs font-extrabold truncate max-w-[170px] ${cardContentTextClass}`} title={session.goal}>
                      {session.goal || "Deep study block session"}
                    </p>
                    <button
                      onClick={startGoalEditing}
                      className="text-[8px] font-black uppercase text-primary hover:text-primary-hover transition-colors cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>

            </div>

            {/* Column 2: Timer Centerpiece (Visual Hero - Always stays centered) */}
            <div className="flex flex-col items-center justify-center w-full max-w-[340px] mx-auto order-1 lg:order-2">
              <FocusProgress
                progressPercent={progressPercent}
                formattedTime={formattedTime}
                status={session.status}
              />

              {/* Playback Circular Controls */}
              <div className="flex items-center gap-4.5 py-1 mt-0.5 shrink-0">
                {canCancel() && (
                  <button
                    onClick={handleCancel}
                    className="w-8.5 h-8.5 rounded-full transition-all duration-300 flex items-center justify-center group focus-visible:ring-2 focus-visible:ring-primary/50 outline-none cursor-pointer bg-bg-surface border border-border text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover hover:scale-105 shadow-theme-sm"
                    title="Restart Session"
                    aria-label="Restart session"
                  >
                    <RotateCcw className="w-3.5 h-3.5 transition-transform group-hover:rotate-[-45deg]" />
                  </button>
                )}

                {canPause() && (
                  <button
                    onClick={handlePause}
                    className="w-11 h-11 rounded-full bg-primary hover:bg-primary-hover text-primary-text flex items-center justify-center transition-all duration-300 scale-102 hover:scale-105 shadow-theme-md cursor-pointer focus-visible:ring-2 focus-visible:ring-primary/50 outline-none"
                    title="Pause Study Block"
                    aria-label="Pause session"
                  >
                    <Pause className="w-4.5 h-4.5 fill-current" />
                  </button>
                )}

                {canStart() && (
                  <button
                    onClick={handleStart}
                    className="w-11 h-11 rounded-full bg-primary hover:bg-primary-hover text-primary-text flex items-center justify-center transition-all duration-300 scale-102 hover:scale-105 shadow-theme-md cursor-pointer focus-visible:ring-2 focus-visible:ring-primary/50 outline-none"
                    title="Start Study Block"
                    aria-label="Start session"
                  >
                    <Play className="w-4.5 h-4.5 fill-current ml-0.5" />
                  </button>
                )}

                {canResume() && (
                  <button
                    onClick={handleResume}
                    className="w-11 h-11 rounded-full bg-primary hover:bg-primary-hover text-primary-text flex items-center justify-center transition-all duration-300 scale-102 hover:scale-105 shadow-theme-md cursor-pointer focus-visible:ring-2 focus-visible:ring-primary/50 outline-none"
                    title="Resume Study Block"
                    aria-label="Resume session"
                  >
                    <Play className="w-4.5 h-4.5 fill-current ml-0.5" />
                  </button>
                )}

                {canComplete() && (
                  <button
                    onClick={handleComplete}
                    className="w-8.5 h-8.5 rounded-full transition-all duration-300 flex items-center justify-center group focus-visible:ring-2 focus-visible:ring-primary/50 outline-none cursor-pointer bg-bg-surface border border-border text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover hover:scale-105 shadow-theme-sm"
                    title="Stop and Log Session"
                    aria-label="Stop and save session"
                  >
                    <Square className="w-3.5 h-3.5 fill-current group-hover:scale-95 transition-transform" />
                  </button>
                )}
              </div>

              {/* Atmosphere Landscapes Channel Selector directly integrated in Center Column */}
              <div className="w-full mt-3.5 flex flex-col gap-2 text-left bg-bg-surface/40 backdrop-blur-xs border border-border/80 p-2.5 rounded-2xl shadow-theme-sm transition-all duration-300">
                <div className={`flex items-center justify-between text-[8px] font-black uppercase tracking-widest w-full px-0.5 ${cardMetaTextClass}`}>
                  <span className="flex items-center gap-1.5">
                    <Music4 className="w-3.5 h-3.5 text-primary" />
                    <span>🎧 Landscapes Channels</span>
                  </span>
                  <button
                    onClick={() => setAmbientSound(null)}
                    className={`text-[8px] uppercase tracking-widest transition-all cursor-pointer font-extrabold focus-visible:ring-2 focus-visible:ring-primary/50 outline-none ${
                      currentSoundId === null
                        ? "text-primary font-black"
                        : "text-text-muted hover:text-text-primary"
                    }`}
                  >
                    Silence Off
                  </button>
                </div>

                <div className="w-full relative mt-0.5">
                  <div 
                    ref={scrollRef}
                    onWheel={handleWheel}
                    className="flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-hide py-0 px-0.5 w-full select-none scroll-smooth"
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
                            className={`h-7 px-3 rounded-full text-[9px] font-bold transition-all duration-305 cursor-pointer flex items-center justify-center gap-1.5 border shrink-0 focus-visible:ring-2 focus-visible:ring-primary/50 outline-none ${
                              !isSoundEnabled
                                ? "opacity-25 bg-bg-surface/20 border-border cursor-not-allowed border-dashed text-text-muted"
                                : isSelected ? landscapesBtnSelected : landscapesBtnUnselected
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

                {/* Volume Control bar */}
                {currentSoundId && (
                  <div className={`flex items-center gap-2 mt-1.5 px-2 py-1 rounded-lg w-full ${volumeSliderContainerClass}`}>
                    <button
                      onClick={toggleMute}
                      className="text-text-secondary hover:text-text-primary transition-colors cursor-pointer focus:outline-none shrink-0"
                      aria-label="Mute toggle"
                    >
                      {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-500" /> : <Volume2 className="w-3.5 h-3.5 text-text-secondary" />}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={isMuted ? 0 : volume}
                      onChange={(e) => setVolume(parseFloat(e.target.value))}
                      className={`w-full accent-primary rounded-lg appearance-none cursor-pointer h-0.5 -translate-y-px disabled:opacity-20 focus:outline-none ${volumeSliderTrackClass}`}
                      aria-label="Volume slider"
                    />
                    <span className="text-[8px] font-black tabular-nums w-5 text-right shrink-0">
                      {isMuted ? "0%" : `${Math.round(volume * 100)}%`}
                    </span>
                  </div>
                )}
              </div>

            </div>

            {/* Column 3: Environment, Target & Streaks (3 Compact Cards) */}
            <div className="flex flex-col gap-2.5 order-3 w-full max-w-sm mx-auto">
              
              {/* Environment details card */}
              <div className={`p-2.5 rounded-xl border border-l-4 border-l-primary/75 transition-all duration-300 shadow-sm flex items-center justify-between hover:-translate-y-px h-[64px] ${cardClass}`}>
                <div className="flex flex-col text-left min-w-0">
                  <span className={`text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 leading-none ${cardTitleClass}`}>
                    <Music4 className="w-3.5 h-3.5 text-primary" />
                    <span>Atmosphere</span>
                  </span>
                  <h4 className={`text-xs font-extrabold truncate mt-0.5 leading-tight ${cardContentTextClass}`}>{soundName}</h4>
                  <span className={`text-[8px] font-bold truncate mt-0.5 leading-none ${cardMetaTextClass}`}>
                    {currentSoundObj ? currentSoundObj.subtitle : "Silence off - pure study"}
                  </span>
                </div>
                
                {/* CSS Audio visualizer waves */}
                <div className="flex items-end gap-0.5 h-3 shrink-0 pr-0.5 select-none">
                  <div className={`w-0.5 bg-primary rounded-full transition-all duration-305 ${isAtmospherePlaying ? "animate-audio-wave-1" : "h-1"}`} />
                  <div className={`w-0.5 bg-primary rounded-full transition-all duration-305 ${isAtmospherePlaying ? "animate-audio-wave-2" : "h-1.5"}`} />
                  <div className={`w-0.5 bg-primary rounded-full transition-all duration-305 ${isAtmospherePlaying ? "animate-audio-wave-3" : "h-1"}`} />
                </div>
              </div>

              {/* Progress target progress card */}
              <div className={`p-2.5 rounded-xl border border-l-4 border-l-purple-500/75 transition-all duration-305 shadow-sm flex flex-col justify-between hover:-translate-y-px h-[64px] ${cardClass}`}>
                <span className={`text-[8px] font-black uppercase tracking-widest block mb-0.5 flex items-center gap-1.5 leading-none ${cardTitleClass}`}>
                  <Calendar className="w-3.5 h-3.5 text-purple-400" />
                  <span>Today's Target</span>
                </span>
                <div className={`flex items-center justify-between text-[9px] font-bold mt-0.5 leading-none ${cardMetaTextClass}`}>
                  <span>Target completed</span>
                  <span className={`font-mono leading-none ${cardContentTextClass}`}>
                    {Math.round((progressPercent / 100) * session.duration / 60)} / {Math.round(session.duration / 60)}m
                  </span>
                </div>
                <div className={`w-full rounded-full h-1 mt-0.5 overflow-hidden ${targetProgressBgClass}`}>
                  <div 
                    className="bg-gradient-to-r from-primary to-accent h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, progressPercent)}%` }}
                  />
                </div>
              </div>

              {/* Study Streak Card */}
              <div className={`p-2.5 rounded-xl border border-l-4 border-l-amber-500/75 transition-all duration-305 shadow-sm flex items-center gap-3 hover:-translate-y-px h-[64px] ${cardClass}`}>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${streakCardIconBg}`}>
                  <Zap className="w-3.5 h-3.5 text-amber-500 fill-current animate-pulse" />
                </div>
                <div className="flex flex-col text-left min-w-0">
                  <span className={`text-[8px] font-black uppercase tracking-widest leading-none ${cardTitleClass}`}>
                    Active Streak
                  </span>
                  <h4 className={`text-xs font-extrabold mt-0.5 leading-tight font-mono ${cardContentTextClass}`}>
                    {stats.currentStreak || 0} Days Streak
                  </h4>
                  <span className={`text-[8px] font-bold truncate mt-0.5 leading-none ${cardMetaTextClass}`}>
                    Keep study rhythms aligned!
                  </span>
                </div>
              </div>

            </div>

          </div>
        )}
      </div>

      {/* 4. Study Quote Footer */}
      <div className="w-full shrink-0 pt-0.5 pb-0.5 text-center select-none z-10">
        <p className={`text-[8px] font-bold italic tracking-wider transition-opacity duration-305 ${quoteTextClass} ${fadeQuote ? "opacity-60" : "opacity-0"}`}>
          ✨ {STUDY_QUOTES[quoteIndex]}
        </p>
      </div>

      {/* 6. Leave confirmation modal dialog */}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[260] flex items-center justify-center p-4">
          <div className={`p-5 rounded-2xl max-w-xs w-full text-center shadow-2xl relative animate-in zoom-in-95 duration-200 border ${cardClass}`}>
            <h3 className="text-sm font-extrabold mb-1.5">Leave Focus Workspace?</h3>
            <p className={`text-[10px] mb-4 leading-relaxed ${cardMetaTextClass}`}>Your study session is still active.</p>
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
                className={`w-full py-2 border font-bold rounded-xl text-xs transition-all cursor-pointer text-center focus-visible:ring-2 focus-visible:ring-[#10D28F] outline-none ${landscapesBtnUnselected}`}
              >
                Minimize Session
              </button>
              <button
                onClick={() => {
                  setShowLeaveModal(false);
                  cancelSession();
                  navigate("/dashboard");
                }}
                className="w-full py-2 bg-rose-600/10 hover:bg-rose-600/20 border border-rose-900/50 hover:border-rose-800 text-rose-500 font-bold rounded-xl text-xs transition-all cursor-pointer text-center focus-visible:ring-2 focus-visible:ring-[#10D28F] outline-none"
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
