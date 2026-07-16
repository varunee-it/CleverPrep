import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "./AuthContext";
import { tourSteps } from "../components/tour/data/tourSteps";
import authService from "../services/authService";
import documentService from "../services/documentService";
import useSpotlightAnimation from "../components/tour/hooks/useSpotlightAnimation";
import useTourTransition from "../components/tour/hooks/useTourTransition";

const TourContext = createContext();

export const TourProvider = ({ children }) => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const observerRef = useRef(null);

  // Core global state variables
  const [isActive, setIsActive] = useState(() => {
    return sessionStorage.getItem("cleverprep_tour_active") === "true";
  });

  const [currentStepIndex, setCurrentStepIndex] = useState(() => {
    const saved = sessionStorage.getItem("cleverprep_tour_step");
    return saved ? parseInt(saved, 10) : 0;
  });

  const [showExitModal, setShowExitModal] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  
  const [activeDocId, setActiveDocId] = useState(() => {
    return sessionStorage.getItem("cleverprep_tour_active_doc_id") || "";
  });
  
  const [currentTabSelection, setCurrentTabSelection] = useState("");

  // States for premium completion sequence
  const [isTourCompleting, setIsTourCompleting] = useState(false);
  const [isBackdropFading, setIsBackdropFading] = useState(false);

  const activeStep = tourSteps[currentStepIndex];

  // Helper: logs events/analytics details to the console
  const trackAnalytics = useCallback((eventName, data = {}) => {
    console.log(`[TourTelemetry] ${eventName}`, {
      stepIndex: currentStepIndex,
      stepTitle: activeStep?.title,
      timestamp: new Date().toISOString(),
      ...data,
    });
  }, [currentStepIndex, activeStep]);

  // Resolves documents IDs or path prefixes
  const resolveRoutePath = useCallback((route) => {
    if (!route) return null;
    if (route.includes(":id")) {
      const docId = activeDocId || sessionStorage.getItem("cleverprep_tour_active_doc_id");
      return route.replace(":id", docId || "");
    }
    return route;
  }, [activeDocId]);

  // 1. Hook for spotlight tracking coordinates
  const { targetRect, setTargetRect, updateTargetCoordinates } = useSpotlightAnimation(isActive, activeStep);

  // 2. Hook for step transitions
  const {
    isTransitioning,
    isTooltipFading,
    showRetryState,
    isFeatureUnavailable,
    transitionToStep,
    retryTransition
  } = useTourTransition(
    currentStepIndex,
    setCurrentStepIndex,
    tourSteps,
    activeDocId,
    setTargetRect,
    setCurrentTabSelection,
    resolveRoutePath,
    trackAnalytics
  );

  // Sync state values to sessionStorage
  useEffect(() => {
    sessionStorage.setItem("cleverprep_tour_active", isActive ? "true" : "false");
  }, [isActive]);

  useEffect(() => {
    sessionStorage.setItem("cleverprep_tour_step", currentStepIndex.toString());
  }, [currentStepIndex]);

  useEffect(() => {
    if (activeDocId) {
      sessionStorage.setItem("cleverprep_tour_active_doc_id", activeDocId);
    }
  }, [activeDocId]);

  // Welcome modal trigger rules
  useEffect(() => {
    if (
      user &&
      !user.onboarding?.hasCompletedTour &&
      location.pathname === "/dashboard" &&
      !isActive &&
      sessionStorage.getItem("cleverprep_welcome_shown") !== "true"
    ) {
      setShowWelcomeModal(true);
      sessionStorage.setItem("cleverprep_welcome_shown", "true");
    }
  }, [user, location.pathname, isActive]);

  // API Call helper to update onboarding status in database
  const saveOnboardingStatus = async (hasCompleted, version = 1, autoShow = true) => {
    try {
      const res = await authService.updateOnboarding({
        hasCompletedTour: hasCompleted,
        tourVersion: version,
        autoShowNewTours: autoShow
      });
      if (res.success && res.data) {
        updateUser({ onboarding: res.data.onboarding });
      }
    } catch (error) {
      console.error("[TourContext] Failed to save onboarding status:", error);
    }
  };

  // Start the tour
  const startTour = useCallback((force = false) => {
    if (!force && user?.onboarding?.hasCompletedTour) return;
    
    setIsTourCompleting(false);
    setIsBackdropFading(false);
    setShowWelcomeModal(false);
    setCurrentStepIndex(0);
    setIsActive(true);
    trackAnalytics("Tour Started");
  }, [user, trackAnalytics]);

  // Complete the tour successfully with a premium sequential fadeout
  const completeTour = useCallback(async () => {
    trackAnalytics("Tour Completed");
    setIsTourCompleting(true);

    // 1. Fade tooltip card content (tooltip starts fading)
    await new Promise((resolve) => setTimeout(resolve, 200));

    // 2. Spotlight shrinks away (animates to center point with 0 width/height)
    if (targetRect) {
      setTargetRect((prev) => {
        if (!prev) return null;
        return {
          top: prev.top + prev.height / 2,
          left: prev.left + prev.width / 2,
          width: 0,
          height: 0,
        };
      });
    }
    await new Promise((resolve) => setTimeout(resolve, 250));

    // 3. Backdrop fades out
    setIsBackdropFading(true);
    await new Promise((resolve) => setTimeout(resolve, 300));

    // 4. Return app control and trigger success toast
    setIsActive(false);
    setShowExitModal(false);
    setIsTourCompleting(false);
    setIsBackdropFading(false);
    setTargetRect(null);

    toast.success("You're all set! Enjoy learning with CleverPrep.", {
      icon: "🎉",
      duration: 4000,
      style: {
        borderRadius: "14px",
        background: "#0f172a",
        color: "#ffffff",
        fontSize: "13px",
        fontWeight: "bold",
      },
    });

    // Save completion to database
    saveOnboardingStatus(true, user?.onboarding?.tourVersion || 1, user?.onboarding?.autoShowNewTours ?? true);
  }, [user, targetRect, setTargetRect, trackAnalytics]);

  // Navigate next step
  const nextStep = useCallback(async () => {
    if (isTransitioning || isTourCompleting) return;

    if (currentStepIndex < tourSteps.length - 1) {
      await transitionToStep(currentStepIndex + 1);
    } else {
      await completeTour();
    }
  }, [currentStepIndex, isTransitioning, isTourCompleting, transitionToStep, completeTour]);

  // Navigate previous step
  const prevStep = useCallback(async () => {
    if (isTransitioning || isTourCompleting) return;

    if (currentStepIndex > 0) {
      await transitionToStep(currentStepIndex - 1);
    }
  }, [currentStepIndex, isTransitioning, isTourCompleting, transitionToStep]);

  // Skip the tour (triggers instant exit)
  const skipTour = useCallback(() => {
    trackAnalytics("Tour Skipped", { stepIndexAtSkip: currentStepIndex });
    setIsActive(false);
    setShowExitModal(false);
    
    // Save completion to database
    saveOnboardingStatus(true, user?.onboarding?.tourVersion || 1, user?.onboarding?.autoShowNewTours ?? true);
  }, [currentStepIndex, user, trackAnalytics]);

  // Exit the tour (shows modal confirmation dialog)
  const exitTour = useCallback(() => {
    trackAnalytics("Tour Exit Prompted", { stepIndex: currentStepIndex });
    setShowExitModal(true);
  }, [currentStepIndex, trackAnalytics]);

  // Confirm dismissal from exit modal
  const confirmExit = useCallback(() => {
    skipTour();
  }, [skipTour]);

  // Cancel exit prompt
  const cancelExit = useCallback(() => {
    setShowExitModal(false);
  }, []);

  // Replay tour from settings
  const replayTour = useCallback(() => {
    startTour(true);
  }, [startTour]);

  // Update auto show preference toggle
  const toggleAutoShowNewTours = useCallback((autoShow) => {
    saveOnboardingStatus(
      user?.onboarding?.hasCompletedTour ?? false,
      user?.onboarding?.tourVersion || 1,
      autoShow
    );
  }, [user]);

  // Check if first-time onboarding walkthrough conditions are fully satisfied
  const checkAndTriggerWalkthrough = useCallback((documents) => {
    if (!user || user.onboarding?.hasCompletedTour) return;

    // Filter out deleted/corrupt docs
    const validDocs = documents.filter(doc => doc && doc._id && doc.status);
    if (validDocs.length === 0) return;

    // Sort documents by creation date ascending (first document uploaded)
    const oldestDoc = [...validDocs].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))[0];

    const notesReady = oldestDoc.status === "ready";
    const quizReady = oldestDoc.quizCount > 0;
    const flashcardReady = oldestDoc.flashcardCount > 0;
    const podcastReady = oldestDoc.podcastCount > 0;

    if (notesReady && quizReady && flashcardReady && podcastReady && !isActive) {
      setActiveDocId(oldestDoc._id);
      startTour(true);
    }
  }, [user, isActive, startTour]);

  // Fetches latest documents list and evaluates onboarding eligibility
  const evaluateTrigger = useCallback(async () => {
    if (!user || user.onboarding?.hasCompletedTour || isActive) return;
    try {
      const data = await documentService.getDocuments();
      if (data) {
        checkAndTriggerWalkthrough(data);
      }
    } catch (err) {
      console.error("[TourContext] evaluateTrigger failed:", err);
    }
  }, [user, isActive, checkAndTriggerWalkthrough]);

  return (
    <TourContext.Provider
      value={{
        isActive,
        currentStepIndex,
        targetRect,
        isTransitioning,
        isTooltipFading,
        showRetryState,
        isFeatureUnavailable,
        isTourCompleting,
        isBackdropFading,
        showExitModal,
        showWelcomeModal,
        activeDocId,
        currentTabSelection,
        activeStep,
        startTour,
        nextStep,
        prevStep,
        skipTour,
        exitTour,
        confirmExit,
        cancelExit,
        completeTour,
        replayTour,
        toggleAutoShowNewTours,
        setShowWelcomeModal,
        checkAndTriggerWalkthrough,
        evaluateTrigger,
        setActiveDocId,
        setCurrentTabSelection,
        updateTargetCoordinates,
        retryTransition
      }}
    >
      {children}
    </TourContext.Provider>
  );
};

export const useTour = () => useContext(TourContext);
export default TourContext;
