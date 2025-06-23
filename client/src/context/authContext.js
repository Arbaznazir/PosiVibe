import axios from "axios";
import { createContext, useEffect, useState } from "react";
import { toast } from "react-hot-toast";

export const AuthContext = createContext();

// Create axios instance with base URL
const api = axios.create({
  baseURL: "http://localhost:8800/api",
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
  const [currentUser, setCurrentUser] = useState(
    JSON.parse(localStorage.getItem("user")) || null
  );

  const login = async (inputs) => {
    try {
      const res = await api.post("/auth/login", inputs);
      setCurrentUser(res.data);
      localStorage.setItem("user", JSON.stringify(res.data));
      toast.success("Welcome back!");
      // Redirect to app after successful login
      window.location.href = "/app";
    } catch (err) {
      toast.error(err.response?.data?.error || "Login failed");
      throw err;
    }
  };

  const logout = async () => {
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
  };

  const updateCurrentUser = (updatedUserData) => {
    const updatedUser = { ...currentUser, ...updatedUserData };
    setCurrentUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
    console.log("User data updated in context:", updatedUser);
  };

  useEffect(() => {
    const checkTimeLimit = async () => {
      if (!currentUser) return;

      try {
        const res = await api.get("/users/time-limit");

        // Show warning when time is running low
        const remaining = res.data.remaining;
        const HOUR = 60 * 60 * 1000; // 1 hour in milliseconds

        if (remaining <= 0) {
          // Time limit exceeded, logout user
          await logout();
          toast.error("Daily time limit exceeded. Please try again tomorrow.");
        } else if (remaining <= HOUR / 2) {
          // Less than 30 minutes
          toast.error(
            `Only ${res.data.formattedTimeRemaining} remaining today!`
          );
        } else if (remaining <= HOUR) {
          // Less than 1 hour
          toast.warning(`${res.data.formattedTimeRemaining} remaining today`);
        }
      } catch (err) {
        console.error("Time limit check error:", err);
        if (err.response?.status === 403) {
          // Time limit exceeded error from middleware
          await logout();
          toast.error("Daily time limit exceeded. Please try again tomorrow.");
        }
      }
    };

    // Check time limit every minute
    checkTimeLimit(); // Check immediately on mount
    const interval = setInterval(checkTimeLimit, 60000);
    return () => clearInterval(interval);
  }, [currentUser]);

  return (
    <AuthContext.Provider
      value={{ currentUser, login, logout, updateCurrentUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};
