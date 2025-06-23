import axios from "axios";

export const makeRequest = axios.create({
  baseURL: "http://localhost:8800/api/",
  withCredentials: true,
});

// Add token to requests
makeRequest.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (user?.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  return config;
});

// Handle response errors
makeRequest.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 403 &&
      error.response?.data?.error === "Daily time limit exceeded"
    ) {
      // Handle time limit exceeded
      const user = JSON.parse(localStorage.getItem("user"));
      if (user) {
        localStorage.removeItem("user");
        window.location.href = "/time-limit";
      }
    }
    return Promise.reject(error);
  }
);
