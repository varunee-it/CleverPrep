import axiosInstance from "../utils/axiosInstance";
import { API_PATHS } from "../utils/apiPaths";

// ==========================================
// Get Dashboard Data
// ==========================================
const getDashboardData = async () => {
  try {
    const response = await axiosInstance.get(
      API_PATHS.PROGRESS.GET_DASHBOARD
    );

    return response.data;
  } catch (error) {
    throw (
      error.response?.data || {
        message: "Failed to fetch dashboard data",
      }
    );
  }
};

// ==========================================
// Export Progress Services
// ==========================================
const progressService = {
  getDashboardData,
};

export default progressService;