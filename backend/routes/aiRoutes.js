import express, { Router } from 'express';
import{
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
    shareConversation
} from '../controllers/aiController.js'
import protect from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.post('/generate-flashcards',generateFlashcards);
router.post('/generate-quiz',generateQuiz);
router.post('/generate-summary',generateSummary);
router.post('/chat',chat);
router.post('/explain-concept',explainConcept);

// Conversation management
router.get('/conversations/:documentId', getConversations);
router.get('/chat-history/:conversationId', getChatHistory); 
router.delete('/conversations/:conversationId', deleteConversation);
router.post('/conversations/:conversationId/clear', clearConversation);
router.put('/conversations/:conversationId/rename', renameConversation);
router.post('/conversations/:conversationId/share', shareConversation);

export default router;