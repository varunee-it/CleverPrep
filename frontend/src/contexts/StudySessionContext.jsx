import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import StudySessionManager from "../manager/StudySessionManager";
import { STATUS_RUNNING, STATUS_PAUSED, STATUS_COMPLETED, STATUS_CANCELLED } from "../constants/StudySessionConstants";
import audioManager from "../manager/AmbientAudioManager";

const StudySessionContext = createContext(null);

export const StudySessionProvider = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const sessionActiveStatus = [STATUS_RUNNING, STATUS_PAUSED];

  const [session, setSession] = useState(null);
  
  const isOverlayOpen = location.pathname === "/focus";
  const setIsOverlayOpen = useCallback((open) => {
    if (open) {
      navigate("/focus");
    } else {
      if (location.pathname.startsWith("/focus")) {
        navigate("/dashboard");
      }
    }
  }, [navigate, location.pathname]);
  
  // React-wrapped states synced from AmbientAudioManager
  const [currentSoundId, setCurrentSoundId] = useState(null);
  const [volume, setVolumeState] = useState(0.35);
  const [isMuted, setIsMutedState] = useState(false);
  const [failedSoundIds, setFailedSoundIds] = useState([]);

  // Subscribe context states to AmbientAudioManager events
  useEffect(() => {
    const unsubscribeAudio = audioManager.subscribe((state) => {
      setCurrentSoundId(state.currentSoundId);
      setVolumeState(state.volume);
      setIsMutedState(state.isMuted);
      setFailedSoundIds(state.failedSoundIds || []);
    });

    return () => {
      unsubscribeAudio();
      audioManager.cleanup();
    };
  }, []);

  // 1. Subscribe React state to manager updates
  useEffect(() => {
    // Restore session persistence caches on mount
    StudySessionManager.restoreSession();

    let isInitialMount = true;

    const unsubscribeSession = StudySessionManager.subscribe((newSession) => {
      setSession(newSession);
      const isSessionActive = newSession && ![STATUS_COMPLETED, STATUS_CANCELLED].includes(newSession.status);
      if (isSessionActive) {
        if (isInitialMount) {
          if (location.pathname === "/" || location.pathname === "/focus") {
            setIsOverlayOpen(true);
          }
        }
        if (newSession.selectedSound && newSession.status === STATUS_RUNNING) {
          // Re-trigger playback if session was study active
          audioManager.play(newSession.selectedSound);
        }
      }
      isInitialMount = false;
    });

    return unsubscribeSession;
  }, []);

  // 2. Ticking loop manager for active timer computations
  useEffect(() => {
    if (!session || session.status !== STATUS_RUNNING) return;

    const timer = setInterval(() => {
      StudySessionManager.tick();
    }, 1000);

    return () => clearInterval(timer);
  }, [session?.status]);

  // 3. Sync session active state to stop audio when session finishes or cancels
  useEffect(() => {
    const isCurrentlyActive = session && [STATUS_RUNNING, STATUS_PAUSED].includes(session.status);
    if (!isCurrentlyActive && audioManager.currentSound) {
      audioManager.stop();
    }
  }, [session?.status]);

  // Sound change selector action
  const setAmbientSound = useCallback((soundId) => {
    audioManager.play(soundId);
    if (StudySessionManager.session) {
      StudySessionManager.updateSession({ selectedSound: soundId });
    }
  }, []);

  // Volume adjuster
  const setVolume = useCallback((vol) => {
    audioManager.setVolume(vol);
  }, []);

  // Mute toggler
  const toggleMute = useCallback(() => {
    audioManager.toggleMute();
  }, []);

  // Wrapped manager actions for components
  const createSession = useCallback((config) => {
    return StudySessionManager.createSession(config);
  }, []);

  const startSession = useCallback(() => {
    return StudySessionManager.startSession();
  }, []);

  const pauseSession = useCallback(() => {
    return StudySessionManager.pauseSession();
  }, []);

  const resumeSession = useCallback(() => {
    return StudySessionManager.resumeSession();
  }, []);

  const cancelSession = useCallback(() => {
    return StudySessionManager.cancelSession();
  }, []);

  const completeSession = useCallback(() => {
    return StudySessionManager.completeSession();
  }, []);

  const resetSession = useCallback(() => {
    return StudySessionManager.resetSession();
  }, []);

  const canStart = useCallback(() => StudySessionManager.canStart(), []);
  const canPause = useCallback(() => StudySessionManager.canPause(), []);
  const canResume = useCallback(() => StudySessionManager.canResume(), []);
  const canComplete = useCallback(() => StudySessionManager.canComplete(), []);
  const canCancel = useCallback(() => StudySessionManager.canCancel(), []);
  const canReset = useCallback(() => StudySessionManager.canReset(), []);

  const updateSession = useCallback((fields) => {
    return StudySessionManager.updateSession(fields);
  }, []);

  // Fallback to saved session selection representation when player is stopped/silent
  const activeSoundId = currentSoundId || (session && [STATUS_RUNNING, STATUS_PAUSED].includes(session.status) ? session.selectedSound : null);

  return (
    <StudySessionContext.Provider
      value={{
        session,
        isOverlayOpen,
        setIsOverlayOpen,
        currentSoundId: activeSoundId,
        isMuted,
        volume,
        setVolume,
        setAmbientSound,
        toggleMute,
        failedSoundIds,
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
      }}
    >
      {children}
    </StudySessionContext.Provider>
  );
};



export const useStudySessionContext = () => {
  const ctx = useContext(StudySessionContext);
  if (!ctx) {
    throw new Error("useStudySessionContext must be used within a StudySessionProvider");
  }
  return ctx;
};

export default StudySessionContext;
