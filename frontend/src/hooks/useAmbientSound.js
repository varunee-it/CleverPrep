import { useStudySessionContext } from "../contexts/StudySessionContext";
import { AMBIENT_SOUNDS } from "../constants/StudySessionConstants";

/**
 * Reusable hook to control selected background sounds.
 */
export const useAmbientSound = () => {
  const {
    currentSoundId,
    isMuted,
    volume,
    setVolume,
    setAmbientSound,
    toggleMute,
    failedSoundIds
  } = useStudySessionContext();

  return {
    currentSoundId,
    isMuted,
    volume,
    setVolume,
    setAmbientSound,
    toggleMute,
    failedSoundIds,
    ambientSounds: AMBIENT_SOUNDS
  };
};

export default useAmbientSound;
