import focusStorage from "./FocusStorage";

class FocusStatsEngine {
  // Logs a completed session and updates streaks, goals, records, and achievements
  logCompletedSession(session) {
    try {
      const history = focusStorage.loadHistory();
      const stats = focusStorage.loadStats();
      const records = focusStorage.loadPersonalRecords();
      const achievements = focusStorage.loadAchievements();
      const dailyGoals = focusStorage.loadDailyGoals();

      const now = new Date();
      const todayStr = now.toLocaleDateString("en-CA"); // YYYY-MM-DD

      // 1. Calculate duration and completion rate
      const completedDuration = session.duration - session.remainingTime; // in seconds
      const completionRate = Math.round((completedDuration / session.duration) * 100);

      // Create new history log entry matching specs
      const newLog = {
        id: session.id || `log_${Math.random().toString(36).substr(2, 9)}`,
        date: todayStr,
        startTime: new Date(session.startedAt || now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        endTime: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        totalDuration: Math.round(session.duration / 60), // minutes
        completedDuration: Math.round(completedDuration / 60), // minutes
        activity: session.activityType || "Quick Focus",
        goal: session.goal || "Deep Focus Session",
        environment: session.selectedSound || "Silence Off",
        motivation: session.motivationTrack || "None",
        completionStatus: completionRate >= 95 ? "Completed" : "Cancelled",
        pauseCount: session.pauseCount || 0,
        notes: session.notes || "",
        createdAt: now.toISOString()
      };

      // Append and save to history
      history.push(newLog);
      focusStorage.saveHistory(history);

      // Only update goals, streaks, and achievements if the user actually spent time focusing (at least 1 minute)
      if (newLog.completedDuration < 1) {
        return { unlockedAchievements: [] };
      }

      // 2. Update Daily Goals
      dailyGoals.minutesCompleted += newLog.completedDuration;
      if (newLog.completionStatus === "Completed") {
        dailyGoals.sessionsCompleted += 1;
      }

      // Sync activity categories to daily goals
      const act = newLog.activity.toLowerCase();
      if (act.includes("pdf") || act.includes("read")) dailyGoals.pdfsCompleted += 1;
      else if (act.includes("flashcard")) dailyGoals.flashcardsCompleted += 1;
      else if (act.includes("quiz")) dailyGoals.quizzesCompleted += 1;
      else if (act.includes("podcast")) dailyGoals.podcastsCompleted += 1;
      else if (act.includes("note") || act.includes("view")) dailyGoals.notesCompleted += 1;

      focusStorage.saveDailyGoals(dailyGoals);

      // 3. Update Streaks (Only on successful completed sessions)
      let streakIncreased = false;
      if (newLog.completionStatus === "Completed") {
        const lastActive = stats.lastActiveDate;

        if (!lastActive) {
          stats.currentStreak = 1;
          stats.longestStreak = 1;
          stats.lastActiveDate = todayStr;
          streakIncreased = true;
        } else {
          const diffDays = this._getDaysDifference(lastActive, todayStr);

          if (diffDays === 0) {
            // Already focused today, streak remains same
          } else if (diffDays === 1) {
            // Consecutive day
            stats.currentStreak += 1;
            stats.lastActiveDate = todayStr;
            streakIncreased = true;
          } else {
            // Missed day(s) - check streak freezes
            if (stats.streakFreezes > 0) {
              // Deduct streak freeze and recover
              stats.streakFreezes -= 1;
              stats.currentStreak += 1;
              stats.lastActiveDate = todayStr;
              streakIncreased = true;
              console.log(`[Streak Engine] Streak freeze consumed. Saved streak! Remaining freezes: ${stats.streakFreezes}`);
            } else {
              // Streak broken - reset to 1
              stats.currentStreak = 1;
              stats.lastActiveDate = todayStr;
              streakIncreased = true;
            }
          }
        }

        if (stats.currentStreak > stats.longestStreak) {
          stats.longestStreak = stats.currentStreak;
        }
      }

      // Update total focus credits and stats
      stats.totalMinutes += newLog.completedDuration;
      stats.totalFocusPoints += newLog.completedDuration * 10; // 10 coins per focused minute
      focusStorage.saveStats(stats);

      // 4. Update Personal Records
      if (newLog.completedDuration > records.longestSession) {
        records.longestSession = newLog.completedDuration;
      }
      if (stats.longestStreak > records.highestStreak) {
        records.highestStreak = stats.longestStreak;
      }

      // Re-evaluate favorite environments and motivations
      records.favoriteEnvironment = this._getFavoriteItem(history, "environment");
      records.favoriteMotivation = this._getFavoriteItem(history, "motivation");

      focusStorage.savePersonalRecords(records);

      // 5. Evaluate Achievements
      const unlockedAchievements = [];
      const newAchievements = [...achievements];

      const achievementCriteria = [
        { id: "first_session", title: "🌱 First Session", desc: "Completed your first study block" },
        { id: "streak_7", title: "🔥 7 Day Streak", desc: "Maintained a 7-day study streak" },
        { id: "sessions_30", title: "⚡ 30 Sessions", desc: "Completed 30 focus sessions" },
        { id: "hours_100", title: "📚 100 Hours", desc: "Studied for a total of 100 hours" },
        { id: "night_owl", title: "🌙 Night Owl", desc: "Studied after midnight (12:00 AM - 4:00 AM)" },
        { id: "early_bird", title: "🌅 Early Bird", desc: "Studied early in the morning (5:00 AM - 8:00 AM)" },
        { id: "deep_focus", title: "🧠 Deep Focus", desc: "Completed a study session of at least 45 minutes" },
        { id: "productivity_master", title: "🚀 Productivity Master", desc: "Completed 4 sessions in a single day" }
      ];

      // Total completed sessions count
      const totalCompletedCount = history.filter(h => h.completionStatus === "Completed").length;
      const totalHours = stats.totalMinutes / 60;

      // Check each criteria
      achievementCriteria.forEach(crit => {
        const isAlreadyUnlocked = achievements.some(a => a.id === crit.id);
        if (isAlreadyUnlocked) return;

        let shouldUnlock = false;

        if (crit.id === "first_session" && totalCompletedCount >= 1) {
          shouldUnlock = true;
        } else if (crit.id === "streak_7" && stats.longestStreak >= 7) {
          shouldUnlock = true;
        } else if (crit.id === "sessions_30" && totalCompletedCount >= 30) {
          shouldUnlock = true;
        } else if (crit.id === "hours_100" && totalHours >= 100) {
          shouldUnlock = true;
        } else if (crit.id === "deep_focus" && newLog.completedDuration >= 45 && newLog.completionStatus === "Completed") {
          shouldUnlock = true;
        } else if (crit.id === "night_owl") {
          const hour = new Date(session.startedAt || now).getHours();
          if (hour >= 0 && hour < 4) shouldUnlock = true;
        } else if (crit.id === "early_bird") {
          const hour = new Date(session.startedAt || now).getHours();
          if (hour >= 5 && hour < 8) shouldUnlock = true;
        } else if (crit.id === "productivity_master") {
          const todayCompletedCount = history.filter(h => h.date === todayStr && h.completionStatus === "Completed").length;
          if (todayCompletedCount >= 4) shouldUnlock = true;
        }

        if (shouldUnlock) {
          const unlockedItem = {
            id: crit.id,
            title: crit.title,
            desc: crit.desc,
            unlockedAt: new Date().toLocaleDateString()
          };
          newAchievements.push(unlockedItem);
          unlockedAchievements.push(unlockedItem);
        }
      });

      if (unlockedAchievements.length > 0) {
        focusStorage.saveAchievements(newAchievements);
      }

      return { unlockedAchievements };
    } catch (err) {
      console.warn("[FocusStatsEngine] Failed to log session or compute streaks:", err.message);
      return { unlockedAchievements: [] };
    }
  }

  // Calculate day difference between two dates YYYY-MM-DD
  _getDaysDifference(date1Str, date2Str) {
    const d1 = new Date(date1Str);
    const d2 = new Date(date2Str);
    const diffTime = d2.getTime() - d1.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  // Helper to find favorite items in array (e.g. environment, motivation)
  _getFavoriteItem(history, field) {
    if (!history || history.length === 0) return "None";
    const counts = {};
    let favorite = "None";
    let maxCount = 0;

    history.forEach(item => {
      const val = item[field];
      if (!val || val === "None" || val === "Silence Off") return;
      counts[val] = (counts[val] || 0) + 1;
      if (counts[val] > maxCount) {
        maxCount = counts[val];
        favorite = val;
      }
    });

    return favorite;
  }
}

export const focusStatsEngine = new FocusStatsEngine();
export default focusStatsEngine;
