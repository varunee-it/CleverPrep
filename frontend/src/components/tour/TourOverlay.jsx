import React, { useEffect } from "react";
import { useTour } from "../../context/TourContext";
import FloatingTooltip from "./FloatingTooltip";
import ExitConfirmationModal from "./ExitConfirmationModal";

const TourOverlay = () => {
  const {
    isActive,
    targetRect,
    showExitModal,
    isBackdropFading,
    exitTour,
    cancelExit,
    confirmExit,
  } = useTour();

  // Escape key handler to prompt confirmation (does not close instantly)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isActive) return;
      if (e.key === "Escape") {
        e.preventDefault();
        exitTour();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isActive, exitTour]);

  if (!isActive) return null;

  const padding = 8;
  const showSpotlight = targetRect !== null;

  return (
    <>
      {/* Backdrop overlay with SVG mask */}
      <svg 
        className="fixed inset-0 w-full h-full pointer-events-none z-[90] transition-opacity duration-300"
        style={{ opacity: isBackdropFading ? 0 : 1 }}
      >
        <defs>
          <mask id="tour-spotlight-mask">
            {/* White background covers the whole screen to create the dark overlay */}
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            
            {/* Black cutout representing the transparent spotlight area */}
            {showSpotlight && (
              <rect
                className="transition-all duration-[260ms]"
                style={{
                  transitionTimingFunction: "cubic-bezier(0.25, 1.25, 0.5, 1)",
                  transitionProperty: "x, y, width, height, rx, ry"
                }}
                x={targetRect.left - padding}
                y={targetRect.top - padding}
                width={targetRect.width + padding * 2}
                height={targetRect.height + padding * 2}
                rx={targetRect.width === 0 ? "0" : "12"}
                ry={targetRect.height === 0 ? "0" : "12"}
                fill="black"
              />
            )}
          </mask>
        </defs>

        {/* Overlay rectangle masked with our spotlight mask */}
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(15, 23, 42, 0.45)"
          mask="url(#tour-spotlight-mask)"
          className="pointer-events-auto transition-all duration-300"
          style={{
            backdropFilter: isBackdropFading ? "blur(0px)" : "blur(3px)",
            WebkitBackdropFilter: isBackdropFading ? "blur(0px)" : "blur(3px)",
          }}
        />
      </svg>

      {/* Pulsing focal border overlay mimicking traveling motion */}
      {showSpotlight && (
        <div
          className="fixed pointer-events-none z-[91] border-2 border-emerald-500/80 shadow-[0_0_15px_rgba(16,185,129,0.25)] transition-all duration-[260ms]"
          style={{
            transitionTimingFunction: "cubic-bezier(0.25, 1.25, 0.5, 1)",
            transitionProperty: "top, left, width, height, border-radius, opacity",
            top: targetRect.top - padding,
            left: targetRect.left - padding,
            width: targetRect.width + padding * 2,
            height: targetRect.height + padding * 2,
            borderRadius: targetRect.width === 0 ? "0" : "12px",
            opacity: targetRect.width === 0 ? 0 : 1,
            // Custom soft breathing animation that runs independently
            animation: "pulse 2s infinite ease-in-out"
          }}
        />
      )}

      {/* Floating Tooltip Component */}
      <FloatingTooltip />

      {/* Accidental Close Confirmation Modal */}
      <ExitConfirmationModal
        isOpen={showExitModal}
        onClose={cancelExit}
        onConfirm={confirmExit}
      />
    </>
  );
};

export default TourOverlay;
