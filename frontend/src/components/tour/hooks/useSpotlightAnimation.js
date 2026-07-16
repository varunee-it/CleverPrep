import { useState, useEffect, useCallback, useRef } from "react";

export const useSpotlightAnimation = (isActive, activeStep) => {
  const [targetRect, setTargetRect] = useState(null);
  const observerRef = useRef(null);

  // Recalculates exact coordinates of target element
  const updateTargetCoordinates = useCallback(() => {
    if (!isActive || !activeStep || !activeStep.targetSelector) {
      setTargetRect(null);
      return;
    }

    const element = document.querySelector(activeStep.targetSelector);
    if (element) {
      const rect = element.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setTargetRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        });
        return;
      }
    }
    setTargetRect(null);
  }, [isActive, activeStep]);

  // Set up observers to watch sizing shifts dynamically
  useEffect(() => {
    if (isActive && activeStep?.targetSelector) {
      const element = document.querySelector(activeStep.targetSelector);
      if (element) {
        if (observerRef.current) {
          observerRef.current.disconnect();
        }

        observerRef.current = new ResizeObserver(() => {
          updateTargetCoordinates();
        });
        observerRef.current.observe(element);
        updateTargetCoordinates();
      }
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [isActive, activeStep, updateTargetCoordinates]);

  // Window resize and scroll adjustments
  useEffect(() => {
    if (isActive) {
      window.addEventListener("resize", updateTargetCoordinates);
      window.addEventListener("scroll", updateTargetCoordinates, true);
    }
    return () => {
      window.removeEventListener("resize", updateTargetCoordinates);
      window.removeEventListener("scroll", updateTargetCoordinates, true);
    };
  }, [isActive, updateTargetCoordinates]);

  return {
    targetRect,
    setTargetRect,
    updateTargetCoordinates,
  };
};

export default useSpotlightAnimation;
