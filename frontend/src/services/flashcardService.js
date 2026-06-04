import axiosInstance from "../utils/axioslnstance";

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

const flashcardService = {
    getAllFlashcardSets,
    getFlashcardsForDocument,
    toggleStar,
    reviewFlashcard,
    deleteFlashcardSet,
};

export default flashcardService;