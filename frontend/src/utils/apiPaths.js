export const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5050";

export const API_PATHS = {
  AUTH: {
    REGISTER: "/api/auth/register",
    LOGIN: "/api/auth/login",
    GET_PROFILE: "/api/auth/profile",
    UPDATE_PROFILE: "/api/auth/profile",
    CHANGE_PASSWORD: "/api/auth/change-password",
  },

  DOCUMENTS: {
    UPLOAD: "/api/documents/upload",
    GET_DOCUMENTS: "/api/documents",

    GET_DOCUMENT_BY_ID: (id) =>
      `/api/documents/${id}`,

    UPDATE_DOCUMENT: (id) =>
      `/api/documents/${id}`,

    DELETE_DOCUMENT: (id) =>
      `/api/documents/${id}`,
  },

  AI: {
    GENERATE_FLASHCARDS:
      "/api/ai/generate-flashcards",

    GENERATE_QUIZ:
      "/api/ai/generate-quiz",

    GENERATE_SUMMARY:
      "/api/ai/generate-summary",

    CHAT: "/api/ai/chat",

    EXPLAIN_CONCEPT:
      "/api/ai/explain-concept",

    GET_CHAT_HISTORY: (conversationId) =>
      `/api/ai/chat-history/${conversationId}`,

    GET_CONVERSATIONS: (documentId) => 
      `/api/ai/conversations/${documentId}`,

    DELETE_CONVERSATION: (conversationId) => 
      `/api/ai/conversations/${conversationId}`,

    CLEAR_CONVERSATION: (conversationId) => 
      `/api/ai/conversations/${conversationId}/clear`,

    RENAME_CONVERSATION: (conversationId) => 
      `/api/ai/conversations/${conversationId}/rename`,

    SHARE_CONVERSATION: (conversationId) => 
      `/api/ai/conversations/${conversationId}/share`,

    GET_SHARED_CONVERSATION: (shareId) => 
      `/api/share/${shareId}`,
  },
  // ==========================================
// FLASHCARD ROUTES
// ==========================================
FLASHCARDS: {

  // Get all flashcard sets
  GET_ALL_FLASHCARD_SETS:
    "/api/flashcards",

  // Get flashcards for a specific document
  GET_FLASHCARDS_FOR_DOC: (documentId) =>
    `/api/flashcards/${documentId}`,

  // Review/update flashcard
  REVIEW_FLASHCARD: (cardId) =>
    `/api/flashcards/${cardId}/review`,

  // Toggle star on flashcard
  TOGGLE_STAR: (cardId) =>
    `/api/flashcards/${cardId}/star`,

  // Delete flashcard set
  DELETE_FLASHCARD_SET: (id) =>
    `/api/flashcards/${id}`,
},

// ==========================================
// QUIZ ROUTES
// ==========================================
QUIZZES: {

  // Get quizzes for a document
  GET_QUIZZES_FOR_DOC: (documentId) =>
    `/api/quizzes/${documentId}`,

  // Get single quiz by ID
  GET_QUIZ_BY_ID: (id) =>
    `/api/quizzes/quiz/${id}`,

  // Submit quiz answers
  SUBMIT_QUIZ: (id) =>
    `/api/quizzes/${id}/submit`,

  // Get quiz results
  GET_QUIZ_RESULTS: (id) =>
    `/api/quizzes/${id}/results`,

  // Delete quiz
  DELETE_QUIZ: (id) =>
    `/api/quizzes/${id}`,
},

// ==========================================
// PROGRESS ROUTES
// ==========================================
PROGRESS: {

  // Dashboard statistics
  GET_DASHBOARD:
    "/api/progress/dashboard",
},
};
