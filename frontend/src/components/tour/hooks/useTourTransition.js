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

  const navigate = useNavigate();
  const location = useLocation();

  const transitionToStep = useCallback(async (nextIndex) => {
    if (nextIndex < 0 || nextIndex >= tourSteps.length) return;

    const startTime = performance.now();
    let navDuration = 0;
    let readyDuration = 0;
    let scrollDuration = 0;
    let spotlightDuration = 0;

    // 1. Disable buttons immediately (keep current step content at 100% opacity)
    setIsTransitioning(true);

    const nextStepConfig = tourSteps[nextIndex];

    // Fallback: If navigating to workspace details but no document is active, gracefully skip this step
    if (nextStepConfig.route && nextStepConfig.route.includes("/documents/:id")) {
      const docId = activeDocId || sessionStorage.getItem("cleverprep_tour_active_doc_id");
      if (!docId) {
        console.log("[Tour] No active document found. Gracefully skipping Workspace step.");
        setIsTransitioning(false);
        if (nextIndex < tourSteps.length - 1) {
          transitionToStep(nextIndex + 1);
        }
        return;
      }
    }

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

    const findTargetElement = (timeoutMs) => {
      return new Promise((resolve) => {
        const selector = nextStepConfig.targetSelector;
        
        // 1. Check immediately
        const checkElement = () => {
          const el = document.querySelector(selector);
          if (el) {
            const rect = el.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              return el;
            }
          }
          return null;
        };

        const initialEl = checkElement();
        if (initialEl) {
          return resolve(initialEl);
        }

        // 2. Set up MutationObserver to watch for DOM changes
        let isResolved = false;
        const observer = new MutationObserver(() => {
          const el = checkElement();
          if (el && !isResolved) {
            isResolved = true;
            observer.disconnect();
            clearTimeout(timeoutId);
            resolve(el);
          }
        });

        observer.observe(document.body, {
          childList: true,
          subtree: true,
          attributes: true, // Watch for display/visibility class changes
        });

        // 3. Fallback timeout
        const timeoutId = setTimeout(() => {
          if (!isResolved) {
            isResolved = true;
            observer.disconnect();
            resolve(null);
          }
        }, timeoutMs);
      });
    };

    if (nextStepConfig.targetSelector) {
      element = await findTargetElement(8000); // 8-second wait for heavy pages

      if (!element) {
        console.error(`[Tour Error] CRITICAL: Target ${nextStepConfig.targetSelector} not found after 8s wait on route ${location.pathname}. Check if the element exists in the DOM.`);
        setIsTransitioning(false);
        return; // Halt transition immediately instead of silently skipping
      }
    } else {
      // Step has no target selector (e.g. center step)
      await new Promise((resolve) => setTimeout(resolve, 150));
    }

    readyDuration = performance.now() - readyStart;

    // 5. Scroll target into view if outside viewport (before content fades out)
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
        await new Promise((resolve) => setTimeout(resolve, 350));
      }
      scrollDuration = performance.now() - scrollStart;
    }

    // 6. Start spotlight morph & tooltip slide by updating target coordinates (GPU accelerated translate3d)
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

    // 7. Simultaneously fade current content out to opacity 0 (150ms)
    setIsTooltipFading(true);
    
    // 8. Wait for spotlight morph and tooltip slide/reposition to complete (260ms duration)
    await new Promise((resolve) => setTimeout(resolve, 260));
    spotlightDuration = performance.now() - spotlightStart;

    // 9. Swap step content text by updating step index
    setCurrentStepIndex(nextIndex);

    // Let the positioning adjust to the new dimensions
    await new Promise((resolve) => setTimeout(resolve, 60));

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

  const resetTransition = useCallback(() => {
    setIsTransitioning(false);
    setIsTooltipFading(false);
  }, []);

  return {
    isTransitioning,
    isTooltipFading,
    transitionToStep,
    resetTransition,
  };
};

export default useTourTransition;
