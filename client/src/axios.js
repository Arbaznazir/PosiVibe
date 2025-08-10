import axios from "axios";

// Function to get the API base URL
function getApiBaseUrl() {
  // Try to use the network IP first
  try {
    // If we're on a phone/different device, use the network IP
    if (window.location.hostname !== 'localhost') {
      return `http://${window.location.hostname}:8800/api/`;
    }
  } catch (error) {
    console.error("Error determining API URL:", error);
  }
  
  // Fallback to localhost
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
