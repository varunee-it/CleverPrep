import axios from "axios";
import { BASE_URL } from "./apiPaths";
import toast from "react-hot-toast";

let isRedirecting = false;

// ==========================================
// Create Axios Instance
// ==========================================
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 80000,

  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// ==========================================
// Request Interceptor
// Adds JWT token automatically
// ==========================================
axiosInstance.interceptors.request.use(
  (config) => {

    // Get token from localStorage
    const accessToken = localStorage.getItem("token");

    // If token exists add Authorization header
    if (accessToken) {
      config.headers.Authorization =
        `Bearer ${accessToken}`;
    }

    return config;
  },

  (error) => {
    return Promise.reject(error);
  }
);

// ==========================================
// Response Interceptor
// Handles token expiration
// ==========================================

axiosInstance.interceptors.response.use(

  // Success Response
  (response) => {
    return response;
  },

  // Error Response
  (error) => {

    if (error.response?.data?.expired) {
      if (!isRedirecting) {
        isRedirecting = true;
        localStorage.removeItem("token");
        toast.error("Session expired. Please login again.");
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }

    if( error.response) {
      // Internal server error
      if (error.response.status === 500) {

        console.error(
          error.response?.data || error.message || error
        );
      } else {
        console.error(
          error.response?.data || error.message || error
        );
      }

    }

    // Timeout Error
    else if (error.code === "ECONNABORTED") {

      console.error(
        "Request timeout. Please try again."
      );
    } else {
        console.error(
          error.message || error
        );
    }

    return Promise.reject(error);
}
);

// ==========================================
// Export Axios Instance
// ==========================================
export default axiosInstance;