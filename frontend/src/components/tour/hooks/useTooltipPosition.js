import { useState, useEffect } from "react";

export const useTooltipPosition = (isActive, activeStep, targetRect, tooltipRef) => {
  const [coords, setCoords] = useState({ top: 0, left: 0, placement: "center" });

  useEffect(() => {
    if (!isActive || !activeStep) return;

    const calculatePosition = () => {
      // 1. Center step layout override
      if (activeStep.position === "center" || !targetRect) {
        setCoords({ top: 0, left: 0, placement: "center" });
        return;
      }

      const tooltip = tooltipRef.current;
      const tooltipWidth = tooltip ? tooltip.offsetWidth : 350;
      const tooltipHeight = tooltip ? tooltip.offsetHeight : 200;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // 2. Mobile Layout Override (Fixed bottom sheet)
      if (viewportWidth < 768) {
        setCoords({ top: 0, left: 0, placement: "mobile-bottom" });
        return;
      }

      const gap = 14;
      const padding = 8;
      
      const targetTop = targetRect.top - padding;
      const targetBottom = targetRect.top + targetRect.height + padding;
      const targetLeft = targetRect.left - padding;
      const targetRight = targetRect.left + targetRect.width + padding;

      // 3. Resolve preferred placement dynamically based on target viewport position
      let preferredPlacement = activeStep.position || "bottom";

      if (targetRect.top < 85) {
        preferredPlacement = "bottom"; // Near top header -> Bottom
      } else if (targetRect.left < 265) {
        preferredPlacement = "right";  // Near sidebar -> Right
      } else if (targetRect.left + targetRect.width > viewportWidth - 310) {
        preferredPlacement = "left";   // Near right border -> Left
      } else if (targetRect.top + targetRect.height > viewportHeight - 130) {
        preferredPlacement = "top";    // Near bottom -> Top
      }

      // Helper function to get coordinates for a specific placement
      const getCoordsForPlacement = (placementVal) => {
        let t = 0;
        let l = 0;
        if (placementVal === "bottom") {
          t = targetBottom + gap;
          l = targetLeft + (targetRect.width + padding * 2) / 2 - tooltipWidth / 2;
        } else if (placementVal === "top") {
          t = targetTop - tooltipHeight - gap;
          l = targetLeft + (targetRect.width + padding * 2) / 2 - tooltipWidth / 2;
        } else if (placementVal === "right") {
          t = targetTop + (targetRect.height + padding * 2) / 2 - tooltipHeight / 2;
          l = targetRight + gap;
        } else if (placementVal === "left") {
          t = targetTop + (targetRect.height + padding * 2) / 2 - tooltipHeight / 2;
          l = targetLeft - tooltipWidth - gap;
        }
        return { top: t, left: l };
      };

      // Check if coordinates cause screen overflow
      const checkOverflow = (c) => {
        const outLeft = c.left < 10;
        const outRight = c.left + tooltipWidth > viewportWidth - 10;
        const outTop = c.top < 10;
        const outBottom = c.top + tooltipHeight > viewportHeight - 10;
        return outLeft || outRight || outTop || outBottom;
      };

      // 4. Collision Detection and Flipped Placements
      let finalPlacement = preferredPlacement;
      let finalCoords = getCoordsForPlacement(finalPlacement);

      if (checkOverflow(finalCoords)) {
        // Try Flipping
        const flipMapping = {
          top: "bottom",
          bottom: "top",
          left: "right",
          right: "left"
        };
        const flippedPlacement = flipMapping[preferredPlacement];
        const flippedCoords = getCoordsForPlacement(flippedPlacement);

        if (!checkOverflow(flippedCoords)) {
          finalPlacement = flippedPlacement;
          finalCoords = flippedCoords;
        } else {
          // If both preferred & flipped overflow, find first placement that fits
          const fallbackPlacements = ["bottom", "right", "top", "left"];
          for (const placement of fallbackPlacements) {
            const tempCoords = getCoordsForPlacement(placement);
            if (!checkOverflow(tempCoords)) {
              finalPlacement = placement;
              finalCoords = tempCoords;
              break;
            }
          }
        }
      }

      // 5. Shift & Clamp within screen borders (preventing any cropping)
      let adjustedLeft = finalCoords.left;
      let adjustedTop = finalCoords.top;

      if (adjustedLeft < 10) {
        adjustedLeft = 10;
      } else if (adjustedLeft + tooltipWidth > viewportWidth - 10) {
        adjustedLeft = viewportWidth - tooltipWidth - 10;
      }

      if (adjustedTop < 10) {
        adjustedTop = 10;
      } else if (adjustedTop + tooltipHeight > viewportHeight - 10) {
        adjustedTop = viewportHeight - tooltipHeight - 10;
      }

      setCoords({
        top: adjustedTop,
        left: adjustedLeft,
        placement: finalPlacement,
      });
    };

    calculatePosition();
    window.addEventListener("resize", calculatePosition);
    window.addEventListener("scroll", calculatePosition);

    return () => {
      window.removeEventListener("resize", calculatePosition);
      window.removeEventListener("scroll", calculatePosition);
    };
  }, [isActive, activeStep, targetRect, tooltipRef]);

  return coords;
};

export default useTooltipPosition;
