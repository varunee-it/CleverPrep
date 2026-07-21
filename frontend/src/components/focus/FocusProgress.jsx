import React from "react";
import { STATUS_RUNNING, STATUS_PAUSED } from "../../constants/StudySessionConstants";

/**
 * Premium presentational circular SVG progress indicator.
 * Displays duration ticks, glow effects, and MM:SS formatted remaining session time.
 * Redesigned to be 20-25% more compact to avoid vertical scrolling.
 */
export const FocusProgress = ({ progressPercent = 0, formattedTime = "00:00", status = "idle" }) => {
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;
  const isRunning = status === STATUS_RUNNING;

  return (
    <div className="relative flex items-center justify-center select-none p-2">
      {/* Immersive background soft glow ring */}
      <div 
        className={`absolute w-[clamp(180px,25vh,290px)] h-[clamp(180px,25vh,290px)] rounded-full bg-emerald-500/5 transition-all duration-1000 ${
          isRunning ? "opacity-100 scale-105 blur-3xl animate-pulse" : "opacity-30 blur-2xl"
        }`} 
      />

      {/* Floating ambient particles */}
      {isRunning && (
        <>
          <div className="absolute w-1 h-1 rounded-full bg-emerald-400/50 blur-[0.5px] top-6 left-12 animate-float-particle-1" />
          <div className="absolute w-0.5 h-0.5 rounded-full bg-teal-400/40 blur-[0.5px] bottom-10 right-6 animate-float-particle-2" />
          <div className="absolute w-1.5 h-1.5 rounded-full bg-emerald-500/30 blur-[1px] top-20 right-16 animate-float-particle-3" />
        </>
      )}
      
      {/* Outer decorative orbit track */}
      <div className="absolute w-[clamp(160px,22vh,230px)] h-[clamp(160px,22vh,230px)] rounded-full border border-slate-800/30 pointer-events-none" />

      {/* Hero Circular Progress Visualizer */}
      <div className={`relative w-[clamp(150px,21vh,220px)] h-[clamp(150px,21vh,220px)] transition-all duration-300 ${isRunning ? "animate-timer-breathe" : ""}`}>
        <svg className="w-full h-full transform -rotate-90 filter drop-shadow-sm" viewBox="0 0 220 220">
          <defs>
            <linearGradient id="timer-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </defs>
          
          {/* Inner track border */}
          <circle
            cx="110"
            cy="110"
            r={radius}
            className="stroke-slate-800/40"
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
          <span className="text-[clamp(1.7rem,5vh,2.5rem)] font-extrabold tracking-tight text-white leading-none font-mono">
            {formattedTime}
          </span>
          <span className="text-[clamp(7px,1vh,8px)] font-black uppercase tracking-widest mt-1 text-slate-400">
            FOCUS MODE
          </span>
          <span className={`text-[clamp(7px,1vh,8px)] font-bold uppercase tracking-wider mt-0.5 transition-colors ${
            isRunning ? "text-[#10D28F] font-black" : "text-slate-500"
          }`}>
            {status === STATUS_PAUSED ? "Paused" : isRunning ? "Running" : "Ready"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default FocusProgress;
