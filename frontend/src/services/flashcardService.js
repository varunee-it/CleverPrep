import axiosInstance from "../utils/axiosInstance";
import { API_PATHS } from "../utils/apiPaths";
import { focusStatsEngine } from "./FocusStatsEngine";

const getAllFlashcardSets = () =>
    axiosInstance.get("/flashcards");

const getFlashcardsForDocument = (documentId) =>
    axiosInstance.get(`/flashcards/${documentId}`);

const toggleStar = (cardId) =>
    axiosInstance.patch(`/flashcards/${cardId}/star`);

const reviewFlashcard = (cardId, index) => {
    try {
        focusStatsEngine.recordActivityStreak();
    } catch (e) {
        console.warn(e);
    }
    return axiosInstance.patch(`/flashcards/${cardId}/review`, {
        index,
    });
};

const deleteFlashcardSet = (id) =>
    axiosInstance.delete(`/flashcards/${id}`);

const saveSessionAnalytics = (setId, data) => {
    try {
        focusStatsEngine.recordActivityStreak();
    } catch (e) {
        console.warn(e);
    }
    return axiosInstance.post(`/flashcards/${setId}/analytics`, data);
};

const flashcardService = {
    getAllFlashcardSets,
    getFlashcardsForDocument,
    toggleStar,
    reviewFlashcard,
    deleteFlashcardSet,
    saveSessionAnalytics,
};

export default flashcardService;