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
  message,
  conversationId = null
) => {
  try {

    const response = await axiosInstance.post(
      API_PATHS.AI.CHAT,
      {
        documentId,
        question: message,
        conversationId,
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
  conversationId
) => {
  try {

    const response = await axiosInstance.get(
      API_PATHS.AI.GET_CHAT_HISTORY(conversationId)
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
// ==========================================
// Get Conversations
// ==========================================
export const getConversations = async (documentId) => {
  try {
    const response = await axiosInstance.get(
      API_PATHS.AI.GET_CONVERSATIONS(documentId)
    );
    return response.data;
  } catch (error) {
    throw (
      error.response?.data || {
        message: "Failed to fetch conversations",
      }
    );
  }
};

// ==========================================
// Delete Conversation
// ==========================================
export const deleteConversation = async (conversationId) => {
  try {
    const response = await axiosInstance.delete(
      API_PATHS.AI.DELETE_CONVERSATION(conversationId)
    );
    return response.data;
  } catch (error) {
    throw (
      error.response?.data || {
        message: "Failed to delete conversation",
      }
    );
  }
};

// ==========================================
// Clear Conversation
// ==========================================
export const clearConversation = async (conversationId) => {
  try {
    const response = await axiosInstance.post(
      API_PATHS.AI.CLEAR_CONVERSATION(conversationId)
    );
    return response.data;
  } catch (error) {
    throw (
      error.response?.data || {
        message: "Failed to clear conversation",
      }
    );
  }
};

// ==========================================
// Rename Conversation
// ==========================================
export const renameConversation = async (conversationId, title) => {
  try {
    const response = await axiosInstance.put(
      API_PATHS.AI.RENAME_CONVERSATION(conversationId),
      { title }
    );
    return response.data;
  } catch (error) {
    throw (
      error.response?.data || {
        message: "Failed to rename conversation",
      }
    );
  }
};

// ==========================================
// Share Conversation
// ==========================================
export const shareConversation = async (conversationId) => {
  try {
    const response = await axiosInstance.post(
      API_PATHS.AI.SHARE_CONVERSATION(conversationId)
    );
    return response.data;
  } catch (error) {
    throw (
      error.response?.data || {
        message: "Failed to share conversation",
      }
    );
  }
};

// ==========================================
// Get Shared Conversation
// ==========================================
export const getSharedConversation = async (shareId) => {
  try {
    const response = await axiosInstance.get(
      API_PATHS.AI.GET_SHARED_CONVERSATION(shareId)
    );
    return response.data;
  } catch (error) {
    throw (
      error.response?.data || {
        message: "Failed to fetch shared conversation",
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
  getConversations,
  deleteConversation,
  clearConversation,
  renameConversation,
  shareConversation,
  getSharedConversation,
};

export default aiService;