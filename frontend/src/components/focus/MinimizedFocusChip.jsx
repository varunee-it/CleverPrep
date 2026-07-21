import React from "react";
import { useNavigate } from "react-router-dom";
import useStudySession from "../../hooks/useStudySession";
import useStudyTimer from "../../hooks/useStudyTimer";
import useAmbientSound from "../../hooks/useAmbientSound";
import { STATUS_RUNNING, STATUS_PAUSED } from "../../constants/StudySessionConstants";
import { Play, Pause, Square, Music, Volume2, VolumeX } from "lucide-react";

export const MinimizedFocusChip = () => {
  const navigate = useNavigate();
  const {
    session,
    cancelSession,
    pauseSession,
    resumeSession,
    canPause,
    canResume,
    canCancel
  } = useStudySession();
  
  const { formattedTime } = useStudyTimer();
  const { currentSoundId, isMuted, volume, setVolume, toggleMute, ambientSounds } = useAmbientSound();

  const isSessionActive = session && [STATUS_RUNNING, STATUS_PAUSED].includes(session.status);
  
  // Hide if no session is active
  if (!isSessionActive) return null;

  const currentSoundObj = currentSoundId ? ambientSounds.find(s => s.id === currentSoundId) : null;
  const soundName = currentSoundObj ? currentSoundObj.title : "Silence Off";
  const isRunning = session.status === STATUS_RUNNING;

  const handlePause = (e) => {
    e.stopPropagation();
    if (canPause()) pauseSession();
  };

  const handleResume = (e) => {
    e.stopPropagation();
    if (canResume()) resumeSession();
  };

  const handleCancel = (e) => {
    e.stopPropagation();
    if (canCancel()) cancelSession();
  };

  return (
    <div 
      onClick={() => navigate("/focus")}
      className="fixed z-[250] bg-slate-950/90 border border-slate-800 text-white px-3 py-2 shadow-2xl flex items-center justify-between gap-3 animate-in slide-in-from-bottom-5 duration-300 backdrop-blur-md hover:border-slate-700/80 transition-all cursor-pointer select-none
        bottom-0 left-0 right-0 w-full rounded-none border-t border-b-0 border-l-0 border-r-0
        md:bottom-6 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-[250px] md:rounded-2xl md:border
        lg:left-auto lg:right-6 lg:translate-x-0 lg:w-[270px]"
    >
      {/* Time & Environment info */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-sm animate-pulse shrink-0">🎯</span>
        <div className="flex flex-col text-left min-w-0">
          <span className="text-[8px] font-black uppercase tracking-widest text-[#10D28F] leading-none">Focus Session</span>
          <span className="text-[11px] font-mono font-bold text-slate-350 mt-0.5 tabular-nums">{formattedTime}</span>
          <span className="text-[8px] font-bold text-slate-500 truncate max-w-[90px] flex items-center gap-1 mt-0.5">
            <Music className="w-2 h-2 text-slate-650 shrink-0" />
            <span>{soundName}</span>
          </span>
        </div>
      </div>

      {/* Action controls & Volume hover expansion bar */}
      <div className="flex items-center gap-1.5 pl-1.5 border-l border-slate-900 shrink-0">
        {/* Compact Spotify hover volume slider */}
        {currentSoundId && (
          <div 
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 bg-slate-900/40 border border-slate-900 px-1.5 py-0.5 rounded-lg group/vol transition-all hover:bg-slate-900/80"
          >
            <button
              onClick={toggleMute}
              className="text-slate-450 hover:text-white transition-colors"
            >
              {isMuted ? <VolumeX className="w-3 h-3 text-rose-500" /> : <Volume2 className="w-3 h-3" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-0 group-hover/vol:w-10 transition-all duration-300 accent-[#10D28F] bg-slate-800 rounded-lg appearance-none cursor-pointer h-0.5 -translate-y-px outline-none"
              aria-label="Volume slider"
            />
          </div>
        )}

        {isRunning ? (
          <button
            onClick={handlePause}
            className="p-1 bg-slate-900/60 hover:bg-slate-850 text-slate-400 hover:text-white rounded-lg cursor-pointer transition-colors"
            title="Pause timer"
          >
            <Pause className="w-3 h-3 fill-current" />
          </button>
        ) : (
          <button
            onClick={handleResume}
            className="p-1 bg-slate-900/60 hover:bg-slate-850 text-[#10D28F] hover:text-[#19E39C] rounded-lg cursor-pointer transition-colors"
            title="Resume timer"
          >
            <Play className="w-3 h-3 fill-current" />
          </button>
        )}
        
        <button
          onClick={handleCancel}
          className="p-1 bg-rose-950/10 hover:bg-rose-950/20 text-rose-450 hover:text-rose-400 rounded-lg cursor-pointer transition-colors border border-rose-950/25"
          title="Cancel timer"
        >
          <Square className="w-3 h-3 fill-current" />
        </button>
      </div>
    </div>
  );
};

export default MinimizedFocusChip;
