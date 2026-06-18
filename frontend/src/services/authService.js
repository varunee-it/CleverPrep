import axiosInstance from "../utils/axioslnstance";
import { API_PATHS } from "../utils/apiPaths.js";

// ==========================================
// Login User
// ==========================================
export const login = async (
  email,
  password
) => {

  try {

    const response =
      await axiosInstance.post(
        API_PATHS.AUTH.LOGIN,
        {
          email,
          password,
        }
      );

    return response.data;

  } catch (error) {

    throw (
      error.response?.data || {
        message: "An unknown error occurred",
      }
    );
  }
};

// ==========================================
// Register User
// ==========================================
export const register = async (
  username,
  email,
  password
) => {

  try {

    const response =
      await axiosInstance.post(
        API_PATHS.AUTH.REGISTER,
        {
          username,
          email,
          password,
        }
      );

    return response.data;

  } catch (error) {

    throw (
      error.response?.data || {
        message: "An unknown error occurred",
      }
    );
  }
};

// ==========================================
// Get User Profile
// ==========================================
export const getProfile = async () => {

  try {

    const response =
      await axiosInstance.get(
        API_PATHS.AUTH.GET_PROFILE
      );

    return response.data;

  } catch (error) {

    throw (
      error.response?.data || {
        message: "An unknown error occurred",
      }
    );
  }
};

// ==========================================
// Update User Profile
// ==========================================
export const updateProfile = async (
  userData
) => {

  try {

    const response =
      await axiosInstance.put(
        API_PATHS.AUTH.UPDATE_PROFILE,
        userData
      );

    return response.data;

  } catch (error) {

    throw (
      error.response?.data || {
        message: "An unknown error occurred",
      }
    );
  }
};

// ==========================================
// Change Password
// ==========================================
export const changePassword = async (
  passwords
) => {

  try {
    console.log("[AuthService] Sending change password request", passwords); // Temp Debug
    const response =
      await axiosInstance.post(
        API_PATHS.AUTH.CHANGE_PASSWORD,
        passwords
      );
    console.log("[AuthService] Response received:", response.data); // Temp Debug
    return response.data;

  } catch (error) {
    console.error("[AuthService] Request failed:", error.response?.data || error); // Temp Debug
    throw (
      error.response?.data || {
        message: "An unknown error occurred",
      }
    );
  }
};

// ==========================================
// Export Auth Service
// ==========================================
const authService = {
  login,
  register,
  getProfile,
  updateProfile,
  changePassword,
};

export default authService;