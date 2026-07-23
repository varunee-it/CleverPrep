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

  const [globalTheme, setGlobalTheme] = React.useState(() => localStorage.getItem("cleverprep_global_theme") || "white");
  React.useEffect(() => {
    const handleThemeChange = () => {
      setGlobalTheme(localStorage.getItem("cleverprep_global_theme") || "white");
    };
    window.addEventListener("cleverprep-global-theme-changed", handleThemeChange);
    return () => window.removeEventListener("cleverprep-global-theme-changed", handleThemeChange);
  }, []);

  const getThemeColor = () => {
    switch (globalTheme) {
      case "black": return "148, 163, 184"; // slate-400
      case "beige": return "217, 119, 6"; // amber-600
      case "lavender": return "139, 92, 246"; // violet-500
      default: return "16, 185, 129"; // emerald-500
    }
  };

  const themeRGB = getThemeColor();
  const padding = 12;
  const showSpotlight = targetRect !== null;

  return (
    <>
      {/* Backdrop overlay with SVG mask */}
      <svg 
        className="fixed inset-0 w-full h-full pointer-events-none z-[90] transition-opacity duration-300"
        style={{ opacity: isBackdropFading ? 0 : 1 }}
      >
        <defs>
          <filter id="tour-feather">
            <feGaussianBlur stdDeviation="8" />
          </filter>
          <mask id="tour-spotlight-mask">
            {/* White background covers the whole screen to create the dark overlay */}
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            
            {/* Black cutout representing the transparent spotlight area */}
            {showSpotlight && (
              <rect
                className="transition-all duration-[280ms]"
                style={{
                  transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
                  transitionProperty: "x, y, width, height, rx, ry"
                }}
                x={targetRect.left - padding}
                y={targetRect.top - padding}
                width={targetRect.width + padding * 2}
                height={targetRect.height + padding * 2}
                rx={targetRect.width === 0 ? "0" : "16"}
                ry={targetRect.height === 0 ? "0" : "16"}
                fill="black"
                filter="url(#tour-feather)"
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
          fill="rgba(15, 23, 42, 0.65)"
          mask="url(#tour-spotlight-mask)"
          className="pointer-events-auto transition-all duration-300"
          style={{
            backdropFilter: isBackdropFading ? "blur(0px)" : "blur(4px)",
            WebkitBackdropFilter: isBackdropFading ? "blur(0px)" : "blur(4px)",
          }}
        />
      </svg>

      {/* Premium Spotlight Focal Glow */}
      {showSpotlight && (
        <div
          className="fixed pointer-events-none z-[91] transition-all duration-[280ms]"
          style={{
            transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
            transitionProperty: "transform, width, height, border-radius, opacity",
            top: 0,
            left: 0,
            transform: `translate3d(${targetRect.left - padding}px, ${targetRect.top - padding}px, 0)`,
            width: targetRect.width + padding * 2,
            height: targetRect.height + padding * 2,
            borderRadius: targetRect.width === 0 ? "0" : "16px",
            opacity: targetRect.width === 0 ? 0 : 1,
            boxShadow: `0 0 0 2px rgba(${themeRGB}, 0.5), 0 0 30px rgba(${themeRGB}, 0.3)`,
            animation: "pulse 2.5s infinite ease-in-out"
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
