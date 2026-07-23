import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";
import { getProfile, recordStudyStreak } from "../services/authService";

// ==========================================
// Create Context
// ==========================================
const AuthContext = createContext();

// ==========================================
// Custom Hook
// ==========================================
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used within an AuthProvider"
    );
  }

  return context;
};

// ==========================================
// Auth Provider
// ==========================================
export const AuthProvider = ({ children }) => {
  // =========================
  // States
  // =========================
  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(true);

  const [isAuthenticated, setIsAuthenticated] =
    useState(false);

  // =========================
  // Check Authentication
  // =========================
  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      const userStr = localStorage.getItem("user");

      if (token) {
        // Optimistically set from local storage cache first
        if (userStr) {
          try {
            const cachedUser = JSON.parse(userStr);
            setUser(cachedUser);
            setIsAuthenticated(true);
          } catch (e) {
            console.error("[Auth Context] Failed to parse cached user:", e);
          }
        }

        // Fetch fresh profile from backend to verify name and clear out outdated profiles
        try {
          const todayStr = new Date().toLocaleDateString("en-CA");
          const profileRes = await getProfile(todayStr);
          if (profileRes && profileRes.data) {
            const freshUser = profileRes.data;
            localStorage.setItem("user", JSON.stringify(freshUser));
            
            // Sync local focus stats from backend streak data
            try {
              const statsStr = localStorage.getItem("cleverprep_focus_stats");
              let statsObj = statsStr ? JSON.parse(statsStr) : {};
              statsObj.currentStreak = freshUser.currentStreak || 0;
              statsObj.longestStreak = freshUser.longestStreak || 0;
              if (freshUser.lastStudyDate) {
                statsObj.lastActiveDate = freshUser.lastStudyDate;
              }
              localStorage.setItem("cleverprep_focus_stats", JSON.stringify(statsObj));
            } catch (statsErr) {
              console.error("[Auth Context] Failed to sync focus stats:", statsErr);
            }

            setUser(freshUser);
            setIsAuthenticated(true);
            console.log("[Auth Context] Profile data refreshed from backend:", freshUser);
          }
        } catch (fetchError) {
          console.error("[Auth Context] Error fetching fresh profile:", fetchError);
          // Force logout on authentication error (e.g. 401 Unauthorized)
          if (fetchError.statusCode === 401 || fetchError.status === 401) {
            logout();
            return;
          }
        }
      } else {
        // Clear variables if no token present
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error(
        "Auth check failed:",
        error
      );
      logout();
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // Check Auth On App Load
  // =========================
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // =========================
  // Login
  // =========================
  const login = (userData, token) => {
    localStorage.setItem("token", token);

    localStorage.setItem(
      "user",
      JSON.stringify(userData)
    );

    try {
      const statsStr = localStorage.getItem("cleverprep_focus_stats");
      let statsObj = statsStr ? JSON.parse(statsStr) : {};
      statsObj.currentStreak = userData.currentStreak || 0;
      statsObj.longestStreak = userData.longestStreak || 0;
      if (userData.lastStudyDate) {
        statsObj.lastActiveDate = userData.lastStudyDate;
      }
      localStorage.setItem("cleverprep_focus_stats", JSON.stringify(statsObj));
    } catch (e) {
      console.error("[Auth Context] Local stats sync failed on login:", e);
    }

    setUser(userData);

    setIsAuthenticated(true);
  };

  // =========================
  // Logout
  // =========================
  const logout = () => {
    localStorage.removeItem("token");

    localStorage.removeItem("user");

    setUser(null);

    setIsAuthenticated(false);

    window.location.href = "/";
  };

  // =========================
  // Update User
  // =========================
  const updateUser = (updatedUserData) => {
    const newUserData = {
      ...user,
      ...updatedUserData,
    };

    localStorage.setItem(
      "user",
      JSON.stringify(newUserData)
    );

    try {
      const statsStr = localStorage.getItem("cleverprep_focus_stats");
      let statsObj = statsStr ? JSON.parse(statsStr) : {};
      statsObj.currentStreak = newUserData.currentStreak || 0;
      statsObj.longestStreak = newUserData.longestStreak || 0;
      if (newUserData.lastStudyDate) {
        statsObj.lastActiveDate = newUserData.lastStudyDate;
      }
      localStorage.setItem("cleverprep_focus_stats", JSON.stringify(statsObj));
    } catch (e) {
      console.error("[Auth Context] Local stats sync failed on updateUser:", e);
    }

    setUser(newUserData);
  };

  const recordStreak = async () => {
    try {
      const todayStr = new Date().toLocaleDateString("en-CA");
      const res = await recordStudyStreak(todayStr);
      if (res && res.success && res.data) {
        updateUser({
          currentStreak: res.data.currentStreak,
          longestStreak: res.data.longestStreak,
          lastStudyDate: res.data.lastStudyDate,
          totalStudyDays: res.data.totalStudyDays
        });
      }
    } catch (e) {
      console.warn("[Auth Context] Failed to record study streak:", e);
    }
  };

  // =========================
  // Context Values
  // =========================
  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    updateUser,
    checkAuthStatus,
    recordStreak,
  };

  // =========================
  // Provider
  // =========================
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};