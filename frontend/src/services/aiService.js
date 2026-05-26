import axiosInstance from "../utils/axioslnstance";
import { API_PATHS } from "../utils/apiPaths";

// ==========================================
// Generate Flashcards
// ==========================================
export const generateFlashcards = async (documentId,
  options = {}
) => {
  try {
    const response = await axiosInstance.post(
      API_PATHS.AI.GENERATE_FLASHCARDS,
      {
        documentId,
        ...options,
      }
    );

    return response.data;

  } catch (error) {

    throw (
      error.response?.data || {
        message: "Failed to generate flashcards",
      }
    );
  }
};

// ==========================================
// Generate Quiz
// ==========================================
export const generateQuiz = async (
  documentId,
  options = {}
) => {
  try {

    const response = await axiosInstance.post(
      API_PATHS.AI.GENERATE_QUIZ,
      {
        documentId,
        ...options,
      }
    );

    return response.data;

  } catch (error) {

    throw (
      error.response?.data || {
        message: "Failed to generate quiz",
      }
    );
  }
};

// ==========================================
// Generate Summary
// ==========================================
export const generateSummary = async (
  documentId
) => {
  try {

    const response = await axiosInstance.post(
      API_PATHS.AI.GENERATE_SUMMARY,
      {
        documentId,
      }
    );

    return response.data?.data;

  } catch (error) {

    throw (
      error.response?.data || {
        message: "Failed to generate summary",
      }
    );
  }
};

// ==========================================
// Chat With AI
// ==========================================
export const chat = async (
  documentId,
  message
) => {
  try {

    const response = await axiosInstance.post(
      API_PATHS.AI.CHAT,
      {
        documentId,
        question: message,
      }
    );

    return response.data;

  } catch (error) {

    throw (
      error.response?.data || {
        message: "Chat request failed",
      }
    );
  }
};

// ==========================================
// Explain Concept
// ==========================================
export const explainConcept = async (
  documentId,
  concept
) => {
  try {

    const response = await axiosInstance.post(
      API_PATHS.AI.EXPLAIN_CONCEPT,
      {
        documentId,
        concept,
      }
    );

    return response.data?.data;

  } catch (error) {

    throw (
      error.response?.data || {
        message: "Failed to explain concept",
      }
    );
  }
};

// ==========================================
// Get Chat History
// ==========================================
export const getChatHistory = async (
  documentId
) => {
  try {

    const response = await axiosInstance.get(
      API_PATHS.AI.GET_CHAT_HISTORY(documentId)
    );

    return response.data;

  } catch (error) {

    throw (
      error.response?.data || {
        message: "Failed to fetch chat history",
      }
    );
  }
};

// ==========================================
// Export All Services
// ==========================================
const aiService = {
  generateFlashcards,
  generateQuiz,
  generateSummary,
  chat,
  explainConcept,
  getChatHistory,
};

export default aiService;