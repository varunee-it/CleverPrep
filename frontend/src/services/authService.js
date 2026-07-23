import axiosInstance from "../utils/axiosInstance";
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
export const getProfile = async (localDate) => {

  try {

    const params = localDate ? { localDate } : {};
    const response =
      await axiosInstance.get(
        API_PATHS.AUTH.GET_PROFILE,
        { params }
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

export const verifyEmail = async (token) => {
  try {
    const response = await axiosInstance.get(API_PATHS.AUTH.VERIFY_EMAIL(token));
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Verification failed." };
  }
};

export const verifyOtp = async (email, otp) => {
  try {
    const response = await axiosInstance.post(API_PATHS.AUTH.VERIFY_OTP, { email, otp });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Verification failed." };
  }
};

export const resendVerification = async (email) => {
  try {
    const response = await axiosInstance.post(API_PATHS.AUTH.RESEND_VERIFICATION, { email });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Resend failed." };
  }
};

export const forgotPassword = async (email) => {
  try {
    const response = await axiosInstance.post(API_PATHS.AUTH.FORGOT_PASSWORD, { email });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Request failed." };
  }
};

export const resetPassword = async (token, password) => {
  try {
    const response = await axiosInstance.post(API_PATHS.AUTH.RESET_PASSWORD, { token, password });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Password reset failed." };
  }
};

export const googleSignIn = async (code) => {
  try {
    const response = await axiosInstance.post(API_PATHS.AUTH.GOOGLE_SIGNIN, { code });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Google authentication failed." };
  }
};

export const checkUsername = async (username) => {
  try {
    const response = await axiosInstance.get(API_PATHS.AUTH.CHECK_USERNAME, {
      params: { username }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Username check failed." };
  }
};

export const uploadAvatar = async (formData) => {
  try {
    const response = await axiosInstance.post(
      API_PATHS.AUTH.UPLOAD_AVATAR,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Upload failed." };
  }
};

export const deleteAvatar = async () => {
  try {
    const response = await axiosInstance.delete(
      API_PATHS.AUTH.DELETE_AVATAR
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Removal failed." };
  }
};

export const deleteAccount = async () => {
  try {
    const response = await axiosInstance.delete(
      API_PATHS.AUTH.DELETE_ACCOUNT
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Account deletion failed." };
  }
};

export const updateOnboarding = async (onboardingData) => {
  try {
    const response = await axiosInstance.put(
      API_PATHS.AUTH.UPDATE_ONBOARDING,
      onboardingData
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to update onboarding." };
  }
};

export const resetOnboarding = async () => {
  try {
    const response = await axiosInstance.post(
      API_PATHS.AUTH.RESET_ONBOARDING
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to reset onboarding." };
  }
};

export const recordStudyStreak = async (localDate) => {
  try {
    const response = await axiosInstance.post("/auth/streak/record", { localDate });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to record study streak" };
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
  verifyEmail,
  verifyOtp,
  resendVerification,
  forgotPassword,
  resetPassword,
  googleSignIn,
  checkUsername,
  uploadAvatar,
  deleteAvatar,
  deleteAccount,
  updateOnboarding,
  resetOnboarding,
  recordStudyStreak,
};

export default authService;