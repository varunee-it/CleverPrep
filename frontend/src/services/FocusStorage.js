/**
 * Decoupled Client-Side Storage Gateway Service for Focus System.
 * All React components and context helpers communicate exclusively with this class.
 * This can easily be swapped with backend API requests later without modifying UI code.
 */
class FocusStorage {
  constructor() {
    this.SESSION_KEY = "cleverprep_active_session";
    this.HISTORY_KEY = "cleverprep_focus_history";
    this.STATS_KEY = "cleverprep_focus_stats";
    this.ACHIEVEMENTS_KEY = "cleverprep_focus_achievements";
    this.GOALS_KEY = "cleverprep_focus_goals";
    this.RECORDS_KEY = "cleverprep_focus_records";
  }

  // Helper to parse JSON safely
  _parse(val, fallback) {
    try {
      return val ? JSON.parse(val) : fallback;
    } catch {
      return fallback;
    }
  }

  // Active Session Persistence
  saveSession(session) {
    if (session) {
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    } else {
      this.clearSession();
    }
  }

  loadSession() {
    return this._parse(localStorage.getItem(this.SESSION_KEY), null);
  }

  clearSession() {
    localStorage.removeItem(this.SESSION_KEY);
  }

  // Session History logs
  saveHistory(history) {
    localStorage.setItem(this.HISTORY_KEY, JSON.stringify(history));
  }

  loadHistory() {
    return this._parse(localStorage.getItem(this.HISTORY_KEY), []);
  }

  // Streaks statistics
  saveStats(stats) {
    localStorage.setItem(this.STATS_KEY, JSON.stringify(stats));
  }

  loadStats() {
    const defaultStats = {
      currentStreak: 0,
      longestStreak: 0,
      weeklyStreak: 0,
      monthlyStreak: 0,
      streakFreezes: 0,
      lastActiveDate: null, // YYYY-MM-DD
      recoveryDaysLeft: 0,
      totalFocusPoints: 0,
      totalMinutes: 0
    };
    return this._parse(localStorage.getItem(this.STATS_KEY), defaultStats);
  }

  // Achievements progress
  saveAchievements(achievements) {
    localStorage.setItem(this.ACHIEVEMENTS_KEY, JSON.stringify(achievements));
  }

  loadAchievements() {
    // Array of unlocked achievement IDs with unlock dates
    return this._parse(localStorage.getItem(this.ACHIEVEMENTS_KEY), []);
  }

  // Daily goals status
  saveDailyGoals(goals) {
    localStorage.setItem(this.GOALS_KEY, JSON.stringify(goals));
  }

  loadDailyGoals() {
    const defaultGoals = {
      date: new Date().toLocaleDateString("en-CA"), // YYYY-MM-DD local timezone
      minutesTarget: 120, // 2 hours in minutes
      minutesCompleted: 0,
      sessionsTarget: 4,
      sessionsCompleted: 0,
      pdfsTarget: 1,
      pdfsCompleted: 0,
      flashcardsTarget: 1,
      flashcardsCompleted: 0,
      quizzesTarget: 1,
      quizzesCompleted: 0,
      podcastsTarget: 1,
      podcastsCompleted: 0
    };
    const saved = this._parse(localStorage.getItem(this.GOALS_KEY), null);
    const today = new Date().toLocaleDateString("en-CA");

    // Automatically reset goals on new calendar days
    if (!saved || saved.date !== today) {
      const freshGoals = { ...defaultGoals, date: today };
      this.saveDailyGoals(freshGoals);
      return freshGoals;
    }
    return saved;
  }

  // Personal Records
  savePersonalRecords(records) {
    localStorage.setItem(this.RECORDS_KEY, JSON.stringify(records));
  }

  loadPersonalRecords() {
    const defaultRecords = {
      longestSession: 0, // minutes
      fastestCompletion: 0, // percent completed
      bestWeek: 0, // hours
      bestMonth: 0, // hours
      highestStreak: 0,
      mostProductiveDay: null, // date
      favoriteEnvironment: "None",
      favoriteMotivation: "None"
    };
    return this._parse(localStorage.getItem(this.RECORDS_KEY), defaultRecords);
  }
}

export const focusStorage = new FocusStorage();
export default focusStorage;
