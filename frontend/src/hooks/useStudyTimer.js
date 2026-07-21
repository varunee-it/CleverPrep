import { useStudySessionContext } from "../contexts/StudySessionContext";

/**
 * Reusable timer hook responsible for calculations and MM:SS formatted outputs.
 */
export const useStudyTimer = () => {
  const { session } = useStudySessionContext();

  const duration = session?.duration ?? 0;
  const remainingTime = session?.remainingTime ?? 0;
  const elapsed = duration - remainingTime;

  // Percentage calculations
  const progressPercent = duration > 0 ? (remainingTime / duration) * 100 : 0;

  // Helper formatting seconds to MM:SS string
  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    const formattedMins = String(mins).padStart(2, "0");
    const formattedSecs = String(secs).padStart(2, "0");
    return `${formattedMins}:${formattedSecs}`;
  };

  return {
    remainingTime,
    duration,
    elapsed,
    progressPercent,
    formattedTime: formatTime(remainingTime)
  };
};

export default useStudyTimer;
