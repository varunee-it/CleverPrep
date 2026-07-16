import { useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export const useTourTransition = (
  currentStepIndex,
  setCurrentStepIndex,
  tourSteps,
  activeDocId,
  setTargetRect,
  setCurrentTabSelection,
  resolveRoutePath,
  trackAnalytics
) => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isTooltipFading, setIsTooltipFading] = useState(false);
  const [showRetryState, setShowRetryState] = useState(false);
  const [isFeatureUnavailable, setIsFeatureUnavailable] = useState(false);
  const [failedStepIndex, setFailedStepIndex] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();

  const transitionToStep = useCallback(async (nextIndex) => {
    if (nextIndex < 0 || nextIndex >= tourSteps.length) return;

    const startTime = performance.now();
    let navDuration = 0;
    let readyDuration = 0;
    let scrollDuration = 0;
    let spotlightDuration = 0;

    // 1. Disable navigation buttons immediately, keep current tooltip and spotlight active
    setIsTransitioning(true);
    setShowRetryState(false);
    setIsFeatureUnavailable(false);
    setFailedStepIndex(null);

    const nextStepConfig = tourSteps[nextIndex];

    // 2. Resolve route navigation and navigate immediately
    const targetRoute = resolveRoutePath(nextStepConfig.route);
    const routeChanged = targetRoute && location.pathname !== targetRoute;

    if (routeChanged) {
      const navStart = performance.now();
      navigate(targetRoute);
      // Wait minor tick for route rendering to start
      await new Promise((resolve) => setTimeout(resolve, 100));
      navDuration = performance.now() - navStart;
    }

    // 3. Resolve tab selection immediately so rendering triggers
    if (nextStepConfig.tab) {
      setCurrentTabSelection(nextStepConfig.tab);
    }

    // 4. Wait silently until the next target is completely ready
    const readyStart = performance.now();
    let element = null;
    let isTimedOut = false;
    let hasRetried = false;

    const findTargetElement = async (timeoutMs) => {
      const timeoutPromise = new Promise((resolve) => setTimeout(() => {
        isTimedOut = true;
        resolve(null);
      }, timeoutMs));

      const findElementPromise = (async () => {
        let el = document.querySelector(nextStepConfig.targetSelector);
        let isMeasurable = false;
        
        while (!isTimedOut) {
          if (el) {
            const rect = el.getBoundingClientRect();
            // Check if element is visible and measurable
            if (rect.width > 0 && rect.height > 0) {
              isMeasurable = true;
              break;
            }
          }
          await new Promise((resolve) => setTimeout(resolve, 80));
          el = document.querySelector(nextStepConfig.targetSelector);
        }
        return isMeasurable ? el : null;
      })();

      return await Promise.race([findElementPromise, timeoutPromise]);
    };

    if (nextStepConfig.targetSelector) {
      element = await findTargetElement(8000); // 8-second limit

      // Check required vs optional steps rules
      if (!element) {
        if (nextStepConfig.required === false) {
          // Rule: If an optional step cannot be found after 8 seconds, automatically skip it.
          console.log(`[Tour] Optional step ${nextIndex + 1} target not found. Gracefully skipping.`);
          setIsTransitioning(false);
          setIsTooltipFading(false);
          // Advance to the next step
          if (nextIndex < tourSteps.length - 1) {
            transitionToStep(nextIndex + 1);
          } else {
            setIsTransitioning(false);
          }
          return;
        } else {
          // Rule: If a required step cannot be found, retry once automatically.
          console.log(`[Tour] Required step ${nextIndex + 1} target not found. Retrying once automatically...`);
          hasRetried = true;
          isTimedOut = false;
          // Wait 2 seconds before retry check
          await new Promise((resolve) => setTimeout(resolve, 2000));
          element = await findTargetElement(4000); // retry up to 4 more seconds
        }
      }
    } else {
      // Step has no target selector (e.g. center step)
      await new Promise((resolve) => setTimeout(resolve, 150));
    }

    readyDuration = performance.now() - readyStart;

    // 5. Handle fallback if required step still fails after retry
    if (nextStepConfig.targetSelector && !element && nextStepConfig.required) {
      console.warn(`[Tour] Required step ${nextIndex + 1} target still missing after retry.`);
      setFailedStepIndex(nextIndex);
      
      // Update step index to the target failed step so the tooltip shows it
      setCurrentStepIndex(nextIndex);
      // Remove spotlight highlight (fall back to center/neutral positioning)
      setTargetRect(null);
      
      // Trigger the inline "preparing" message
      setIsFeatureUnavailable(true);
      setIsTooltipFading(false);
      setIsTransitioning(false); // Enable buttons so they can click "Next"
      return;
    }

    // 6. Scroll target into view if outside viewport (before fading content)
    if (element) {
      const scrollStart = performance.now();
      const rect = element.getBoundingClientRect();
      const isInViewport =
        rect.top >= 10 &&
        rect.left >= 10 &&
        rect.bottom <= window.innerHeight - 10 &&
        rect.right <= window.innerWidth - 10;

      if (!isInViewport) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "nearest"
        });
        // Wait for smooth scrolling to complete
        await new Promise((resolve) => setTimeout(resolve, 400));
      }
      scrollDuration = performance.now() - scrollStart;
    }

    // 7. Fade current tooltip content to opacity 0 (150ms)
    setIsTooltipFading(true);
    await new Promise((resolve) => setTimeout(resolve, 150));

    // 8. Swap step variables and morph spotlight coordinates
    setCurrentStepIndex(nextIndex);

    const spotlightStart = performance.now();
    if (element) {
      const rect = element.getBoundingClientRect();
      setTargetRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
    } else {
      setTargetRect(null);
    }
    
    // 9. Wait for spotlight morph and tooltip slide/reposition to complete (260ms duration)
    await new Promise((resolve) => setTimeout(resolve, 260));
    spotlightDuration = performance.now() - spotlightStart;

    // 10. Fade new content from opacity 0 to opacity 1 (150ms)
    setIsTooltipFading(false);
    await new Promise((resolve) => setTimeout(resolve, 150));

    // 11. Re-enable navigation buttons
    setIsTransitioning(false);

    const totalDuration = performance.now() - startTime;

    // Telemetry reporting metrics
    console.log(`[Tour] Route: ${navDuration.toFixed(0)}ms`);
    console.log(`[Tour] Target Ready: ${readyDuration.toFixed(0)}ms`);
    console.log(`[Tour] Spotlight: ${(scrollDuration + spotlightDuration).toFixed(0)}ms`);
    console.log(`[Tour] Total: ${totalDuration.toFixed(0)}ms`);

    trackAnalytics("Step Transitioned", {
      from: currentStepIndex,
      to: nextIndex,
      totalDurationMs: totalDuration
    });
  }, [
    currentStepIndex,
    tourSteps,
    activeDocId,
    location.pathname,
    navigate,
    setTargetRect,
    setCurrentTabSelection,
    resolveRoutePath,
    setCurrentStepIndex,
    trackAnalytics
  ]);

  const retryTransition = useCallback(async () => {
    if (failedStepIndex !== null) {
      await transitionToStep(failedStepIndex);
    }
  }, [failedStepIndex, transitionToStep]);

  return {
    isTransitioning,
    isTooltipFading,
    showRetryState,
    isFeatureUnavailable,
    transitionToStep,
    retryTransition,
  };
};

export default useTourTransition;
