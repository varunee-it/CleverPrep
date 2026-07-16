import React, { useEffect, useRef } from "react";
import { useTour } from "../../context/TourContext";
import { tourSteps } from "./data/tourSteps";
import { X, ArrowRight, ArrowLeft } from "lucide-react";
import useTooltipPosition from "./hooks/useTooltipPosition";

const FloatingTooltip = () => {
  const {
    isActive,
    currentStepIndex,
    targetRect,
    isTransitioning,
    isTooltipFading,
    showRetryState,
    isFeatureUnavailable,
    isTourCompleting,
    nextStep,
    prevStep,
    exitTour,
    completeTour,
    activeStep,
    retryTransition
  } = useTour();

  const tooltipRef = useRef(null);
  
  // Custom hook for responsive positioning and boundaries calculations
  const coords = useTooltipPosition(isActive, activeStep, targetRect, tooltipRef);

  // Trap focus inside tooltip on tab key presses for full A11y support
  useEffect(() => {
    if (!isActive) return;
    const tooltip = tooltipRef.current;
    if (!tooltip) return;

    const focusableElements = tooltip.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex="0"]'
    );
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    window.addEventListener("keydown", handleTabKey);
    return () => window.removeEventListener("keydown", handleTabKey);
  }, [isActive, currentStepIndex, showRetryState, isFeatureUnavailable]);

  // Keyboard navigation shortcuts
  useEffect(() => {
    if (!isActive || isTransitioning) return;

    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight") {
        nextStep();
      } else if (e.key === "ArrowLeft") {
        prevStep();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isActive, isTransitioning, nextStep, prevStep]);

  if (!isActive || !activeStep) return null;

  const totalSteps = tourSteps.length;
  const progressPercent = ((currentStepIndex + 1) / totalSteps) * 100;

  // Computes active positioning style with transition property bindings
  const getStyle = () => {
    if (coords.placement === "center") {
      return {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        transition: "opacity 200ms ease-out",
        opacity: isTourCompleting ? 0 : 1
      };
    }
    if (coords.placement === "mobile-bottom") {
      return {
        position: "fixed",
        left: "1rem",
        right: "1rem",
        bottom: "1rem",
        width: "auto",
        maxWidth: "none",
        transition: "opacity 200ms ease-out",
        opacity: isTourCompleting ? 0 : 1
      };
    }
    return {
      position: "fixed",
      top: `${coords.top}px`,
      left: `${coords.left}px`,
      transitionTimingFunction: "cubic-bezier(0.25, 1, 0.5, 1)",
      transitionProperty: "top, left, opacity",
      transitionDuration: "260ms",
      opacity: isTourCompleting ? 0 : 1
    };
  };

  const isFinalStep = activeStep.isFinal;
  const buttonsDisabled = isTransitioning || isTourCompleting;

  return (
    <div
      ref={tooltipRef}
      style={getStyle()}
      className={`z-[95] w-80 sm:w-96 max-w-sm rounded-2xl bg-white border border-slate-200/50 shadow-2xl p-6 select-none transition-all duration-[260ms] ease-[cubic-bezier(0.25,1,0.5,1)] min-h-[190px] flex flex-col justify-between ${
        isFinalStep ? "border-emerald-200 bg-white" : ""
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-title"
      aria-describedby="tour-desc"
    >
      {showRetryState ? (
        /* Retry Timeout boundary state */
        <div className="space-y-4 animate-in fade-in duration-200 flex-1 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-4 mb-3">
            <h4
              id="tour-title"
              className="text-base font-extrabold text-slate-900 leading-snug font-display"
            >
              Preparing Workspace...
            </h4>
            <button
              onClick={exitTour}
              className="p-1 -mr-2 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
              title="Exit Tour"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <p className="text-xs leading-relaxed text-slate-600 mb-6 font-medium">
            We're still preparing your study workspace. If it is taking longer than expected, you can retry loading or exit the tour.
          </p>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={exitTour}
              className="px-4 py-2 border border-slate-200 text-slate-550 hover:text-slate-800 hover:bg-slate-50 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Exit Tour
            </button>
            <button
              onClick={retryTransition}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-lg shadow-slate-900/10 transition-all cursor-pointer"
            >
              Retry
            </button>
          </div>
        </div>
      ) : (
        /* Standard Onboarding Step card with silent transition cross-fades */
        <div 
          className="transition-opacity duration-[150ms] ease-[cubic-bezier(0.25,1,0.5,1)] flex-1 flex flex-col justify-between"
          style={{ opacity: isTooltipFading || isTourCompleting ? 0 : 1 }}
        >
          <div>
            {/* Step Header */}
            <div className="flex items-start justify-between gap-4 mb-3">
              <h4
                id="tour-title"
                className="text-base font-extrabold text-slate-900 leading-snug font-display flex items-center gap-1.5"
              >
                {activeStep.title}
              </h4>
              <button
                onClick={exitTour}
                disabled={buttonsDisabled}
                className="p-1 -mr-2 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-all cursor-pointer disabled:pointer-events-none"
                title="Exit Tour"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Step Content */}
            <div id="tour-desc" className="text-xs leading-relaxed text-slate-600 mb-6 font-medium">
              {isFeatureUnavailable ? (
                <div className="space-y-4">
                  <p className="font-semibold text-slate-700">
                    Preparing Workspace...
                  </p>
                  <div className="py-2.5 px-3 bg-amber-50 rounded-xl border border-amber-200/60 text-amber-900 font-bold text-[11px] leading-relaxed flex items-start gap-2 animate-in fade-in duration-200">
                    <span className="shrink-0 text-base leading-none">⚠️</span>
                    <span>This feature is still preparing. We'll continue and you can explore it later.</span>
                  </div>
                </div>
              ) : isFinalStep ? (
                <div className="space-y-4">
                  <p className="font-semibold text-slate-700">
                    You now know how to get the most out of CleverPrep:
                  </p>
                  <div className="space-y-2 py-2 px-3 bg-emerald-50/50 rounded-xl border border-emerald-100/50">
                    <div className="flex items-center gap-2.5 text-[11px] font-bold text-emerald-800">
                      <span className="shrink-0 w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-[10px]">✓</span>
                      <span>Upload study material</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-[11px] font-bold text-emerald-800">
                      <span className="shrink-0 w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-[10px]">✓</span>
                      <span>Generate AI Notes</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-[11px] font-bold text-emerald-800">
                      <span className="shrink-0 w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-[10px]">✓</span>
                      <span>Practice Quizzes</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-[11px] font-bold text-emerald-800">
                      <span className="shrink-0 w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-[10px]">✓</span>
                      <span>Study Flashcards</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-[11px] font-bold text-emerald-800">
                      <span className="shrink-0 w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-[10px]">✓</span>
                      <span>Listen to AI Podcasts</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p>{activeStep.content}</p>
              )}
            </div>
          </div>

          {/* Progress & Navigation Bar */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-4 gap-4">
            {!isFinalStep ? (
              <div className="flex flex-col gap-1 flex-1">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  Step {currentStepIndex + 1} of {totalSteps}
                </span>
                {/* Linear Progress bar with continuous slide animation */}
                <div className="w-20 h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-[350ms] ease-out"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex-1" />
            )}

            {/* Buttons Action Group */}
            <div className="flex items-center gap-2 shrink-0">
              {!isFinalStep && (
                <button
                  onClick={exitTour}
                  disabled={buttonsDisabled}
                  className="px-3 py-1.5 text-[11px] font-bold text-slate-450 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer disabled:pointer-events-none"
                >
                  Skip
                </button>
              )}

              {currentStepIndex > 0 && !isFinalStep && (
                <button
                  onClick={prevStep}
                  disabled={buttonsDisabled}
                  className="inline-flex items-center justify-center p-2 text-slate-500 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all cursor-pointer border border-slate-200/50 disabled:pointer-events-none"
                  title="Previous Step"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
              )}

              {isFinalStep ? (
                <button
                  onClick={completeTour}
                  disabled={buttonsDisabled}
                  className="h-9 px-5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-extrabold rounded-xl shadow-lg shadow-emerald-550/20 transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer disabled:pointer-events-none"
                >
                  Start Learning
                </button>
              ) : (
                <button
                  onClick={nextStep}
                  disabled={buttonsDisabled}
                  className="inline-flex items-center justify-center gap-1.5 h-9 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer disabled:pointer-events-none"
                >
                  <span>Next</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FloatingTooltip;
