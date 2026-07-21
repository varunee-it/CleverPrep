import { focusStorage } from "./FocusStorage";

/**
 * Service to handle local storage operations for Study Session persistence.
 */
export const StudySessionStorage = {
  /**
   * Saves the current active study session object to local storage.
   * @param {Object} session - The current study session state object.
   */
  save(session) {
    focusStorage.saveSession(session);
  },

  /**
   * Loads the saved study session state from local storage.
   * @returns {Object|null} The parsed study session state or null.
   */
  load() {
    return focusStorage.loadSession();
  },

  /**
   * Clears the study session data from local storage.
   */
  clear() {
    focusStorage.clearSession();
  }
};

export default StudySessionStorage;
