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
    isTourCompleting,
    nextStep,
    prevStep,
    exitTour,
    completeTour,
    activeStep,
    previousTooltipPosition,
    setPreviousTooltipPosition
  } = useTour();

  const tooltipRef = useRef(null);
  
  // Custom hook for responsive positioning and boundaries calculations
  const coords = useTooltipPosition(
    isActive, 
    activeStep, 
    targetRect, 
    tooltipRef,
    previousTooltipPosition,
    setPreviousTooltipPosition
  );

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
  }, [isActive, currentStepIndex]);

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

  // Computes active positioning style with GPU-accelerated translate3d transforms
  const getStyle = () => {
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
      top: 0,
      left: 0,
      transform: `translate3d(${coords.left}px, ${coords.top}px, 0)`,
      transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
      transitionProperty: "transform, opacity",
      transitionDuration: "280ms",
      opacity: isTourCompleting ? 0 : 1
    };
  };

  const isFinalStep = activeStep.isFinal;
  const buttonsDisabled = isTransitioning || isTourCompleting;

  return (
    <div
      ref={tooltipRef}
      style={getStyle()}
      className={`z-[95] w-80 sm:w-96 max-w-sm rounded-2xl bg-white border border-slate-200/50 shadow-2xl p-6 select-none transition-all duration-[280ms] ease-[cubic-bezier(0.22,1,0.36,1)] min-h-[190px] flex flex-col justify-between ${
        isFinalStep ? "border-emerald-200 bg-white" : ""
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-title"
      aria-describedby="tour-desc"
    >
      {/* Standard Onboarding Step card with silent transition cross-fades */}
      <div 
        className="transition-opacity duration-[150ms] ease-out flex-1 flex flex-col justify-between"
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
            <p>{activeStep.content}</p>
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
                className="h-9 px-5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-extrabold rounded-xl shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer disabled:pointer-events-none"
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
    </div>
  );
};

export default FloatingTooltip;
