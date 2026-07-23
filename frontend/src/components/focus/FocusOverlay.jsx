import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import useStudySession from "../../hooks/useStudySession";
import useStudyTimer from "../../hooks/useStudyTimer";
import useAmbientSound from "../../hooks/useAmbientSound";
import FocusProgress from "./FocusProgress";
import focusStorage from "../../services/FocusStorage";
import {
  STATUS_RUNNING,
  STATUS_PAUSED,
  STATUS_COMPLETED,
  STATUS_CANCELLED,
  ACTIVITY_QUICK,
  SOURCE_HEADER
} from "../../constants/StudySessionConstants";
import {
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
  Square,
  ArrowLeft,
  Calendar,
  Clock,
  Zap,
  Activity,
  Award,
  BookOpen,
  Plus,
  Quote,
  TrendingUp,
  MessageSquare
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
  const { user, recordStreak } = useAuth();
  const {
    session,
    createSession,
    startSession,
    pauseSession,
    resumeSession,
    cancelSession,
    completeSession,
    updateSession,
    canStart,
    canPause,
    canResume,
    canComplete,
    canCancel
  } = useStudySession();

  const { progressPercent, formattedTime, remainingTime } = useStudyTimer();
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
  const [history, setHistory] = useState([]);

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

  // Persistent notes state
  const [sessionNotes, setSessionNotes] = useState(() => localStorage.getItem("cleverprep_focus_notes") || "");

  useEffect(() => {
    setHistory(focusStorage.loadHistory() || []);
    setStats(focusStorage.loadStats() || {});
  }, [session]);

  const handleNotesChange = (e) => {
    setSessionNotes(e.target.value);
    localStorage.setItem("cleverprep_focus_notes", e.target.value);
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
    if (canComplete()) {
      completeSession();
      recordStreak();
    }
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

  const handleBackClick = () => {
    if (session && [STATUS_RUNNING, STATUS_PAUSED].includes(session.status)) {
      setShowLeaveModal(true);
    } else {
      navigate("/dashboard");
    }
  };

  // Rotating study quote timers
  useEffect(() => {
    const timer = setInterval(() => {
      setFadeQuote(false);
      setTimeout(() => {
        setQuoteIndex((prev) => (prev + 1) % STUDY_QUOTES.length);
        setFadeQuote(true);
      }, 300);
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const isSessionActive = session && ![STATUS_COMPLETED, STATUS_CANCELLED].includes(session.status);
  const isRunning = session?.status === STATUS_RUNNING;
  const isAtmospherePlaying = currentSoundId && isRunning && !isMuted;

  const currentSoundObj = currentSoundId ? ambientSounds.find((s) => s.id === currentSoundId) : null;
  const soundName = currentSoundObj ? currentSoundObj.title : "Silence Off";

  // Statistics Calculations
  const getTodayFocusTime = () => {
    if (!history || history.length === 0) return 0;
    const todayStr = new Date().toLocaleDateString("en-CA");
    const todaySessions = history.filter(h => h.date === todayStr);
    return todaySessions.reduce((acc, h) => acc + h.completedDuration, 0);
  };

  const getEstimatedFinishTime = () => {
    if (!session || session.status !== STATUS_RUNNING) return "--:--";
    const finishDate = new Date(Date.now() + (remainingTime || 0) * 1000);
    return finishDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const todayMins = getTodayFocusTime();
  const pomodoroCount = Math.floor(todayMins / 25);
  const focusScore = history.length > 0 ? Math.round(history.reduce((acc, item) => acc + (item.completedDuration / item.totalDuration), 0) / history.length * 100) : 100;
  const longestSession = history.length > 0 ? Math.max(...history.map(h => h.completedDuration)) : 0;
  const totalHours = (history.reduce((acc, item) => acc + item.completedDuration, 0) / 60).toFixed(1);

  // Layout Styles
  const cardClass = "bg-bg-surface/30 border border-border/55 hover:border-border/80 text-text-primary rounded-2xl shadow-xs transition-all duration-200";
  const btnSecondaryClass = "bg-bg-surface border border-border text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover";
  const inputClass = "bg-bg-surface border border-border text-text-primary placeholder:text-text-muted focus:border-primary/50 focus:bg-bg-surface";
  const landscapesBtnUnselected = "bg-bg-surface/40 border border-border/80 hover:border-border text-text-secondary hover:text-text-primary transition-all duration-200";
  const landscapesBtnSelected = "bg-primary text-primary-text border-primary font-black scale-102 shadow-theme-md transition-all duration-200";

  return (
    <div 
      className="flex flex-col justify-between w-full min-h-[calc(100vh-130px)] lg:min-h-0 lg:h-full select-none transition-all duration-300 font-display p-3 sm:p-5 relative overflow-y-auto"
      style={{
        background: `radial-gradient(circle at center, rgba(139, 92, 246, 0.05) 0%, rgba(99, 102, 241, 0.02) 40%, rgba(15, 23, 42, 0) 70%), linear-gradient(135deg, var(--color-bg-base) 0%, var(--color-bg-surface) 100%)`
      }}
    >
      
      {/* 1. Header Toolbar */}
      <div className="relative z-10 flex items-center justify-between gap-4 w-full shrink-0 pb-2 border-b border-border/60 select-none mb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={handleBackClick}
            className={`p-1 border rounded-lg transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-primary/50 outline-none ${btnSecondaryClass}`}
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <div className="flex flex-col text-left justify-center">
            <h2 className="text-sm font-extrabold leading-none text-text-primary">
              Focus Workspace
            </h2>
            <p className="text-[9px] font-bold text-text-muted mt-0.5 uppercase tracking-wider">cleverprep deep focus</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => navigate("/focus/history")}
            className={`px-2.5 py-1 border rounded-lg transition-all text-[9px] font-black uppercase tracking-wider focus-visible:ring-2 focus-visible:ring-primary/50 outline-none cursor-pointer ${btnSecondaryClass}`}
          >
            History
          </button>
          <button
            onClick={() => navigate("/focus/analytics")}
            className={`px-2.5 py-1 border rounded-lg transition-all text-[9px] font-black uppercase tracking-wider focus-visible:ring-2 focus-visible:ring-primary/50 outline-none cursor-pointer ${btnSecondaryClass}`}
          >
            Analytics
          </button>
        </div>
      </div>

      {/* 2. Top Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mb-4 shrink-0">
        <div className={`${cardClass} p-2.5 text-left`}>
          <span className="text-[7.5px] font-black text-text-muted uppercase tracking-wider block">Today's Focus</span>
          <h3 className="text-xs font-black text-text-primary mt-0.5">{todayMins}m</h3>
          <span className="text-[7px] text-text-muted block mt-0.5">Daily Goal: 60m</span>
        </div>
        <div className={`${cardClass} p-2.5 text-left`}>
          <span className="text-[7.5px] font-black text-text-muted uppercase tracking-wider block">Current Session</span>
          <h3 className="text-xs font-black text-text-primary mt-0.5">
            {isSessionActive ? (isRunning ? "Running" : "Paused") : "Idle"}
          </h3>
          <span className="text-[7px] text-text-muted block mt-0.5">Mode: Quick Block</span>
        </div>
        <div className={`${cardClass} p-2.5 text-left`}>
          <span className="text-[7.5px] font-black text-text-muted uppercase tracking-wider block">Active Streak</span>
          <h3 className="text-xs font-black text-text-primary mt-0.5">{user?.currentStreak || 0} Days</h3>
          <span className="text-[7px] text-text-muted block mt-0.5">Record: {user?.longestStreak || 0}d</span>
        </div>
        <div className={`${cardClass} p-2.5 text-left`}>
          <span className="text-[7.5px] font-black text-text-muted uppercase tracking-wider block">Target Progress</span>
          <h3 className="text-xs font-black text-text-primary mt-0.5">{Math.min(100, Math.round((todayMins / 60) * 100))}%</h3>
          <span className="text-[7px] text-text-muted block mt-0.5">Complete</span>
        </div>
        <div className={`${cardClass} p-2.5 text-left`}>
          <span className="text-[7.5px] font-black text-text-muted uppercase tracking-wider block">Ambient Mode</span>
          <h3 className="text-xs font-black text-text-primary truncate mt-0.5" title={soundName}>{soundName}</h3>
          <span className="text-[7px] text-text-muted block mt-0.5">Volume: {Math.round(volume * 100)}%</span>
        </div>
        <div className={`${cardClass} p-2.5 text-left`}>
          <span className="text-[7.5px] font-black text-text-muted uppercase tracking-wider block">Current Goal</span>
          <h3 className="text-xs font-black text-text-primary truncate mt-0.5" title={session?.goal || "None"}>
            {session?.goal || "Not Configured"}
          </h3>
          <span className="text-[7px] text-text-muted block mt-0.5">Active Objective</span>
        </div>
      </div>

      {/* 3. Main Dashboard Layout Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[230px_1fr_240px] gap-5.5 items-start w-full max-w-[1550px] mx-auto overflow-hidden py-1">
        
        {/* ========================================== */}
        {/* LEFT COLUMN: ACTIVE STATUS & WORK DETAILS  */}
        {/* ========================================== */}
        <div className="flex flex-col gap-3.5 order-2 lg:order-1 text-left w-full">
          <h4 className="text-[8px] font-black uppercase tracking-widest text-text-muted px-1">Session Dashboard</h4>
          
          {/* Session Status Widget */}
          <div className={`${cardClass} p-3.5`}>
            <span className="text-[7.5px] font-black text-text-muted uppercase tracking-wider block">Status</span>
            <div className="flex items-center gap-2 mt-1.5">
              <span className={`w-2 h-2 rounded-full ${isSessionActive ? (isRunning ? "bg-emerald-500 animate-pulse" : "bg-amber-500") : "bg-slate-500"}`} />
              <span className="text-xs font-extrabold text-text-primary">
                {isSessionActive ? (isRunning ? "Active Session" : "Paused") : "Workspace Idle"}
              </span>
            </div>
            <p className="text-[8px] font-bold text-text-secondary mt-2 leading-relaxed">
              {isSessionActive ? "Focus minutes are actively synced to daily milestones." : "Configure parameters in the centerpiece to begin."}
            </p>
          </div>

          {/* Today's Goals Info */}
          <div className={`${cardClass} p-3.5`}>
            <span className="text-[7.5px] font-black text-text-muted uppercase tracking-wider block mb-1">Targets</span>
            <div className="space-y-2 mt-1">
              <div className="flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-primary shrink-0" />
                <div className="min-w-0">
                  <span className="text-[9px] font-extrabold text-text-primary block leading-none">Daily Target</span>
                  <span className="text-[7.5px] text-text-muted font-bold mt-0.5 block leading-none">60 Minutes</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 pt-1.5 border-t border-border/30">
                <Award className="w-3.5 h-3.5 text-accent shrink-0" />
                <div className="min-w-0">
                  <span className="text-[9px] font-extrabold text-text-primary block leading-none">Deep Goal</span>
                  <span className="text-[7.5px] text-text-muted font-bold mt-0.5 block leading-none">Master complex topics</span>
                </div>
              </div>
            </div>
          </div>

          {/* Direct Notes Widget */}
          <div className={`${cardClass} p-3.5 flex flex-col gap-1.5`}>
            <span className="text-[7.5px] font-black text-text-muted uppercase tracking-wider block flex items-center gap-1 leading-none">
              <MessageSquare className="w-3 h-3 text-purple-400" />
              <span>Workspace Notes</span>
            </span>
            <textarea
              value={sessionNotes}
              onChange={handleNotesChange}
              placeholder="Keep study notes, formulas, or reminders here..."
              className="w-full h-[88px] bg-bg-base/30 border border-border/40 focus:border-primary/50 text-[9px] rounded-lg p-2 resize-none placeholder:text-text-muted text-text-primary focus:outline-none transition-colors"
            />
          </div>

          {/* Rotating Motivational quote */}
          <div className="px-2.5 py-2 border border-dashed border-border/40 rounded-xl bg-bg-surface/10">
            <Quote className="w-3 h-3 text-primary/40 mb-1" />
            <p className={`text-[8.5px] font-semibold italic text-text-muted tracking-wide transition-opacity duration-300 leading-normal ${fadeQuote ? "opacity-75" : "opacity-0"}`}>
              {STUDY_QUOTES[quoteIndex]}
            </p>
          </div>
        </div>

        {/* ========================================== */}
        {/* COLUMN 2: HERO CENTERPIECE (TIMER/SETUP)   */}
        {/* ========================================== */}
        <div className="order-1 lg:order-2 flex flex-col items-center justify-center w-full min-h-[300px] lg:min-h-0 relative z-10">
          
          {!isSessionActive ? (
            /* Guided Setup Card */
            <div className="w-full max-w-[480px] rounded-2xl p-6.5 shadow-theme-lg animate-in zoom-in-99 duration-250 border bg-bg-surface/50 backdrop-blur-md border-border/60 relative z-10">
              <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4 transition-transform hover:scale-105">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>

              <h3 className="text-sm font-black text-center tracking-tight leading-tight mb-1.5 text-text-primary">
                Create Study Session
              </h3>
              
              <p className="text-[9.5px] text-center leading-relaxed mb-6 max-w-[340px] mx-auto text-text-secondary font-medium">
                Disconnect from distractions. Dedicate structured focus blocks to master study concepts.
              </p>

              {/* Guided Step 1: Select Duration */}
              {setupStep === 1 && (
                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-1 duration-200">
                  <label className="text-[7.5px] font-black uppercase tracking-widest block text-text-muted text-center mb-0.5">
                    Step 1: Select Timer Duration
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[25, 30, 45, 60].map((mins) => (
                      <button
                        key={mins}
                        onClick={() => {
                          setSetupDuration(mins);
                          setIsCustomDuration(false);
                        }}
                        className={`py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer border h-8 flex items-center justify-center focus-visible:ring-2 focus-visible:ring-primary/50 outline-none ${
                          !isCustomDuration && setupDuration === mins
                            ? "bg-primary text-primary-text border-primary shadow-theme-sm"
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
                      className={`w-full py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer border h-8 flex items-center justify-center focus-visible:ring-2 focus-visible:ring-primary/50 outline-none ${
                        isCustomDuration
                          ? "bg-primary text-primary-text border-primary shadow-theme-sm"
                          : landscapesBtnUnselected
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
                          className={`w-full h-8.5 px-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/40 text-[10px] ${inputClass}`}
                        />
                      </div>
                    )}
                  </div>

                  <button
                    disabled={isCustomDuration && (!customMinutes || parseInt(customMinutes) <= 0)}
                    onClick={() => setSetupStep(2)}
                    className="w-full mt-3 py-2 bg-primary hover:bg-primary-hover text-primary-text rounded-lg text-[10px] font-black shadow-theme-md transition-all cursor-pointer flex items-center justify-center gap-1.5 hover:-translate-y-0.5 disabled:opacity-40 disabled:pointer-events-none focus-visible:ring-2 focus-visible:ring-primary/50 outline-none h-9"
                  >
                    <span>Continue to Goal Setup</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Guided Step 2: Goal Input */}
              {setupStep === 2 && (
                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-1 duration-200">
                  <label className="text-[7.5px] font-black uppercase tracking-widest block text-text-muted text-center mb-0.5">
                    Step 2: What are you working on?
                  </label>
                  <div className="relative">
                    <Target className="absolute left-3 top-2.5 w-3.5 h-3.5 text-text-muted" />
                    <input
                      type="text"
                      value={inputGoal}
                      onChange={(e) => setInputGoal(e.target.value)}
                      placeholder="E.g. Study notes, solve practice quiz..."
                      className={`w-full pl-8.5 h-8.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/40 text-[10px] ${inputClass}`}
                      autoFocus
                    />
                  </div>

                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => setSetupStep(1)}
                      className={`flex-1 py-2 rounded-lg text-[10px] font-black transition-all cursor-pointer text-center focus-visible:ring-2 focus-visible:ring-primary/50 outline-none h-9 ${landscapesBtnUnselected}`}
                    >
                      Back
                    </button>
                    <button
                      onClick={handleStartStudySession}
                      className="flex-1 py-2 bg-primary hover:bg-primary-hover text-primary-text rounded-lg text-[10px] font-black shadow-theme-md transition-all cursor-pointer text-center hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-primary/50 outline-none h-9"
                    >
                      Begin Session
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Active Hero Timer Layout */
            <div className="flex flex-col items-center justify-center w-full max-w-[350px]">
              
              {/* Active goal badge pill above timer */}
              <div className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-full mb-3 shadow-xs flex items-center gap-1.5 animate-in fade-in">
                <Target className="w-3 h-3 text-primary animate-pulse" />
                <span className="text-[8px] font-black text-primary uppercase tracking-widest truncate max-w-[190px]">
                  {session.goal || "Focus Block Active"}
                </span>
              </div>

              {/* Symmetrical dashboard indicators surrounding the timer */}
              <div className="relative flex items-center justify-center w-full h-[210px] shrink-0">
                
                {/* Center Core: Scalar SVG Timer */}
                <div className="absolute z-10 scale-[1.05]">
                  <FocusProgress
                    progressPercent={progressPercent}
                    formattedTime={formattedTime}
                    status={session.status}
                  />
                </div>

                {/* Apple Fitness style indicator pills arranged gracefully */}
                <div className="absolute top-1 -left-3 px-2 py-0.5 bg-bg-surface/50 border border-border/50 text-[7px] font-black uppercase tracking-wider rounded-md text-text-secondary flex items-center gap-1">
                  <Clock className="w-2 h-2 text-primary" />
                  <span>Est. End: {getEstimatedFinishTime()}</span>
                </div>

                <div className="absolute top-1 -right-3 px-2 py-0.5 bg-bg-surface/50 border border-border/50 text-[7px] font-black uppercase tracking-wider rounded-md text-text-secondary flex items-center gap-1">
                  <Zap className="w-2 h-2 text-amber-400" />
                  <span>Pomodoro: {pomodoroCount}</span>
                </div>

                <div className="absolute bottom-1 -left-3 px-2 py-0.5 bg-bg-surface/50 border border-border/50 text-[7px] font-black uppercase tracking-wider rounded-md text-text-secondary flex items-center gap-1">
                  <Activity className="w-2 h-2 text-emerald-400" />
                  <span>Today Complete: {Math.min(100, Math.round((todayMins / 60) * 100))}%</span>
                </div>

                <div className="absolute bottom-1 -right-3 px-2 py-0.5 bg-bg-surface/50 border border-border/50 text-[7px] font-black uppercase tracking-wider rounded-md text-text-secondary flex items-center gap-1">
                  <Award className="w-2 h-2 text-purple-400" />
                  <span>Focus Score: {focusScore}%</span>
                </div>
              </div>

              {/* Playback Controls */}
              <div className="flex items-center gap-4 py-2 mt-2 shrink-0 relative z-20">
                {canCancel() && (
                  <button
                    onClick={handleCancel}
                    className="w-8.5 h-8.5 rounded-full transition-all flex items-center justify-center group focus-visible:ring-2 focus-visible:ring-primary/50 outline-none cursor-pointer bg-bg-surface border border-border text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover hover:scale-105 shadow-theme-sm"
                    title="Restart Session"
                    aria-label="Restart session"
                  >
                    <RotateCcw className="w-3.5 h-3.5 transition-transform group-hover:rotate-[-45deg]" />
                  </button>
                )}

                {canPause() && (
                  <button
                    onClick={handlePause}
                    className="w-10 h-10 rounded-full bg-primary hover:bg-primary-hover text-primary-text flex items-center justify-center transition-all scale-102 hover:scale-105 shadow-theme-md cursor-pointer focus-visible:ring-2 focus-visible:ring-primary/50 outline-none"
                    title="Pause Study Block"
                    aria-label="Pause session"
                  >
                    <Pause className="w-4 h-4 fill-current" />
                  </button>
                )}

                {canStart() && (
                  <button
                    onClick={handleStart}
                    className="w-10 h-10 rounded-full bg-primary hover:bg-primary-hover text-primary-text flex items-center justify-center transition-all scale-102 hover:scale-105 shadow-theme-md cursor-pointer focus-visible:ring-2 focus-visible:ring-primary/50 outline-none"
                    title="Start Study Block"
                    aria-label="Start session"
                  >
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </button>
                )}

                {canResume() && (
                  <button
                    onClick={handleResume}
                    className="w-10 h-10 rounded-full bg-primary hover:bg-primary-hover text-primary-text flex items-center justify-center transition-all scale-102 hover:scale-105 shadow-theme-md cursor-pointer focus-visible:ring-2 focus-visible:ring-primary/50 outline-none"
                    title="Resume Study Block"
                    aria-label="Resume session"
                  >
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </button>
                )}

                {canComplete() && (
                  <button
                    onClick={handleComplete}
                    className="w-8.5 h-8.5 rounded-full transition-all flex items-center justify-center group focus-visible:ring-2 focus-visible:ring-primary/50 outline-none cursor-pointer bg-bg-surface border border-border text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover hover:scale-105 shadow-theme-sm"
                    title="Stop and Log Session"
                    aria-label="Stop and save session"
                  >
                    <Square className="w-3 h-3 fill-current group-hover:scale-95 transition-transform" />
                  </button>
                )}
              </div>
            </div>
          )}

        </div>

        {/* ========================================== */}
        {/* COLUMN 3: RIGHT SIDEBAR PRODUCTIVITY PANEL */}
        {/* ========================================== */}
        <div className="flex flex-col gap-3.5 order-3 text-left w-full">
          <h4 className="text-[8px] font-black uppercase tracking-widest text-text-muted px-1">Productivity & Insights</h4>

          {/* Streak Journey Card */}
          <div className={`${cardClass} p-3.5 flex items-center gap-3`}>
            <div className="w-7.5 h-7.5 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Zap className="w-4.5 h-4.5 text-amber-500 fill-current animate-pulse" />
            </div>
            <div className="min-w-0">
              <span className="text-[7.5px] font-black text-text-muted uppercase tracking-wider block">Active Streak</span>
              <h4 className="text-xs font-black text-text-primary mt-0.5 leading-none">{user?.currentStreak || 0} Days</h4>
              <span className="text-[7px] text-text-secondary block mt-1">Personal Best: {user?.longestStreak || 0} Days</span>
            </div>
          </div>

          {/* Target Progress Card */}
          <div className={`${cardClass} p-3.5`}>
            <span className="text-[7.5px] font-black text-text-muted uppercase tracking-wider block">Weekly Target</span>
            <div className="flex items-center justify-between text-[9px] font-extrabold mt-1.5 leading-none text-text-primary">
              <span>Week Progress</span>
              <span className="font-mono">{totalHours}h / 5.0h</span>
            </div>
            <div className="w-full rounded-full h-1 bg-bg-base border border-border/40 mt-1.5 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-primary to-accent h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (parseFloat(totalHours) / 5) * 100)}%` }}
              />
            </div>
          </div>

          {/* Historical Insights Cards */}
          <div className={`${cardClass} p-3.5`}>
            <span className="text-[7.5px] font-black text-text-muted uppercase tracking-wider block">Insights</span>
            <div className="space-y-2 mt-2">
              <div className="flex items-center justify-between text-[8.5px] font-bold text-text-secondary">
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-indigo-400" />
                  <span>Longest session:</span>
                </span>
                <span className="font-mono text-text-primary">{longestSession} mins</span>
              </div>
              <div className="flex items-center justify-between text-[8.5px] font-bold text-text-secondary pt-1.5 border-t border-border/20">
                <span className="flex items-center gap-1">
                  <Activity className="w-3 h-3 text-emerald-400" />
                  <span>Avg efficiency:</span>
                </span>
                <span className="font-mono text-text-primary">{focusScore}% Score</span>
              </div>
              <div className="flex items-center justify-between text-[8.5px] font-bold text-text-secondary pt-1.5 border-t border-border/20">
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3 h-3 text-sky-400" />
                  <span>Sessions completed:</span>
                </span>
                <span className="font-mono text-text-primary">{history.length} blocks</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* ========================================== */}
      {/* 4. BOTTOM SECTION: LANDSCAPES CHANNELS BAR */}
      {/* ========================================== */}
      <div className="w-full mt-4 shrink-0 bg-bg-surface/35 border border-border/60 p-3 rounded-2xl shadow-theme-md flex flex-col md:flex-row md:items-center justify-between gap-3 text-left">
        
        {/* Left: Currently Playing */}
        <div className="flex items-center gap-3 min-w-[200px]">
          <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <Music4 className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <span className="text-[7.5px] font-black text-text-muted uppercase tracking-wider block">Atmosphere Mode</span>
            <h4 className="text-[11px] font-extrabold truncate text-text-primary leading-tight mt-0.5">{soundName}</h4>
            <span className="text-[8px] text-text-secondary truncate block mt-0.5 leading-none">
              {currentSoundObj ? currentSoundObj.subtitle : "Silence active - pure focus"}
            </span>
          </div>

          {/* Animated audio waves */}
          <div className="flex items-end gap-0.5 h-3.5 shrink-0 pl-1">
            <div className={`w-0.5 bg-primary rounded-full transition-all duration-300 ${isAtmospherePlaying ? "animate-audio-wave-1" : "h-1"}`} />
            <div className={`w-0.5 bg-primary rounded-full transition-all duration-300 ${isAtmospherePlaying ? "animate-audio-wave-2" : "h-1.5"}`} />
            <div className={`w-0.5 bg-primary rounded-full transition-all duration-300 ${isAtmospherePlaying ? "animate-audio-wave-3" : "h-1"}`} />
          </div>
        </div>

        {/* Center: Environment selectors track */}
        <div className="flex-1 overflow-hidden relative mx-2">
          <div 
            ref={scrollRef}
            onWheel={handleWheel}
            className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1 px-1 scroll-smooth w-full select-none"
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
                    className={`h-7 px-3 rounded-full text-[9px] font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 border shrink-0 focus-visible:ring-2 focus-visible:ring-primary/50 outline-none ${
                      !isSoundEnabled
                        ? "opacity-25 bg-bg-surface/20 border-border cursor-not-allowed border-dashed text-text-muted"
                        : isSelected ? landscapesBtnSelected : landscapesBtnUnselected
                    }`}
                    title={isFailed ? "Audio file missing" : sound.title}
                  >
                    <span className="text-xs shrink-0">{sound.icon}</span>
                    <span>{displayTitle}</span>
                  </button>
                );
              })}
          </div>
        </div>

        {/* Right: Volume & Preset Panel */}
        <div className="flex items-center gap-2 min-w-[210px] shrink-0 border-l border-border/40 pl-3.5">
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
            className="w-24 accent-primary rounded-lg appearance-none cursor-pointer h-0.5 -translate-y-px disabled:opacity-20 focus:outline-none bg-bg-base border border-border"
            aria-label="Volume slider"
          />
          <span className="text-[8px] font-black font-mono w-6 text-right shrink-0">
            {isMuted ? "0%" : `${Math.round(volume * 100)}%`}
          </span>

          <button
            onClick={() => setAmbientSound(null)}
            className="px-2 py-0.5 border border-border rounded text-[7.5px] uppercase font-black text-text-secondary hover:text-primary transition-colors cursor-pointer shrink-0 ml-1"
          >
            Silence
          </button>
        </div>

      </div>

      {/* 5. Leave confirmation modal dialog */}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[260] flex items-center justify-center p-4">
          <div className={`${cardClass} p-5 rounded-2xl max-w-xs w-full text-center shadow-2xl relative border bg-bg-surface`}>
            <h3 className="text-sm font-extrabold mb-1.5">Leave Focus Workspace?</h3>
            <p className="text-[10px] mb-4 leading-relaxed text-text-secondary">Your study session is still active.</p>
            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => setShowLeaveModal(false)}
                className="w-full py-2 bg-primary hover:bg-primary-hover text-primary-text font-extrabold rounded-xl text-xs transition-all cursor-pointer text-center focus-visible:ring-2 focus-visible:ring-white outline-none"
              >
                Continue Studying
              </button>
              <button
                onClick={() => {
                  setShowLeaveModal(false);
                  navigate("/dashboard");
                }}
                className={`w-full py-2 border font-bold rounded-xl text-xs transition-all cursor-pointer text-center focus-visible:ring-2 focus-visible:ring-primary/50 outline-none ${landscapesBtnUnselected}`}
              >
                Minimize Session
              </button>
              <button
                onClick={() => {
                  setShowLeaveModal(false);
                  cancelSession();
                  navigate("/dashboard");
                }}
                className="w-full py-2 bg-rose-600/10 hover:bg-rose-600/20 border border-rose-900/50 hover:border-rose-800 text-rose-500 font-bold rounded-xl text-xs transition-all cursor-pointer text-center focus-visible:ring-2 focus-visible:ring-primary/50 outline-none"
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
