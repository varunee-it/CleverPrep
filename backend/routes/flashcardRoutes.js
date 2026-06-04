import express from 'express';
import { getFlashcards,
     getFlashcardSets,
      reviewFlashcard,
       toggleStar,
        deleteFlashcardSet } 
        from '../controllers/flashcardController.js';
        import protect from '../middleware/auth.js';

const router = express.Router();
router.use(protect);
router.get('/', getFlashcardSets);
router.get('/:documentId', getFlashcards);
router.patch('/:cardId/review', reviewFlashcard);
router.patch('/:cardId/star', toggleStar);
router.delete('/:flashcardId', deleteFlashcardSet);

export default router;