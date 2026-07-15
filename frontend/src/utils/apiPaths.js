export const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5050";

export const API_PATHS = {
  AUTH: {
    REGISTER: "/auth/register",
    LOGIN: "/auth/login",
    GET_PROFILE: "/auth/profile",
    UPDATE_PROFILE: "/auth/profile",
    CHANGE_PASSWORD: "/auth/change-password",
    VERIFY_EMAIL: (token) => `/auth/verify-email/${token}`,
    VERIFY_OTP: "/auth/verify-otp",
    RESEND_VERIFICATION: "/auth/resend-verification",
    FORGOT_PASSWORD: "/auth/forgot-password",
    RESET_PASSWORD: "/auth/reset-password",
    GOOGLE_SIGNIN: "/auth/google-signin",
    CHECK_USERNAME: "/auth/check-username",
  },

  DOCUMENTS: {
    UPLOAD: "/documents/upload",
    GET_DOCUMENTS: "/documents",

    GET_DOCUMENT_BY_ID: (id) =>
      `/documents/${id}`,

    UPDATE_DOCUMENT: (id) =>
      `/documents/${id}`,

    DELETE_DOCUMENT: (id) =>
      `/documents/${id}`,
  },

  AI: {
    GENERATE_FLASHCARDS:
      "/ai/generate-flashcards",

    GENERATE_QUIZ:
      "/ai/generate-quiz",

    GENERATE_SUMMARY:
      "/ai/generate-summary",

    CHAT: "/ai/chat",

    EXPLAIN_CONCEPT:
      "/ai/explain-concept",

    GET_CHAT_HISTORY: (conversationId) =>
      `/ai/chat-history/${conversationId}`,

    GET_CONVERSATIONS: (documentId) => 
      `/ai/conversations/${documentId}`,

    DELETE_CONVERSATION: (conversationId) => 
      `/ai/conversations/${conversationId}`,

    CLEAR_CONVERSATION: (conversationId) => 
      `/ai/conversations/${conversationId}/clear`,

    RENAME_CONVERSATION: (conversationId) => 
      `/ai/conversations/${conversationId}/rename`,

    SHARE_CONVERSATION: (conversationId) => 
      `/ai/conversations/${conversationId}/share`,

    GET_SHARED_CONVERSATION: (shareId) => 
      `/share/${shareId}`,
  },
  // ==========================================
// FLASHCARD ROUTES
// ==========================================
FLASHCARDS: {

  // Get all flashcard sets
  GET_ALL_FLASHCARD_SETS:
    "/flashcards",

  // Get flashcards for a specific document
  GET_FLASHCARDS_FOR_DOC: (documentId) =>
    `/flashcards/${documentId}`,

  // Review/update flashcard
  REVIEW_FLASHCARD: (cardId) =>
    `/flashcards/${cardId}/review`,

  // Toggle star on flashcard
  TOGGLE_STAR: (cardId) =>
    `/flashcards/${cardId}/star`,

  // Delete flashcard set
  DELETE_FLASHCARD_SET: (id) =>
    `/flashcards/${id}`,
},

// ==========================================
// QUIZ ROUTES
// ==========================================
QUIZZES: {

  // Get quizzes for a document
  GET_QUIZZES_FOR_DOC: (documentId) =>
    `/quizzes/${documentId}`,

  // Get single quiz by ID
  GET_QUIZ_BY_ID: (id) =>
    `/quizzes/quiz/${id}`,

  // Submit quiz answers
  SUBMIT_QUIZ: (id) =>
    `/quizzes/${id}/submit`,

  // Get quiz results
  GET_QUIZ_RESULTS: (id) =>
    `/quizzes/${id}/results`,

  // Delete quiz
  DELETE_QUIZ: (id) =>
    `/quizzes/${id}`,
},

// ==========================================
// PROGRESS ROUTES
// ==========================================
PROGRESS: {

  // Dashboard statistics
  GET_DASHBOARD:
    "/progress/dashboard",
},
};
