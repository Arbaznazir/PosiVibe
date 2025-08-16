import axios from "axios";
import { createContext, useEffect, useState, useCallback } from "react";
import { toast } from "react-hot-toast";

export const AuthContext = createContext();

// Function to get the API base URL
function getApiBaseUrl() {
  console.log("Environment API URL in authContext:", process.env.REACT_APP_API_BASE_URL);
  
  // 1) Prefer explicit env var (for production or custom dev)
  const fromEnv = process.env.REACT_APP_API_BASE_URL;
  if (fromEnv && typeof fromEnv === "string") {
    const url = fromEnv.endsWith("/") ? fromEnv : `${fromEnv}/`;
    console.log("Using API URL from env in authContext:", url);
    return url;
  }

  // 2) Local development fallback
  console.log("Using local development API URL in authContext");
  return "http://localhost:8800/api/";
}

// Create axios instance with dynamic base URL
const api = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (user?.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  return config;
});

export const AuthContextProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        // Validate that user has required fields
        if (user && (user.id || user._id) && user.name && user.token) {
          return user;
        } else {
          console.log("Invalid user data in localStorage, clearing...");
          localStorage.removeItem("user");
          return null;
        }
      } catch (error) {
        console.error("Error parsing user data from localStorage:", error);
        localStorage.removeItem("user");
        return null;
      }
    }
    return null;
  });

  const login = async (inputs) => {
    try {
      const res = await api.post("/auth/login", inputs);
      console.log("Login response:", res.data);
      const userData = res.data;
      console.log("Setting user data with isAdmin:", userData.isAdmin);
      setCurrentUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      toast.success("Welcome back!");
      // Redirect to app after successful login
      window.location.href = "/app";
    } catch (err) {
      toast.error(err.response?.data?.error || "Login failed");
      throw err;
    }
  };

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
      setCurrentUser(null);
      localStorage.removeItem("user");
      toast.success("Logged out successfully");
    } catch (err) {
      console.error("Logout error:", err);
      // Still clear local data even if server request fails
      setCurrentUser(null);
      localStorage.removeItem("user");
    }
  }, []);

  const updateCurrentUser = (updatedUserData) => {
    const updatedUser = { ...currentUser, ...updatedUserData };
    setCurrentUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
    console.log("User data updated in context:", updatedUser);
  };

  useEffect(() => {
    const verifyAndCheckTimeLimit = async () => {
      if (!currentUser) return;

      try {
        // First verify that the user still exists
        const verifyRes = await api.get("/users/verify");

        // Update user data if it has changed
        if (verifyRes.data) {
          const freshUserData = { ...verifyRes.data, token: currentUser.token };
          if (JSON.stringify(currentUser) !== JSON.stringify(freshUserData)) {
            console.log("Updating user data with fresh data from server");
            setCurrentUser(freshUserData);
            localStorage.setItem("user", JSON.stringify(freshUserData));
          }
        }

        // Then check time limit
        const timeLimitRes = await api.get("/users/time-limit");

        // Show warning when time is running low
        const remaining = timeLimitRes.data.remaining;
        const HOUR = 60 * 60 * 1000; // 1 hour in milliseconds

        if (remaining <= 0) {
          // Time limit exceeded, logout user
          await logout();
          toast.error("Daily time limit exceeded. Please try again tomorrow.");
        } else if (remaining <= HOUR / 2) {
          // Less than 30 minutes
          toast.error(
            `Only ${timeLimitRes.data.formattedTimeRemaining} remaining today!`
          );
        } else if (remaining <= HOUR) {
          // Less than 1 hour
          toast.warning(
            `${timeLimitRes.data.formattedTimeRemaining} remaining today`
          );
        }
      } catch (err) {
        console.error("User verification or time limit check error:", err);

        if (err.response?.status === 404) {
          // User no longer exists
          console.log("User no longer exists, logging out");
          await logout();
          toast.error("Your account is no longer valid. Please login again.");
        } else if (err.response?.status === 403) {
          // Time limit exceeded error from middleware
          await logout();
          toast.error("Daily time limit exceeded. Please try again tomorrow.");
        }
      }
    };

    // Check immediately on mount
    verifyAndCheckTimeLimit();

    // Check every minute
    const interval = setInterval(verifyAndCheckTimeLimit, 60000);
    return () => clearInterval(interval);
  }, [currentUser, logout]); // Include both currentUser and logout in dependencies

  return (
    <AuthContext.Provider
      value={{ currentUser, login, logout, updateCurrentUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};
