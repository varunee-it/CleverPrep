import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, Pause, SkipForward, SkipBack, BookmarkPlus, List, CheckCircle2,
  Clock, Sparkles, MessageSquare, ChevronRight, X, BrainCircuit, LayoutPanelLeft, FileText, Mic, Lock
} from 'lucide-react';
import toast from 'react-hot-toast';
import podcastService from '../../services/podcastService';
import aiService from '../../services/aiService'; // Reusing for contextual chat

const PodcastPlayer = ({ podcast: initialPodcast }) => {
  const [podcast, setPodcast] = useState(initialPodcast);
  const [playerState, setPlayerState] = useState('loading'); // idle, loading, generating, queued, ready, playing, paused, failed
  // eslint-disable-next-line no-unused-vars
  const [audioErrorText, setAudioErrorText] = useState("");
  const [isRetrying, setIsRetrying] = useState(false);
  const shouldAutoPlayRef = useRef(false);
  const [currentChapter, setCurrentChapter] = useState(podcast.lastPlayedChapter || 0);
  const [progress, setProgress] = useState(podcast.lastPlayedPosition || 0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  
  const [noteText, setNoteText] = useState("");
  const [showNoteForm, setShowNoteForm] = useState(false);

  const [activeSegmentIndex, setActiveSegmentIndex] = useState(0);
  const [showSmartPause, setShowSmartPause] = useState(false);
  const [podcastComplete, setPodcastComplete] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  
  const [explainResponse, setExplainResponse] = useState("");
  const [showExplainBox, setShowExplainBox] = useState(false);
  const [explainText, setExplainText] = useState("");
  const [explainLoading, setExplainLoading] = useState(false);

  const audioRef = useRef(null);
  const captionsRef = useRef(null);
  
  const [waveformHeights, setWaveformHeights] = useState([...Array(30)].map(() => 4));

  const goToNextChapter = () => {
      setShowSmartPause(false);
      if (currentChapter < (podcast?.chapters?.length || 1) - 1) {
          shouldAutoPlayRef.current = true; // Auto-continue intent
          setCurrentChapter(prev => prev + 1);
          setProgress(0);
          setActiveSegmentIndex(0);
      } else {
          if (audioRef.current) {
              audioRef.current.currentTime = 0; // Prepare for replay
          }
          setPlayerState('paused');
          setProgress(duration); // Keep at 100%
          setPodcastComplete(true);
      }
  };

  const handleEnded = () => {
      if (podcast?.chapters?.[currentChapter]?.smartPause) {
          // Already handled by timeupdate, but just in case
          return;
      }
      goToNextChapter();
  };

  useEffect(() => {
      if (playerState === 'playing') {
          const interval = setInterval(() => {
              setWaveformHeights([...Array(30)].map(() => Math.max(4, Math.random() * 40 + 8)));
          }, 200);
          return () => clearInterval(interval);
      } else {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setWaveformHeights([...Array(30)].map(() => 4));
      }
  }, [playerState]);

  // Removed early return to prevent hooks from being called conditionally

  const handleRetryChapter = async () => {
      try {
          setIsRetrying(true);
          toast.loading("Starting regeneration...", { id: 'retry-audio' });
          await podcastService.retryChapterAudio(podcast._id, currentChapter);
          toast.success("Regeneration started", { id: 'retry-audio' });
          
          // Optimistically update the status locally to switch UI immediately
          const updatedPodcast = { ...podcast };
          if (updatedPodcast.audioStatus) {
              updatedPodcast.audioStatus[currentChapter] = 'generating';
          }
          setPodcast(updatedPodcast);
          setPlayerState('generating');
          shouldAutoPlayRef.current = true;
      } catch {
          toast.error("Failed to retry. Please try again.", { id: 'retry-audio' });
      } finally {
          setIsRetrying(false);
      }
  };

  // --- Audio Lifecycle Refs ---
  const currentBlobUrlRef = useRef(null);
  const activeAbortControllerRef = useRef(null);
  const activeRequestIdRef = useRef(0);
  const playIntentRef = useRef(false);
  const interactionLockRef = useRef(false);
  const loadedChapterRef = useRef(-1);
  const lastStatusRef = useRef(null);

  // Polling for audio status updates (Does NOT trigger audio reload)
  useEffect(() => {
      const hasPendingAudio = podcast.audioStatus && podcast.audioStatus.some(s => s === 'queued' || s === 'generating');
      if (hasPendingAudio) {
          const interval = setInterval(async () => {
              try {
                  const res = await podcastService.getPodcastById(podcast._id);
                  if (res.success && res.data) {
                      setPodcast(res.data);
                  }
              } catch {
                  // Ignore polling errors
              }
          }, 3500);
          return () => clearInterval(interval);
      }
  }, [podcast.audioStatus, podcast._id]);

  const loadAudio = async (chapterIdx, retries = 3) => {
      const status = podcast.audioStatus ? podcast.audioStatus[chapterIdx] : 'ready';
      
      if (status !== 'ready') {
          setPlayerState(status);
          if (status === 'failed') setAudioErrorText("Audio generation failed for this chapter.");
          return;
      }

      setPlayerState('loading');
      setAudioErrorText("");

      const requestId = ++activeRequestIdRef.current;
      
      if (activeAbortControllerRef.current) {
          activeAbortControllerRef.current.abort();
      }
      const abortController = new AbortController();
      activeAbortControllerRef.current = abortController;

      if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.removeAttribute('src');
          audioRef.current.load();
      }

      if (currentBlobUrlRef.current) {
          const urlToRevoke = currentBlobUrlRef.current;
          setTimeout(() => URL.revokeObjectURL(urlToRevoke), 100);
          currentBlobUrlRef.current = null;
      }

      let attempt = 0;
      let blob = null;

      while (attempt < retries) {
          try {
              if (abortController.signal.aborted) return;
              blob = await podcastService.getAudioBlob(podcast._id, chapterIdx, { signal: abortController.signal });
              break;
          } catch (error) {
              if (abortController.signal.aborted || error.name === 'CanceledError') return;
              attempt++;
              if (attempt >= retries) {
                  console.error("Failed to load audio after retries:", error);
                  
                  if (import.meta.env.DEV && 'speechSynthesis' in window) {
                      console.warn("Falling back to browser SpeechSynthesis");
                      const text = podcast?.chapters?.[chapterIdx]?.segments?.map(s => s.text).join(' ');
                      if (text) {
                          const utterance = new SpeechSynthesisUtterance(text);
                          utterance.onend = () => handleEnded();
                          window.speechSynthesis.speak(utterance);
                          setPlayerState('playing');
                          return;
                      }
                  }

                  if (requestId === activeRequestIdRef.current) {
                      setPlayerState('failed');
                      if (error instanceof Blob) {
                          try {
                              const text = await error.text();
                              const json = JSON.parse(text);
                              setAudioErrorText(json.error || json.message || "Playback failed after multiple attempts.");
                          } catch {
                              setAudioErrorText("Playback failed after multiple attempts.");
                          }
                      } else {
                          setAudioErrorText(error.error || error.message || "Playback failed after multiple attempts.");
                      }
                  }
                  return;
              }
              await new Promise(res => setTimeout(res, 1000 * Math.pow(2, attempt - 1)));
          }
      }

      if (abortController.signal.aborted || requestId !== activeRequestIdRef.current) return;

      const objectUrl = URL.createObjectURL(blob);
      currentBlobUrlRef.current = objectUrl;

      if (audioRef.current) {
          audioRef.current.src = objectUrl;
          audioRef.current.load();
          
          if (chapterIdx === podcast.lastPlayedChapter && podcast.lastPlayedPosition > 0) {
              audioRef.current.currentTime = podcast.lastPlayedPosition;
          }
          
          if (shouldAutoPlayRef.current && !showSmartPause) {
              shouldAutoPlayRef.current = false;
              playIntentRef.current = true;
          }
      }
  };

  useEffect(() => {
      const status = podcast.audioStatus ? podcast.audioStatus[currentChapter] : 'ready';
      
      const chapterChanged = loadedChapterRef.current !== currentChapter;
      const statusBecameReady = status === 'ready' && lastStatusRef.current !== 'ready' && lastStatusRef.current !== null;

      if (chapterChanged || statusBecameReady) {
          loadedChapterRef.current = currentChapter;
          loadAudio(currentChapter);
      }
      
      lastStatusRef.current = status;
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentChapter, podcast._id, podcast.audioStatus]);

  useEffect(() => {
      return () => {
          if (activeAbortControllerRef.current) activeAbortControllerRef.current.abort();
          if (currentBlobUrlRef.current) URL.revokeObjectURL(currentBlobUrlRef.current);
      };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
        audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  // Dynamic scaled segment timings based on current audio duration
  const getSegmentTimings = (chapter, actualDuration) => {
      const timings = [];
      let currentTime = 0;
      const WORDS_PER_SECOND = 150 / 60; // 2.5 words per sec

      if (!chapter || !chapter.segments) return timings;

      chapter.segments.forEach(seg => {
          const words = seg.text.trim().split(/\s+/).length;
          const duration = words / WORDS_PER_SECOND;
          timings.push({ 
              start: currentTime, 
              end: currentTime + duration, 
              text: seg.text, 
              speaker: seg.speaker,
              words: seg.words // Future-ready word timestamps if present
          });
          currentTime += duration;
      });

      if (actualDuration > 0 && currentTime > 0) {
          const scaleFactor = actualDuration / currentTime;
          timings.forEach(t => {
              t.start = t.start * scaleFactor;
              t.end = t.end * scaleFactor;
              if (t.words && Array.isArray(t.words)) {
                  t.words.forEach(w => {
                      w.start = w.start * scaleFactor;
                      w.end = w.end * scaleFactor;
                  });
              }
          });
      }
      return timings;
  };

  const segmentTimings = getSegmentTimings(podcast?.chapters?.[currentChapter], duration);

  const renderProgressiveWords = (seg, idx, currentTime) => {
      if (idx !== activeSegmentIndex) return null;
      
      let words = [];
      if (seg.words && Array.isArray(seg.words)) {
          words = seg.words;
      } else {
          const rawWords = seg.text.trim().split(/\s+/);
          const segmentDuration = seg.end - seg.start;
          const wordDuration = rawWords.length > 0 ? segmentDuration / rawWords.length : 0;
          words = rawWords.map((word, i) => {
              const wStart = seg.start + (i * wordDuration);
              const wEnd = wStart + wordDuration;
              return { text: word, start: wStart, end: wEnd };
          });
      }

      return (
          <p className="text-lg sm:text-xl md:text-2xl font-extrabold text-white leading-relaxed tracking-wide font-display">
              {words.map((word, wIdx) => {
                  const isWordSpoken = currentTime >= word.start;
                  return (
                      <span 
                          key={wIdx} 
                          className={`inline-block mr-1.5 transition-all duration-200 ${
                              isWordSpoken 
                                  ? 'text-white scale-100 opacity-100' 
                                  : 'text-white/0 scale-95 opacity-0 select-none'
                          }`}
                      >
                          {word.text}
                      </span>
                  );
              })}
          </p>
      );
  };

  const togglePlay = async () => {
    if (interactionLockRef.current) return;
    interactionLockRef.current = true;
    setTimeout(() => { interactionLockRef.current = false; }, 300);

    if (playerState === 'queued' || playerState === 'generating' || playerState === 'loading') {
        playIntentRef.current = true;
        return;
    }
    
    if (!audioRef.current) return;
    
    try {
        if (!audioRef.current.paused) {
            audioRef.current.pause();
            playIntentRef.current = false;
            setPlayerState('paused');
        } else {
            playIntentRef.current = true;
            await audioRef.current.play();
            setPlayerState('playing');
        }
    } catch (e) {
        console.error("Playback failed:", e);
        if (e.name !== 'AbortError') {
            setPlayerState('paused');
            playIntentRef.current = false;
        }
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const currentTime = audioRef.current.currentTime;
      setProgress(currentTime);
      setDuration(audioRef.current.duration || 0);

      // Live Captions Sync
      let activeIdx = segmentTimings.findIndex(t => currentTime >= t.start && currentTime <= t.end);
      
      // If we are in a silence gap between sentences, keep the finished sentence visible for up to 250ms
      if (activeIdx === -1 && segmentTimings.length > 0) {
          const lastEndedIdx = [...segmentTimings].reverse().findIndex(t => currentTime >= t.end);
          if (lastEndedIdx !== -1) {
              const actualIdx = segmentTimings.length - 1 - lastEndedIdx;
              const lastSegment = segmentTimings[actualIdx];
              if (currentTime - lastSegment.end <= 0.25) {
                  activeIdx = actualIdx;
              }
          }
      }

      if (activeIdx === -1 && segmentTimings.length > 0) {
          if (currentTime >= segmentTimings[segmentTimings.length - 1].end) {
              activeIdx = segmentTimings.length - 1;
          } else if (currentTime < segmentTimings[0].start) {
              activeIdx = 0;
          }
      }
      if (activeIdx !== -1 && activeIdx !== activeSegmentIndex) {
          setActiveSegmentIndex(activeIdx);
      }

      // Check if we reached the smart pause timing
      const chapterPausePoint = podcast.chapters[currentChapter]?.smartPause;
      if (chapterPausePoint && currentTime >= chapterPausePoint && currentTime < (chapterPausePoint + 2) && !showSmartPause) {
          audioRef.current.pause();
          setPlayerState('paused');
          setShowSmartPause(true);
      }
    }
  };

  // Auto-scroll transcript smoothly to the active sentence
  useEffect(() => {
      if (captionsRef.current) {
          const lastChild = captionsRef.current.lastElementChild;
          if (lastChild) {
              lastChild.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
      }
  }, [activeSegmentIndex]);

  // handleEnded and goToNextChapter moved up

  const handleSeek = (e) => {
    if (audioRef.current) {
      const time = Number(e.target.value);
      audioRef.current.currentTime = time;
      setProgress(time);
    }
  };

  const skipForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(audioRef.current.currentTime + 15, duration);
    }
  };

  const skipBack = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(audioRef.current.currentTime - 15, 0);
    }
  };

  const formatTime = (time) => {
    if (isNaN(time) || !isFinite(time) || time < 0) return "--:--";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const saveBookmark = async () => {
      try {
          const time = audioRef.current?.currentTime || 0;
          await podcastService.addBookmark(podcast._id, time, currentChapter, noteText);
          toast.success("Bookmark saved!");
          setShowNoteForm(false);
          setNoteText("");
      } catch {
          toast.error("Failed to save bookmark");
      }
  };

  const handleExplain = async () => {
      if (!explainText) return;
      try {
          setExplainLoading(true);
          const response = await aiService.explainConcept(podcast.documentId, explainText);
          setExplainResponse(response.explanation);
      } catch (err) {
          console.error("Explain error:", err);
          toast.error("Failed to explain concept.");
      } finally {
          setExplainLoading(false);
      }
  };

  const currentStatus = podcast?.audioStatus ? podcast.audioStatus[currentChapter] : 'ready';
  const isGenerating = currentStatus !== 'ready';
  const totalChapters = podcast?.chapters?.length || 1;
  const readyCount = podcast?.audioStatus ? podcast.audioStatus.filter(s => s === 'ready').length : totalChapters;
  const anyGenerating = podcast?.audioStatus && podcast.audioStatus.some(s => s !== 'ready');
  const generatingChapterIndex = podcast?.audioStatus?.findIndex(s => s === 'generating') ?? -1;
  const generatingBlocks = podcast?.chapters?.[generatingChapterIndex]?.segments?.length || 18;

  if (!podcast?.chapters || podcast.chapters.length === 0) {
      return (
          <div className="bg-white rounded-3xl p-12 shadow-sm border border-slate-200 text-center relative overflow-hidden">
              <div className="relative z-10 max-w-lg mx-auto">
                  <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <X className="text-red-500" size={32} />
                  </div>
                  <h2 className="text-3xl font-extrabold text-slate-800 mb-4">No Chapters Available</h2>
                  <p className="text-slate-500 mb-8">The AI generation failed to produce any podcast chapters. Please try generating it again.</p>
              </div>
          </div>
      );
  }

  if (podcastComplete) {
      return (
          <div className="bg-white rounded-3xl p-12 shadow-sm border border-slate-200 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-50 via-white to-white pointer-events-none"></div>
              <div className="relative z-10 max-w-lg mx-auto">
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Sparkles className="text-emerald-500" size={32} />
                  </div>
                  <h2 className="text-3xl font-extrabold text-slate-800 mb-4">🎉 Great Job {podcast.settings?.studentName || 'Student'}!</h2>
                  <p className="text-slate-500 mb-8">Session Complete.</p>
                  
                  <div className="bg-slate-50 rounded-2xl p-6 mb-8 text-left border border-slate-100">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Topics Mastered</h4>
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full flex items-center gap-1">
                           <Clock size={12} /> {formatTime(duration)} Study Time
                        </span>
                      </div>
                      <ul className="space-y-2">
                          {podcast.chapters.map((c, i) => (
                              <li key={i} className="flex items-center gap-2 text-slate-600 font-medium">
                                  <CheckCircle2 size={16} className="text-emerald-500" /> {c.title}
                              </li>
                          ))}
                      </ul>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
                      <div className="p-4 rounded-xl border border-slate-200 flex flex-col items-center gap-2 hover:bg-slate-50 cursor-pointer">
                          <FileText size={24} className="text-emerald-600" />
                          <span className="text-sm font-bold text-slate-700">Summary Ready</span>
                      </div>
                      <div className="p-4 rounded-xl border border-slate-200 flex flex-col items-center gap-2 hover:bg-slate-50 cursor-pointer">
                          <BrainCircuit size={24} className="text-emerald-600" />
                          <span className="text-sm font-bold text-slate-700">Flashcards Ready</span>
                      </div>
                      <div className="p-4 rounded-xl border border-slate-200 flex flex-col items-center gap-2 hover:bg-slate-50 cursor-pointer">
                          <LayoutPanelLeft size={24} className="text-emerald-600" />
                          <span className="text-sm font-bold text-slate-700">Quiz Ready</span>
                      </div>
                  </div>

                  <button 
                      onClick={async () => {
                          setPodcastComplete(false);
                          setCurrentChapter(0);
                          setProgress(0);
                          if (audioRef.current) {
                              audioRef.current.currentTime = 0;
                              try {
                                  await audioRef.current.play();
                              } catch(e) {
                                  console.error("Replay failed:", e);
                              }
                          }
                      }}
                      className="text-emerald-600 font-bold hover:text-emerald-700 flex items-center justify-center w-full gap-2"
                  >
                      Listen Again <ChevronRight size={18} />
                  </button>
              </div>
          </div>
      );
  }

  let resolvedStudentName = podcast.settings?.studentName || podcast.studentName || 'Student';
  if (resolvedStudentName === 'Student' && localStorage.getItem('preferredStudyName')) {
      resolvedStudentName = localStorage.getItem('preferredStudyName');
  }
  const resolvedTeacherVoice = podcast.settings?.teacherVoice || podcast.settings?.voice || 'Sarah';

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 relative w-full pb-12">
      <audio 
        ref={audioRef} 
        onTimeUpdate={handleTimeUpdate} 
        onEnded={handleEnded} 
        onLoadedMetadata={handleTimeUpdate}
        onPlay={() => setPlayerState('playing')}
        onPause={() => {
            if (playerState === 'playing') setPlayerState('paused');
        }}
        onCanPlay={() => {
            if (playerState === 'loading') {
                 setPlayerState(playIntentRef.current ? 'playing' : 'paused');
                 if (playIntentRef.current && !showSmartPause) {
                     audioRef.current?.play().catch(e => {
                         if (e.name !== 'AbortError') console.error("Auto-play failed:", e);
                     });
                 }
            }
        }}
        onWaiting={() => setPlayerState('loading')}
        onError={(e) => {
            console.error("Audio tag error:", e);
            setPlayerState('failed');
            setAudioErrorText("Playback failed");
        }}
        className="hidden" 
      />
        
      {/* Welcome Dashboard Overlay */}
      {!hasStarted && (
        <div className="bg-slate-50 rounded-3xl border border-slate-200 overflow-hidden w-full max-w-[900px] mx-auto py-12 px-8 md:px-12 flex flex-col shadow-sm">
            <div className="relative z-10 flex flex-col">
                <div className="mb-6">
                    <h1 className="text-sm font-bold text-emerald-600 tracking-widest uppercase mb-4 flex items-center gap-2">
                        <Mic size={16} /> AI Study Session
                    </h1>
                    
                    <h2 className="text-4xl md:text-5xl font-extrabold text-slate-800 leading-tight">
                        {resolvedStudentName === 'Student' ? 'Welcome! 👋' : `Hi ${resolvedStudentName} 👋`}
                    </h2>
                </div>
                
                <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm flex flex-col md:flex-row gap-6 mb-8">
                    <div className="flex-1 space-y-6">
                        <div>
                            <p className="text-sm text-slate-400 font-semibold mb-1 uppercase tracking-wider">Today's Topic</p>
                            <p className="text-2xl font-bold text-slate-800">{podcast.settings?.documentTitle || 'Study Material'}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <p className="text-sm text-slate-400 font-semibold mb-1 uppercase tracking-wider">Time</p>
                                <p className="font-bold text-slate-700 flex items-center gap-2"><Clock size={16} className="text-emerald-500"/> {podcast.settings?.length || '10 min'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-400 font-semibold mb-1 uppercase tracking-wider">Difficulty</p>
                                <p className="font-bold text-amber-600">{podcast.difficulty || 'Intermediate'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-400 font-semibold mb-1 uppercase tracking-wider">Teacher</p>
                                <p className="font-bold text-slate-700 flex items-center gap-2">👩‍🏫 {resolvedTeacherVoice}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-400 font-semibold mb-1 uppercase tracking-wider">Study Mood</p>
                                <p className="font-bold text-slate-700">{podcast.settings?.studyMood || 'Normal Study'}</p>
                            </div>
                        </div>
                    </div>
                    
                    {podcast.goals && podcast.goals.length > 0 && (
                        <div className="flex-1 border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0 md:pl-6">
                            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <Sparkles size={20} className="text-emerald-500" /> Today's Goals
                            </h3>
                            <ul className="space-y-4">
                                {podcast.goals.map((goal, i) => (
                                    <li key={i} className="flex items-start gap-3 text-slate-600 font-medium text-lg">
                                        <div className="mt-1 w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                                            <CheckCircle2 size={14} className="text-emerald-600" />
                                        </div>
                                        {goal}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
                
                <div className="flex justify-center">
                    <button 
                        onClick={() => {
                            setHasStarted(true);
                            if (playerState !== 'playing') togglePlay();
                        }}
                        className="w-[320px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-2xl shadow-xl transition-all text-xl flex items-center justify-center gap-3 hover:scale-[1.02] shadow-emerald-500/20"
                    >
                        🚀 Start Learning
                    </button>
                </div>
            </div>
        </div>
      )}

      {hasStarted && (
        <>
            {/* Smart Pause Overlay */}
            {showSmartPause && (
                <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-sm rounded-3xl flex items-center justify-center p-8 animate-in fade-in zoom-in-95 border border-emerald-100 shadow-2xl">
                    <div className="max-w-md w-full text-center">
                        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <BrainCircuit size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Smart Learning Pause</h3>
                        <p className="text-slate-500 mb-6 text-sm">Take 15 seconds to reflect on what you just heard.</p>
                        
                        <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl mb-8">
                            <p className="text-lg font-semibold text-emerald-900">
                                {podcast.chapters[currentChapter]?.smartPause}
                            </p>
                        </div>

                        <button 
                            onClick={goToNextChapter}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                        >
                            Continue <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            )}

            {/* Main Container */}
            <div className="flex flex-col gap-6 w-full relative">
                


        {/* Main Player */}
        <div className="bg-slate-900 rounded-[2rem] p-6 md:p-10 shadow-2xl relative overflow-hidden flex flex-col text-white flex-shrink-0 border border-slate-700/50">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-slate-900 to-slate-900 pointer-events-none"></div>

          <div className="relative z-10 flex flex-col h-full">
              {/* New Generation Status Card */}
              {isGenerating && hasStarted && (
                  <div className="bg-slate-800 border border-emerald-500/30 rounded-xl p-6 shadow-xl mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
                      <div className="flex justify-between items-start mb-4">
                          <div>
                              <h3 className="text-emerald-400 font-bold text-sm flex items-center gap-2 mb-1">
                                  🎙️ Creating your AI Study Session
                              </h3>
                              <p className="text-white font-extrabold text-xl">
                                  {resolvedTeacherVoice} & {resolvedStudentName}
                              </p>
                          </div>
                          <div className="text-right">
                              <div className="text-slate-300 font-bold text-sm">
                                  {readyCount} / {totalChapters} Chapters Ready
                              </div>
                          </div>
                      </div>
                      
                      <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden mb-4">
                          <div className="bg-emerald-500 h-full rounded-full transition-all duration-500 animate-pulse" style={{ width: `${Math.round((readyCount / totalChapters) * 100)}%` }}></div>
                      </div>
                      
                      <div className="flex flex-col gap-3">
                          <div className="text-slate-300 text-sm font-medium flex justify-between">
                              <span>Generating Chapter {generatingChapterIndex !== -1 ? generatingChapterIndex + 1 : currentChapter + 1}...</span>
                              <span className="text-slate-400">{generatingBlocks} dialogue blocks processed</span>
                          </div>
                          
                          <div className="flex gap-2 flex-wrap">
                              {podcast.audioStatus?.map((status, idx) => {
                                  let icon = '⏳';
                                  let bgClass = 'bg-slate-700/50 text-slate-400';
                                  if (status === 'ready') { icon = '✓'; bgClass = 'bg-emerald-500/20 text-emerald-400'; }
                                  else if (status === 'generating') { icon = '🔄'; bgClass = 'bg-blue-500/20 text-blue-400 animate-pulse border border-blue-500/30'; }
                                  else if (status === 'failed') { icon = '❌'; bgClass = 'bg-red-500/20 text-red-400'; }
                                  
                                  return (
                                      <span key={idx} className={`px-2.5 py-1 rounded-lg text-xs font-bold ${bgClass}`}>
                                          {icon} {idx + 1}
                                      </span>
                                  );
                              })}
                          </div>
                          {currentStatus === 'failed' && (
                              <button onClick={handleRetryChapter} disabled={isRetrying} className="self-start mt-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 px-4 py-2 rounded-lg text-sm font-bold transition-colors border border-red-500/30">
                                  {isRetrying ? 'Retrying...' : 'Retry Failed Chapter'}
                              </button>
                          )}
                      </div>
                  </div>
              )}

              {/* Background Generation Badge */}
              {!isGenerating && anyGenerating && hasStarted && (
                  <div className="absolute -top-4 -right-4 md:top-0 md:right-0 bg-slate-800/90 backdrop-blur border border-slate-700 rounded-xl px-4 py-2 shadow-xl animate-in fade-in zoom-in-95 duration-500 z-20 flex items-center gap-3">
                      <span className="text-emerald-400 animate-pulse text-base">🎙️</span>
                      <div className="flex flex-col">
                          <span className="text-slate-300 text-[10px] font-bold uppercase tracking-wider">Background generation</span>
                          <span className="text-white text-xs font-bold">{readyCount} / {totalChapters} ready</span>
                      </div>
                  </div>
              )}

              <div className={`transition-opacity duration-500 flex-1 flex flex-col relative ${isGenerating && hasStarted ? 'opacity-75 pointer-events-none' : ''}`}>
                  {isGenerating && hasStarted && (
                      <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-auto">
                          <div className="bg-slate-800 text-slate-200 px-5 py-2.5 rounded-full text-sm font-bold shadow-2xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-2 duration-300">
                              <Lock size={16} className="text-emerald-400" /> 🎙️ Preparing audio...
                          </div>
                      </div>
                  )}

              {/* Header section with Top Info */}
              <div className="flex justify-between items-start mb-6 gap-6 flex-col md:flex-row">
                  {/* Left: Chapter Info */}
                  <div className="flex-1 w-full">
                      <div className="text-emerald-400 text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                          <Clock size={14} /> Chapter {currentChapter + 1} of {podcast.chapters.length}
                      </div>
                      
                      {/* Title + AI Explain Button */}
                      <div className="flex items-center gap-4 mb-4">
                          <h2 className="text-2xl md:text-3xl font-extrabold line-clamp-2 leading-tight">
                              {podcast.chapters[currentChapter]?.title || 'Loading Chapter...'}
                          </h2>
                          <button 
                              onClick={() => setShowExplainBox(!showExplainBox)}
                              className="text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shrink-0 border border-slate-600/50 hidden sm:flex"
                          >
                              <MessageSquare size={14} /> AI Explain
                          </button>
                      </div>
                      
                      {/* Avatars */}
                      <div className="flex items-center gap-4">
                          <div className="flex -space-x-2">
                              <div className="w-10 h-10 rounded-full border-2 border-slate-900 bg-emerald-100 flex items-center justify-center text-emerald-700 text-lg shadow-sm z-10" title={resolvedTeacherVoice}>
                                  👩‍🏫
                              </div>
                          </div>
                          <div className="flex flex-col">
                              <span className="text-sm font-bold text-slate-200">{resolvedTeacherVoice}</span>
                              <span className="text-xs text-slate-400 font-medium">Teaching {resolvedStudentName}</span>
                          </div>
                      </div>
                  </div>


              </div>

              {/* Animated Waveform moved up and styled better */}
              <div className={`flex-1 flex items-center justify-center my-8 transition-all duration-700 ${playerState === 'loading' ? 'opacity-30 blur-[2px]' : 'opacity-100'}`}>
                  <div className="flex items-end justify-center gap-[3px] h-20 w-full max-w-3xl px-4">
                      {waveformHeights.map((h, i) => (
                          <div 
                              key={i} 
                              className={`w-2.5 bg-emerald-400 rounded-full transition-all duration-[200ms] shadow-[0_0_10px_rgba(52,211,153,0.3)]`}
                              style={{ height: `${Math.max(6, h * 1.5)}px` }} 
                          />
                      ))}
                  </div>
              </div>

              {/* Progress */}
              <div className="mb-8 px-2">
                  <input
                      type="range"
                      min={0}
                      max={duration || 100}
                      value={progress}
                      onChange={handleSeek}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <div className="flex justify-between text-xs text-slate-400 mt-3 font-medium font-mono">
                      <span>{duration > 0 ? formatTime(progress) : '--:--'}</span>
                      <span>{duration > 0 ? `-${formatTime(Math.max(0, duration - progress))}` : '--:--'}</span>
                  </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-4 w-24">
                      {/* Speed Control */}
                      <div className="relative">
                          <button 
                              onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                              className="text-slate-400 hover:text-white text-sm font-bold transition-colors px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700"
                          >
                              {playbackSpeed}x
                          </button>
                          {showSpeedMenu && (
                              <div className="absolute bottom-full left-0 mb-3 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-20 min-w-[100px]">
                                  {[0.75, 1, 1.25, 1.5, 2].map(speed => (
                                      <button 
                                          key={speed}
                                          onClick={() => { setPlaybackSpeed(speed); setShowSpeedMenu(false); }}
                                          className={`block w-full text-left px-4 py-2.5 text-sm font-bold transition-colors ${playbackSpeed === speed ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-300 hover:bg-slate-700'}`}
                                      >
                                          {speed}x
                                      </button>
                                  ))}
                              </div>
                          )}
                      </div>
                      {/* Mobile AI Explain Box */}
                      <button 
                          onClick={() => setShowExplainBox(!showExplainBox)}
                          className="text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 p-2 rounded-lg transition-colors border border-slate-600/50 flex sm:hidden"
                      >
                          <MessageSquare size={16} />
                      </button>
                  </div>

                  <div className="flex items-center gap-6 md:gap-8">
                      <button onClick={skipBack} className="text-slate-400 hover:text-white transition-all hover:scale-110 active:scale-95">
                          <SkipBack size={28} />
                      </button>
                      
                      <button 
                          onClick={togglePlay} 
                          disabled={playerState !== 'playing' && playerState !== 'paused'}
                          className={`w-20 h-20 rounded-full flex items-center justify-center text-white transition-all shadow-[0_0_30px_rgba(16,185,129,0.3)] ${
                              (playerState !== 'playing' && playerState !== 'paused')
                              ? 'bg-slate-800 border border-slate-700 text-slate-500 cursor-not-allowed' 
                              : 'bg-emerald-500 hover:bg-emerald-400 hover:scale-105 active:scale-95'
                          }`}
                      >
                          {playerState === 'playing' ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1.5" />}
                      </button>
                      
                      <button onClick={skipForward} className="text-slate-400 hover:text-white transition-all hover:scale-110 active:scale-95">
                          <SkipForward size={28} />
                      </button>
                  </div>

                  <div className="flex items-center justify-end gap-4 w-24">
                      <button 
                        onClick={() => setShowNoteForm(!showNoteForm)}
                        className={`text-slate-400 hover:text-emerald-400 transition-all hover:scale-110 active:scale-95 ${showNoteForm ? 'text-emerald-400' : ''}`}
                        title="Add Bookmark"
                      >
                          <BookmarkPlus size={24} />
                      </button>
                  </div>
              </div>
          </div>
        </div>
      </div>

        {/* AI Explain Box */}
        {showExplainBox && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 shadow-sm animate-in fade-in slide-in-from-top-2">
                <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-bold text-emerald-900 flex items-center gap-2">
                        <MessageSquare size={16} /> Explain Concept Again
                    </h4>
                    <button onClick={() => setShowExplainBox(false)} className="text-emerald-600 hover:text-emerald-800"><X size={16}/></button>
                </div>
                <div className="flex gap-2 mb-3">
                    <input 
                        type="text" 
                        value={explainText}
                        onChange={(e) => setExplainText(e.target.value)}
                        placeholder="e.g. Simplify Inheritance"
                        className="flex-1 text-sm p-2.5 rounded-lg border border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                    <button 
                        onClick={handleExplain}
                        disabled={explainLoading}
                        className="bg-emerald-600 text-white px-4 rounded-lg text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50"
                    >
                        Ask
                    </button>
                </div>
                {explainLoading && <div className="text-sm text-emerald-600 font-medium">Analyzing concept...</div>}
                {explainResponse && !explainLoading && (
                    <div className="bg-white p-3 rounded-lg border border-emerald-100 text-sm text-slate-700 mt-2">
                        {explainResponse}
                    </div>
                )}
            </div>
        )}

        {/* Note Form */}
        {showNoteForm && (
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm animate-in fade-in slide-in-from-top-2">
                <h4 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
                    <BookmarkPlus size={16} className="text-emerald-500" />
                    Bookmark at {formatTime(progress)}
                </h4>
                <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Add an optional note..."
                    className="w-full text-sm p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none outline-none"
                    rows={2}
                />
                <div className="flex justify-end gap-2 mt-2">
                    <button 
                        onClick={() => setShowNoteForm(false)}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={saveBookmark}
                        className="px-4 py-1.5 text-xs font-bold bg-emerald-100 text-emerald-700 rounded-md hover:bg-emerald-200 transition-colors"
                    >
                        Save
                    </button>
                </div>
            </div>
        )}

        {/* Live Captions (Floating Glass Card) */}
        {podcast.settings?.liveCaptions && (
            <div className="w-full flex flex-col items-center justify-center py-8 min-h-[220px]">
                {segmentTimings[activeSegmentIndex] && (
                    <div 
                        key={activeSegmentIndex} // Remount on change triggers slide up animation
                        className="w-full max-w-[85%] sm:max-w-[70%] text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300 select-none bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl"
                    >
                        {/* Speaker & speaking equalizer status */}
                        <div className="flex items-center justify-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                                {segmentTimings[activeSegmentIndex].speaker.includes('👩') || segmentTimings[activeSegmentIndex].speaker.includes('Sarah') || segmentTimings[activeSegmentIndex].speaker.includes('Alex') || segmentTimings[activeSegmentIndex].speaker.includes('Mentor') || segmentTimings[activeSegmentIndex].speaker.includes('Coach')
                                    ? `👩 ${resolvedTeacherVoice}`
                                    : `👤 ${resolvedStudentName}`
                                }
                            </span>
                            {playerState === 'playing' && (
                                <div className="flex items-center gap-0.5 h-3">
                                    <span className="w-0.5 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.1s]"></span>
                                    <span className="w-0.5 h-3 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.25s]"></span>
                                    <span className="w-0.5 h-2.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                                </div>
                            )}
                        </div>

                        {/* Caption Text progressive reveal */}
                        {renderProgressiveWords(segmentTimings[activeSegmentIndex], activeSegmentIndex, progress)}
                    </div>
                )}
            </div>
        )}
      </div>

      {/* Bottom Stack: Chapters & Study Dashboard */}
      <div className="w-full flex flex-col gap-8">
          
          {/* Chapter Status Chips */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                  <List size={18} className="text-slate-500" /> Chapters
              </h3>
              <div className="flex flex-wrap gap-3">
                  {podcast.chapters.map((chapter, index) => {
                      const status = podcast.audioStatus ? podcast.audioStatus[index] : 'ready';
                      let icon;
                      let statusClass;
                      
                      if (status === 'ready') {
                          icon = '✓';
                          statusClass = currentChapter === index 
                              ? 'bg-emerald-600 text-white border-emerald-700 shadow-md ring-2 ring-emerald-500/20' 
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300';
                      } else if (status === 'generating') {
                          icon = '🔄';
                          statusClass = 'bg-blue-50 text-blue-700 border-blue-200 cursor-not-allowed';
                      } else if (status === 'queued') {
                          icon = '⏳';
                          statusClass = 'bg-slate-50 text-slate-500 border-slate-200 cursor-not-allowed';
                      } else {
                          icon = '❌';
                          statusClass = 'bg-red-50 text-red-600 border-red-200 cursor-not-allowed';
                      }

                      return (
                          <button
                              key={index}
                              disabled={status !== 'ready'}
                              onClick={() => {
                                  setCurrentChapter(index);
                                  setProgress(0);
                                  setShowSmartPause(false);
                                  if (playerState !== 'playing') togglePlay();
                              }}
                              className={`group relative flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border transition-all font-bold text-sm ${statusClass} ${status === 'generating' ? 'animate-pulse' : ''}`}
                          >
                              <span className={status === 'generating' ? 'animate-spin' : ''}>{icon}</span>
                              <span>{index + 1}</span>
                              
                              {/* Tooltip */}
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[200px] sm:max-w-xs opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all duration-200 z-10 pointer-events-none">
                                  <div className="bg-slate-800 text-white text-xs font-bold py-2 px-3 rounded-xl shadow-xl relative whitespace-normal text-center">
                                      {chapter.title}
                                      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-800"></div>
                                  </div>
                              </div>
                          </button>
                      );
                  })}
              </div>
          </div>

          {/* Better Study Dashboard */}
          <div className="flex flex-col gap-4 w-full">
              {/* Full Transcript Collapsible Panel */}
              <details className="group bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden select-none">
                  <summary className="font-bold text-slate-700 flex items-center gap-3 p-5 cursor-pointer hover:bg-slate-50 transition-colors list-none">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">📜</div>
                      Full Transcript
                      <span className="text-xs font-semibold text-slate-400 ml-2">(Click to expand)</span>
                      <ChevronRight size={18} className="ml-auto text-slate-400 group-open:rotate-90 transition-transform" />
                  </summary>
                  <div className="p-6 pt-0 border-t border-slate-100 max-h-[400px] overflow-y-auto custom-scrollbar space-y-4">
                      {segmentTimings.map((seg, idx) => {
                          const isTeacher = seg.speaker.includes('👩') || seg.speaker.includes('Sarah') || seg.speaker.includes('Alex') || seg.speaker.includes('Mentor') || seg.speaker.includes('Coach');
                          const displaySpeaker = isTeacher ? `👩 ${resolvedTeacherVoice}` : `👤 ${resolvedStudentName}`;
                          const isCurrent = idx === activeSegmentIndex;

                          return (
                              <div 
                                  key={idx}
                                  onClick={() => {
                                      if (audioRef.current) {
                                          audioRef.current.currentTime = seg.start;
                                          setProgress(seg.start);
                                      }
                                  }}
                                  className={`p-3 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col gap-1 text-left ${
                                      isCurrent
                                          ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold shadow-xs'
                                          : 'bg-slate-50/50 border-slate-100 hover:bg-slate-50 hover:border-slate-200 text-slate-700'
                                  }`}
                              >
                                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                      {displaySpeaker}
                                  </span>
                                  <p className="text-sm font-semibold leading-relaxed">
                                      {seg.text}
                                  </p>
                              </div>
                          );
                      })}
                  </div>
              </details>
              <h3 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2 px-2">
                  <Sparkles size={24} className="text-emerald-500" /> Study Dashboard
              </h3>

              {/* Memory Tricks */}
              {podcast.memoryTricks && podcast.memoryTricks.length > 0 && (
                  <details className="group bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" open>
                      <summary className="font-bold text-emerald-800 flex items-center gap-3 p-4 cursor-pointer hover:bg-emerald-50/50 transition-colors list-none">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">💡</div>
                          Memory Tricks
                          <ChevronRight size={18} className="ml-auto text-slate-400 group-open:rotate-90 transition-transform" />
                      </summary>
                      <div className="p-4 pt-0 border-t border-slate-100 text-slate-700 space-y-2">
                          {podcast.memoryTricks.map((trick, i) => (
                              <div key={i} className="flex gap-3 bg-emerald-50/30 p-3 rounded-xl border border-emerald-100/50">
                                  <span className="text-emerald-600 font-bold">•</span>
                                  <p>{trick}</p>
                              </div>
                          ))}
                      </div>
                  </details>
              )}

              {/* Key Definitions */}
              {podcast.chapters[currentChapter]?.examBooster?.definitions?.length > 0 && (
                  <details className="group bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" open>
                      <summary className="font-bold text-blue-800 flex items-center gap-3 p-4 cursor-pointer hover:bg-blue-50/50 transition-colors list-none">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">📖</div>
                          Key Definitions
                          <ChevronRight size={18} className="ml-auto text-slate-400 group-open:rotate-90 transition-transform" />
                      </summary>
                      <div className="p-4 pt-0 border-t border-slate-100 text-slate-700 space-y-2">
                          {podcast.chapters[currentChapter].examBooster.definitions.map((def, i) => (
                              <div key={i} className="flex gap-3 bg-blue-50/30 p-3 rounded-xl border border-blue-100/50">
                                  <span className="text-blue-600 font-bold">•</span>
                                  <p>{def}</p>
                              </div>
                          ))}
                      </div>
                  </details>
              )}

              {/* Common Mistakes */}
              {podcast.chapters[currentChapter]?.examBooster?.mistakes?.length > 0 && (
                  <details className="group bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                      <summary className="font-bold text-red-800 flex items-center gap-3 p-4 cursor-pointer hover:bg-red-50/50 transition-colors list-none">
                          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-lg">⚠</div>
                          Common Mistakes
                          <ChevronRight size={18} className="ml-auto text-slate-400 group-open:rotate-90 transition-transform" />
                      </summary>
                      <div className="p-4 pt-0 border-t border-slate-100 text-slate-700 space-y-2">
                          {podcast.chapters[currentChapter].examBooster.mistakes.map((mistake, i) => (
                              <div key={i} className="flex gap-3 bg-red-50/30 p-3 rounded-xl border border-red-100/50">
                                  <span className="text-red-600 font-bold">•</span>
                                  <p>{mistake}</p>
                              </div>
                          ))}
                      </div>
                  </details>
              )}

              {/* Interview Questions / FAQs */}
              {podcast.chapters[currentChapter]?.examBooster?.faqs?.length > 0 && (
                  <details className="group bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                      <summary className="font-bold text-purple-800 flex items-center gap-3 p-4 cursor-pointer hover:bg-purple-50/50 transition-colors list-none">
                          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">🎯</div>
                          Interview Questions
                          <ChevronRight size={18} className="ml-auto text-slate-400 group-open:rotate-90 transition-transform" />
                      </summary>
                      <div className="p-4 pt-0 border-t border-slate-100 text-slate-700 space-y-2">
                          {podcast.chapters[currentChapter].examBooster.faqs.map((faq, i) => (
                              <div key={i} className="flex gap-3 bg-purple-50/30 p-3 rounded-xl border border-purple-100/50">
                                  <span className="text-purple-600 font-bold">•</span>
                                  <p>{faq}</p>
                              </div>
                          ))}
                      </div>
                  </details>
              )}

              {/* Revision Notes / Tips */}
              {podcast.chapters[currentChapter]?.examBooster?.tips?.length > 0 && (
                  <details className="group bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                      <summary className="font-bold text-amber-800 flex items-center gap-3 p-4 cursor-pointer hover:bg-amber-50/50 transition-colors list-none">
                          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">📝</div>
                          Revision Notes
                          <ChevronRight size={18} className="ml-auto text-slate-400 group-open:rotate-90 transition-transform" />
                      </summary>
                      <div className="p-4 pt-0 border-t border-slate-100 text-slate-700 space-y-2">
                          {podcast.chapters[currentChapter].examBooster.tips.map((tip, i) => (
                              <div key={i} className="flex gap-3 bg-amber-50/30 p-3 rounded-xl border border-amber-100/50">
                                  <span className="text-amber-600 font-bold">•</span>
                                  <p>{tip}</p>
                              </div>
                          ))}
                      </div>
                  </details>
              )}
          </div>
        </div>
      </>
      )}
    </div>
  );
};

export default PodcastPlayer;
