import { useStudySessionContext } from "../contexts/StudySessionContext";

/**
 * Reusable hook to access active StudySession states and lifecycle actions.
 */
export const useStudySession = () => {
  const {
    session,
    isOverlayOpen,
    setIsOverlayOpen,
    createSession,
    startSession,
    pauseSession,
    resumeSession,
    cancelSession,
    completeSession,
    resetSession,
    updateSession,
    canStart,
    canPause,
    canResume,
    canComplete,
    canCancel,
    canReset
  } = useStudySessionContext();

  return {
    session,
    isOverlayOpen,
    setIsOverlayOpen,
    createSession,
    startSession,
    pauseSession,
    resumeSession,
    cancelSession,
    completeSession,
    resetSession,
    updateSession,
    canStart,
    canPause,
    canResume,
    canComplete,
    canCancel,
    canReset
  };
};

export default useStudySession;
