import {
  STATUS_IDLE,
  STATUS_CREATED,
  STATUS_RUNNING,
  STATUS_PAUSED,
  STATUS_COMPLETED,
  STATUS_CANCELLED,
  ACTIVITY_QUICK,
  SOURCE_DASHBOARD
} from "../constants/StudySessionConstants";
import StudySessionStorage from "../services/StudySessionStorage";
import focusStatsEngine from "../services/FocusStatsEngine";

/**
 * Manager responsible for governing Study Session lifecycles, states transitions,
 * timestamp calculations, and localStorage persistence.
 */
class StudySessionManager {
  constructor() {
    this.session = null;
    this.listeners = [];
  }

  // State checks for FSM transition enforcements
  canStart() {
    return this.session !== null && this.session.status === STATUS_CREATED;
  }

  canPause() {
    return this.session !== null && this.session.status === STATUS_RUNNING;
  }

  canResume() {
    return this.session !== null && this.session.status === STATUS_PAUSED;
  }

  canComplete() {
    return this.session !== null && this.session.status === STATUS_RUNNING;
  }

  canCancel() {
    return this.session !== null && [STATUS_RUNNING, STATUS_PAUSED, STATUS_CREATED].includes(this.session.status);
  }

  canReset() {
    return this.session !== null && [STATUS_COMPLETED, STATUS_CANCELLED, STATUS_CREATED].includes(this.session.status);
  }

  /**
   * Registers a subscriber callback to observe session modifications.
   */
  subscribe(listener) {
    this.listeners.push(listener);
    // Send immediate initial state
    listener(this.session ? { ...this.session } : null);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * Dispatches updates to all active context listeners.
   */
  notify() {
    this.listeners.forEach((listener) => {
      try {
        listener(this.session ? { ...this.session } : null);
      } catch (err) {
        console.error("[StudySessionManager] Subscriber callback failed:", err);
      }
    });
  }

  /**
   * Restores a previously saved study session from storage and updates remainingTime.
   */
  restoreSession() {
    try {
      const saved = StudySessionStorage.load();
      if (!saved) {
        this.session = null;
        this.notify();
        return;
      }

      // Valid session status list
      const validStatuses = [
        STATUS_IDLE,
        STATUS_CREATED,
        STATUS_RUNNING,
        STATUS_PAUSED,
        STATUS_COMPLETED,
        STATUS_CANCELLED
      ];

      // Validate session structure and status. If invalid, reset to STATUS_IDLE
      if (!saved.status || !validStatuses.includes(saved.status)) {
        this.resetToIdle();
        return;
      }

      // Automatically migrate older sessions to current model format
      const defaultSessionModel = {
        id: saved.id || `session_${Math.random().toString(36).substr(2, 9)}`,
        mode: saved.mode || "quick",
        documentId: saved.documentId || null,
        documentTitle: saved.documentTitle || null,
        activityType: saved.activityType || ACTIVITY_QUICK,
        goal: saved.goal || null,
        duration: typeof saved.duration === "number" ? saved.duration : 1800,
        remainingTime: typeof saved.remainingTime === "number" ? saved.remainingTime : 1800,
        status: saved.status,
        startedAt: saved.startedAt || null,
        pausedAt: saved.pausedAt || null,
        accumulatedPauseTime: saved.accumulatedPauseTime || 0,
        selectedSound: saved.selectedSound || null,
        source: saved.source || SOURCE_DASHBOARD,
        notes: saved.notes || "",
        createdAt: saved.createdAt || Date.now(),
        updatedAt: saved.updatedAt || Date.now(),
        completedAt: saved.completedAt || null,
        device: saved.device || navigator.userAgent,
        timezone: saved.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        version: saved.version || 1
      };

      const now = Date.now();
      let remaining = defaultSessionModel.remainingTime;
      let status = defaultSessionModel.status;
      let endedAt = saved.endedAt || null;

      if (defaultSessionModel.status === STATUS_RUNNING) {
        const elapsedMs = now - (defaultSessionModel.startedAt || now) - defaultSessionModel.accumulatedPauseTime;
        remaining = Math.max(0, defaultSessionModel.duration - Math.floor(elapsedMs / 1000));
        if (remaining <= 0) {
          status = STATUS_COMPLETED;
          endedAt = now;
        }
      } else if (defaultSessionModel.status === STATUS_PAUSED) {
        const elapsedMs = (defaultSessionModel.pausedAt || now) - (defaultSessionModel.startedAt || now) - defaultSessionModel.accumulatedPauseTime;
        remaining = Math.max(0, defaultSessionModel.duration - Math.floor(elapsedMs / 1000));
        if (remaining <= 0) {
          status = STATUS_COMPLETED;
          endedAt = defaultSessionModel.pausedAt || now;
        }
      }

      this.session = {
        ...defaultSessionModel,
        remainingTime: remaining,
        status,
        endedAt
      };

      StudySessionStorage.save(this.session);
      this.notify();
    } catch (err) {
      console.warn("[StudySessionManager] Error restoring study session. Resetting session to IDLE state:", err.message);
      this.resetToIdle();
    }
  }

  // Gracefully clear/reset session to idle
  resetToIdle() {
    this.session = null;
    StudySessionStorage.clear();
    this.notify();
  }

  /**
   * Initializes a new study session in the STATUS_CREATED state.
   */
  createSession({
    mode = "quick",
    duration = 1800,
    documentId = null,
    documentTitle = null,
    activityType = ACTIVITY_QUICK,
    goal = null,
    source = SOURCE_DASHBOARD
  } = {}) {
    if (this.session && ![STATUS_IDLE, STATUS_COMPLETED, STATUS_CANCELLED].includes(this.session.status)) {
      console.warn("[StudySessionManager] Cannot create session: Active session already exists.");
      return false;
    }

    const now = Date.now();
    this.session = {
      id: `session_${Math.random().toString(36).substr(2, 9)}`,
      mode,
      documentId,
      documentTitle,
      activityType,
      goal,
      duration,
      remainingTime: duration,
      status: STATUS_CREATED,
      startedAt: null,
      pausedAt: null,
      accumulatedPauseTime: 0,
      selectedSound: null,
      source,
      notes: "",
      createdAt: now,
      updatedAt: now,
      completedAt: null,
      device: navigator.userAgent,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      version: 1
    };

    StudySessionStorage.save(this.session);
    this.notify();
    return true;
  }

  /**
   * Transitions session status from created to running.
   */
  startSession() {
    if (!this.canStart()) {
      console.warn("[StudySessionManager] Invalid transition: startSession called outside CREATED status.");
      return false;
    }

    const now = Date.now();
    this.session.status = STATUS_RUNNING;
    this.session.startedAt = now;
    this.session.updatedAt = now;

    StudySessionStorage.save(this.session);
    this.notify();
    return true;
  }

  /**
   * Transitions session status from running to paused.
   */
  pauseSession() {
    if (!this.canPause()) {
      console.warn("[StudySessionManager] Invalid transition: pauseSession called outside RUNNING status.");
      return false;
    }

    const now = Date.now();
    this.session.status = STATUS_PAUSED;
    this.session.pausedAt = now;
    this.session.updatedAt = now;

    StudySessionStorage.save(this.session);
    this.notify();
    return true;
  }

  /**
   * Transitions session status from paused back to running.
   */
  resumeSession() {
    if (!this.canResume()) {
      console.warn("[StudySessionManager] Invalid transition: resumeSession called outside PAUSED status.");
      return false;
    }

    const now = Date.now();
    const pauseDuration = now - this.session.pausedAt;
    this.session.status = STATUS_RUNNING;
    this.session.accumulatedPauseTime += pauseDuration;
    this.session.pausedAt = null;
    this.session.updatedAt = now;

    StudySessionStorage.save(this.session);
    this.notify();
    return true;
  }

  /**
   * Transitions session status from running/paused to cancelled.
   */
  cancelSession() {
    if (!this.canCancel()) {
      console.warn("[StudySessionManager] Invalid transition: cancelSession called outside active statuses.");
      return false;
    }

    const now = Date.now();
    this.session.status = STATUS_CANCELLED;
    this.session.endedAt = now;
    this.session.updatedAt = now;

    // Log in stats engine as cancelled study log
    focusStatsEngine.logCompletedSession(this.session);

    StudySessionStorage.save(this.session);
    this.notify();
    return true;
  }

  completeSession() {
    if (!this.canComplete()) {
      console.warn("[StudySessionManager] Invalid transition: completeSession called outside RUNNING status.");
      return false;
    }

    const now = Date.now();
    this.session.status = STATUS_COMPLETED;
    this.session.remainingTime = 0;
    this.session.endedAt = now;
    this.session.completedAt = now;
    this.session.updatedAt = now;

    // Log in stats engine as completed study log
    focusStatsEngine.logCompletedSession(this.session);

    StudySessionStorage.save(this.session);
    this.notify();
    return true;
  }

  /**
   * Resets status back to idle, removing active details.
   */
  resetSession() {
    if (!this.canReset()) {
      console.warn("[StudySessionManager] Invalid transition: resetSession called outside completed, cancelled, or created statuses.");
      return false;
    }

    this.session = null;
    StudySessionStorage.clear();
    this.notify();
    return true;
  }

  /**
   * Updates specific fields on the active session.
   * @param {Object} fields - Fields to patch.
   */
  updateSession(fields = {}) {
    if (!this.session) {
      console.warn("[StudySessionManager] No active session to update.");
      return false;
    }

    this.session = {
      ...this.session,
      ...fields,
      updatedAt: Date.now()
    };

    StudySessionStorage.save(this.session);
    this.notify();
    return true;
  }

  /**
   * Recalculates remaining duration dynamically on clock ticks.
   * Internal hook for background timers.
   */
  tick() {
    if (!this.session || this.session.status !== STATUS_RUNNING) return;

    const now = Date.now();
    const elapsedMs = now - this.session.startedAt - this.session.accumulatedPauseTime;
    const remaining = Math.max(0, this.session.duration - Math.floor(elapsedMs / 1000));

    if (remaining !== this.session.remainingTime) {
      this.session.remainingTime = remaining;
      if (remaining <= 0) {
        this.session.status = STATUS_COMPLETED;
        this.session.endedAt = now;
        this.session.completedAt = now;
      }
      this.session.updatedAt = now;
      StudySessionStorage.save(this.session);
      this.notify();
    }
  }
}

// Single instance of StudySessionManager export for global app binding
const studySessionManagerInstance = new StudySessionManager();
export default studySessionManagerInstance;
export { studySessionManagerInstance as StudySessionManager };
