 import axiosInstance from "../utils/axioslnstance";
import { API_PATHS } from "../utils/apiPaths";

// ==========================================
// Get All Flashcard Sets
// ==========================================
const getAllFlashcardSets = async () => {
  try {
    const response = await axiosInstance.get(
      API_PATHS.FLASHCARDS.GET_ALL_FLASHCARD_SETS
    );

    return response.data;
  } catch (error) {
    throw (
      error.response?.data || {
        message: "Failed to fetch flashcard sets",
      }
    );
  }
};

// ==========================================
// Get Flashcards For Specific Document
// ==========================================
const getFlashcardsForDocument = async (documentId) => {
  try {
    const response = await axiosInstance.get(
      API_PATHS.FLASHCARDS.GET_FLASHCARDS_FOR_DOC(documentId)
    );

    return response.data;
  } catch (error) {
    throw (
      error.response?.data || {
        message: "Failed to fetch flashcards",
      }
    );
  }
};

// ==========================================
// Review Flashcard
// ==========================================
const reviewFlashcard = async (cardId, cardIndex) => {
  try {
    const response = await axiosInstance.post(
      API_PATHS.FLASHCARDS.REVIEW_FLASHCARD(cardId),
      {
        cardIndex,
      }
    );

    return response.data;
  } catch (error) {
    throw (
      error.response?.data || {
        message: "Failed to review flashcard",
      }
    );
  }
};

// ==========================================
// Toggle Star Flashcard
// ==========================================
const toggleStar = async (cardId) => {
  try {
    const response = await axiosInstance.put(
      API_PATHS.FLASHCARDS.TOGGLE_STAR(cardId)
    );

    return response.data;
  } catch (error) {
    throw (
      error.response?.data || {
        message: "Failed to star flashcard",
      }
    );
  }
};

// ==========================================
// Delete Flashcard Set
// ==========================================
const deleteFlashcardSet = async (id) => {
  try {
    const response = await axiosInstance.delete(
      API_PATHS.FLASHCARDS.DELETE_FLASHCARD_SET(id)
    );

    return response.data;
  } catch (error) {
    throw (
      error.response?.data || {
        message: "Failed to delete flashcards",
      }
    );
  }
};

// ==========================================
// Export All Flashcard Services
// ==========================================
const flashcardService = {
  getAllFlashcardSets,
  getFlashcardsForDocument,
  reviewFlashcard,
  toggleStar,
  deleteFlashcardSet,
};

export default flashcardService;