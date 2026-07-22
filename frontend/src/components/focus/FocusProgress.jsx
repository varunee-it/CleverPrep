import React, { useState, useEffect } from "react";
import { STATUS_RUNNING, STATUS_PAUSED } from "../../constants/StudySessionConstants";

/**
 * Premium presentational circular SVG progress indicator.
 * Displays duration ticks, glow effects, and MM:SS formatted remaining session time.
 * Redesigned to be 20-25% more compact to avoid vertical scrolling.
 * Supports dark, light, and beige themes.
 */
export const FocusProgress = ({ progressPercent = 0, formattedTime = "00:00", status = "idle" }) => {
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;
  const isRunning = status === STATUS_RUNNING;

  const [globalTheme, setGlobalTheme] = useState(() => localStorage.getItem("cleverprep_global_theme") || "white");

  useEffect(() => {
    const handleThemeChange = () => {
      setGlobalTheme(localStorage.getItem("cleverprep_global_theme") || "white");
    };
    window.addEventListener("cleverprep-global-theme-changed", handleThemeChange);
    return () => window.removeEventListener("cleverprep-global-theme-changed", handleThemeChange);
  }, []);

  // Theme-specific colors
  const orbitBorderClass = "border-border";
  const trackStrokeClass = "stroke-border/70";
  const timeTextClass = "text-text-primary";
  const labelTextClass = "text-text-muted";

  return (
    <div className="relative flex items-center justify-center select-none p-1">
      {/* Immersive background soft glow ring */}
      <div 
        className={`absolute w-[clamp(130px,18vh,170px)] h-[clamp(130px,18vh,170px)] rounded-full bg-primary/5 transition-all duration-1000 ${
          isRunning ? "opacity-100 scale-105 blur-2xl animate-pulse" : "opacity-30 blur-xl"
        }`} 
      />

      {/* Floating ambient particles */}
      {isRunning && (
        <>
          <div className="absolute w-1 h-1 rounded-full bg-primary/40 blur-[0.5px] top-6 left-12 animate-float-particle-1" />
          <div className="absolute w-0.5 h-0.5 rounded-full bg-accent/30 blur-[0.5px] bottom-10 right-6 animate-float-particle-2" />
          <div className="absolute w-1.5 h-1.5 rounded-full bg-primary/20 blur-[1px] top-20 right-16 animate-float-particle-3" />
        </>
      )}
      
      {/* Outer decorative orbit track */}
      <div className={`absolute w-[clamp(115px,16vh,145px)] h-[clamp(115px,16vh,145px)] rounded-full border pointer-events-none ${orbitBorderClass}`} />

      {/* Hero Circular Progress Visualizer */}
      <div className={`relative w-[clamp(110px,15vh,135px)] h-[clamp(110px,15vh,135px)] transition-all duration-300 ${isRunning ? "animate-timer-breathe" : ""}`}>
        <svg className="w-full h-full transform -rotate-90 filter drop-shadow-xs" viewBox="0 0 220 220">
          <defs>
            <linearGradient id="timer-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--color-primary)" />
              <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.8" />
            </linearGradient>
          </defs>
          
          {/* Inner track border */}
          <circle
            cx="110"
            cy="110"
            r={radius}
            className={trackStrokeClass}
            strokeWidth="6"
            fill="transparent"
          />
          
          {/* Active progress ring */}
          <circle
            cx="110"
            cy="110"
            r={radius}
            className="transition-all duration-300 ease-out"
            stroke="url(#timer-gradient)"
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>

        {/* Central clock typography */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className={`text-[clamp(1.1rem,3vh,1.4rem)] font-extrabold tracking-tight leading-none font-mono ${timeTextClass}`}>
            {formattedTime}
          </span>
          <span className={`text-[clamp(6px,0.8vh,7px)] font-black uppercase tracking-widest mt-0.5 ${labelTextClass}`}>
            STUDY SESSION
          </span>
          <span className={`text-[clamp(6px,0.8vh,7px)] font-bold uppercase tracking-wider mt-0.5 transition-colors ${
            isRunning ? "text-primary font-black" : "text-text-muted"
          }`}>
            {status === STATUS_PAUSED ? "Paused" : isRunning ? "Running" : "Ready"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default FocusProgress;
