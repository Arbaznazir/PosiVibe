import axios from "axios";

// Function to get the API base URL
function getApiBaseUrl() {
  console.log("Environment API URL:", process.env.REACT_APP_API_BASE_URL);
  
  // 1) Prefer explicit env var (for production or custom dev)
  const fromEnv = process.env.REACT_APP_API_BASE_URL;
  if (fromEnv && typeof fromEnv === "string") {
    const url = fromEnv.endsWith("/") ? fromEnv : `${fromEnv}/`;
    console.log("Using API URL from env:", url);
    return url;
  }

  // 2) Local development fallback
  console.log("Using local development API URL");
  return "http://localhost:8800/api/";
}

export const makeRequest = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
});

// Add token to requests
makeRequest.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (user?.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }

  // For FormData, let the browser set the Content-Type with boundary
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  } else {
    config.headers["Content-Type"] = "application/json";
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
