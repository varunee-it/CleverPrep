import axiosInstance from "../utils/axiosInstance";
import { API_PATHS } from "../utils/apiPaths";

const getAllFlashcardSets = () =>
    axiosInstance.get("/flashcards");

const getFlashcardsForDocument = (documentId) =>
    axiosInstance.get(`/flashcards/${documentId}`);

const toggleStar = (cardId) =>
    axiosInstance.patch(`/flashcards/${cardId}/star`);

const reviewFlashcard = (cardId, index) =>
    axiosInstance.patch(`/flashcards/${cardId}/review`, {
        index,
    });

const deleteFlashcardSet = (id) =>
    axiosInstance.delete(`/flashcards/${id}`);

const saveSessionAnalytics = (setId, data) =>
    axiosInstance.post(`/flashcards/${setId}/analytics`, data);

const flashcardService = {
    getAllFlashcardSets,
    getFlashcardsForDocument,
    toggleStar,
    reviewFlashcard,
    deleteFlashcardSet,
    saveSessionAnalytics,
};

export default flashcardService;