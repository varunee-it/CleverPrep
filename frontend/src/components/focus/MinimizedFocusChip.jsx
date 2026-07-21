import React, { useState, useEffect, useRef } from "react";
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
  
  // Floating position persistence
  const [position, setPosition] = useState(() => {
    const saved = localStorage.getItem("cleverprep_miniplayer_position");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [isDragging, setIsDragging] = useState(false);
  const [hasMoved, setHasMoved] = useState(false);

  // Initialize default position dynamically inside viewport
  useEffect(() => {
    if (!position) {
      const x = window.innerWidth - 270 - 24; // 24px right gutter
      const y = window.innerHeight - 68 - 24; // 24px bottom gutter
      setPosition({ x, y });
    }
  }, [position]);

  // Persist position shifts
  useEffect(() => {
    if (position) {
      localStorage.setItem("cleverprep_miniplayer_position", JSON.stringify(position));
    }
  }, [position]);

  // Constrain position boundaries on window resize
  useEffect(() => {
    const handleResize = () => {
      if (position) {
        const x = Math.max(16, Math.min(position.x, window.innerWidth - 270 - 16));
        const y = Math.max(16, Math.min(position.y, window.innerHeight - 68 - 16));
        if (x !== position.x || y !== position.y) {
          setPosition({ x, y });
        }
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [position]);

  // Mouse Drag Handlers
  const handleMouseDown = (e) => {
    // Prevent dragging if interactive children are clicked
    if (
      e.target.closest("button") || 
      e.target.closest("input") || 
      e.target.closest("a")
    ) {
      return;
    }
    e.preventDefault();
    
    const startX = e.clientX;
    const startY = e.clientY;
    const initialX = position?.x || (window.innerWidth - 270 - 24);
    const initialY = position?.y || (window.innerHeight - 68 - 24);

    setIsDragging(true);
    setHasMoved(false);

    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      
      if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
        setHasMoved(true);
      }

      const newX = Math.max(16, Math.min(initialX + deltaX, window.innerWidth - 270 - 16));
      const newY = Math.max(16, Math.min(initialY + deltaY, window.innerHeight - 68 - 16));
      
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  // Touch Drag Handlers for Mobile Devices
  const handleTouchStart = (e) => {
    if (
      e.target.closest("button") || 
      e.target.closest("input") || 
      e.target.closest("a")
    ) {
      return;
    }
    
    const touch = e.touches[0];
    const startX = touch.clientX;
    const startY = touch.clientY;
    const initialX = position?.x || (window.innerWidth - 270 - 24);
    const initialY = position?.y || (window.innerHeight - 68 - 24);

    setIsDragging(true);
    setHasMoved(false);

    const handleTouchMove = (moveEvent) => {
      const touchMove = moveEvent.touches[0];
      const deltaX = touchMove.clientX - startX;
      const deltaY = touchMove.clientY - startY;
      
      if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
        setHasMoved(true);
      }

      const newX = Math.max(16, Math.min(initialX + deltaX, window.innerWidth - 270 - 16));
      const newY = Math.max(16, Math.min(initialY + deltaY, window.innerHeight - 68 - 16));
      
      setPosition({ x: newX, y: newY });
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };

    document.addEventListener("touchmove", handleTouchMove);
    document.addEventListener("touchend", handleTouchEnd);
  };

  // Distinguish clicks from drags
  const handleContainerClick = (e) => {
    if (hasMoved) {
      e.stopPropagation();
      return;
    }
    navigate("/focus");
  };

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
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onClick={handleContainerClick}
      className={`fixed z-[250] bg-bg-surface/90 border border-border text-text-primary px-3.5 py-2 shadow-2xl flex items-center justify-between gap-3 animate-in slide-in-from-bottom-5 duration-300 backdrop-blur-md hover:border-border-hover hover:shadow-theme-md select-none rounded-2xl w-[270px] transition-[border-color,box-shadow,background-color] ${
        isDragging ? "cursor-grabbing" : "cursor-grab"
      }`}
      style={position ? {
        left: `${position.x}px`,
        top: `${position.y}px`,
        bottom: "auto",
        right: "auto",
        transform: "none"
      } : {
        bottom: "24px",
        right: "24px",
        left: "auto",
        top: "auto"
      }}
    >
      {/* Time & Environment info */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-sm animate-pulse shrink-0">🎯</span>
        <div className="flex flex-col text-left min-w-0">
          <span className="text-[8px] font-black uppercase tracking-widest text-primary leading-none">Focus Session</span>
          <span className="text-[11px] font-mono font-bold text-text-primary mt-0.5 tabular-nums">{formattedTime}</span>
          <span className="text-[8px] font-bold text-text-muted truncate max-w-[90px] flex items-center gap-1 mt-0.5">
            <Music className="w-2 h-2 text-text-muted shrink-0" />
            <span>{soundName}</span>
          </span>
        </div>
      </div>

      {/* Action controls & Volume hover expansion bar */}
      <div className="flex items-center gap-1.5 pl-1.5 border-l border-border shrink-0">
        {/* Compact Spotify hover volume slider */}
        {currentSoundId && (
          <div 
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 bg-bg-base/40 border border-border px-1.5 py-0.5 rounded-lg group/vol transition-all hover:bg-bg-base/80"
          >
            <button
              onClick={toggleMute}
              className="text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-3 h-3 text-rose-500" /> : <Volume2 className="w-3 h-3 text-text-secondary" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-0 group-hover/vol:w-10 transition-all duration-305 accent-primary bg-bg-base rounded-lg appearance-none cursor-pointer h-0.5 -translate-y-px outline-none"
              aria-label="Volume slider"
            />
          </div>
        )}

        {isRunning ? (
          <button
            onClick={handlePause}
            className="p-1 bg-bg-base/60 hover:bg-bg-surface-hover text-text-secondary hover:text-text-primary rounded-lg cursor-pointer transition-colors"
            title="Pause timer"
          >
            <Pause className="w-3 h-3 fill-current" />
          </button>
        ) : (
          <button
            onClick={handleResume}
            className="p-1 bg-bg-base/60 hover:bg-bg-surface-hover text-primary hover:text-primary-hover rounded-lg cursor-pointer transition-colors"
            title="Resume timer"
          >
            <Play className="w-3 h-3 fill-current" />
          </button>
        )}
        
        <button
          onClick={handleCancel}
          className="p-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-lg cursor-pointer transition-colors border border-rose-500/20"
          title="Cancel timer"
        >
          <Square className="w-3 h-3 fill-current" />
        </button>
      </div>
    </div>
  );
};

export default MinimizedFocusChip;
