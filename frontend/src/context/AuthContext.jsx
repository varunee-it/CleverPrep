import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";

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
  // Check Auth On App Load
  // =========================
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // =========================
  // Check Authentication
  // =========================
  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem("token");

      const userStr = localStorage.getItem("user");

      if (token && userStr) {
        const userData = JSON.parse(userStr);

        setUser(userData);

        setIsAuthenticated(true);
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
  // Login
  // =========================
  const login = (userData, token) => {
    localStorage.setItem("token", token);

    localStorage.setItem(
      "user",
      JSON.stringify(userData)
    );

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

    setUser(newUserData);
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