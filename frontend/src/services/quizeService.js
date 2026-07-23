import axiosInstance from "../utils/axiosInstance";
import { API_PATHS } from "../utils/apiPaths";
import { focusStatsEngine } from "./FocusStatsEngine";

// ==========================================
// Get Quizzes For Document
// ==========================================
const getQuizzesForDocument = async (documentId) => {
  try {
    const response = await axiosInstance.get(
      API_PATHS.QUIZZES.GET_QUIZZES_FOR_DOC(documentId)
    );

    return response.data;
  } catch (error) {
    throw (
      error.response?.data || {
        message: "Failed to fetch quizzes",
      }
    );
  }
};

// ==========================================
// Get Quiz By ID
// ==========================================
const getQuizById = async (quizId) => {
  try {
    const response = await axiosInstance.get(
      API_PATHS.QUIZZES.GET_QUIZ_BY_ID(quizId)
    );

    return response.data;
  } catch (error) {
    throw (
      error.response?.data || {
        message: "Failed to fetch quiz",
      }
    );
  }
};

// ==========================================
// Submit Quiz
// ==========================================
const submitQuiz = async (quizId, answers) => {
  try {
    const response = await axiosInstance.post(
      API_PATHS.QUIZZES.SUBMIT_QUIZ(quizId),
      {
        answers,
      }
    );

    try {
      focusStatsEngine.recordActivityStreak();
    } catch (e) {
      console.warn("Failed to update activity streak on quiz submit:", e);
    }

    return response.data;
  } catch (error) {
    throw (
      error.response?.data || {
        message: "Failed to submit quiz",
      }
    );
  }
};

// ==========================================
// Get Quiz Results
// ==========================================
const getQuizResults = async (quizId) => {
  try {
    const response = await axiosInstance.get(
      API_PATHS.QUIZZES.GET_QUIZ_RESULTS(quizId)
    );

    return response.data;
  } catch (error) {
    throw {
      status: error.response?.status || 500,
      message: error.response?.data?.message || "Failed to fetch quiz results",
    };
  }
};

// ==========================================
// Delete Quiz
// ==========================================
const deleteQuiz = async (quizId) => {
  try {
    const response = await axiosInstance.delete(
      API_PATHS.QUIZZES.DELETE_QUIZ(quizId)
    );

    return response.data;
  } catch (error) {
    throw (
      error.response?.data || {
        message: "Failed to delete quiz",
      }
    );
  }
};

// ==========================================
// Retake Quiz (Reset answers)
// ==========================================
const retakeQuiz = async (quizId) => {
  try {
    const response = await axiosInstance.post(
      `/quizzes/${quizId}/retake`
    );

    return response.data;
  } catch (error) {
    throw (
      error.response?.data || {
        message: "Failed to reset quiz",
      }
    );
  }
};

// ==========================================
// Export Quiz Services
// ==========================================
const quizService = {
  getQuizzesForDocument,
  getQuizById,
  submitQuiz,
  getQuizResults,
  deleteQuiz,
  retakeQuiz,
};

export default quizService;