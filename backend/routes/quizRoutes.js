import express from 'express';
import {
  getQuizzes,
  getQuizById,
  submitQuiz,
  getQuizResults,
  deleteQuiz,
  resetQuiz
} from '../controllers/quizController.js';

import protect from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Get all quizzes for a document
router.get('/:documentId', getQuizzes);

// Get single quiz by ID
router.get('/quiz/:id', getQuizById);

// Submit quiz answers
router.post('/:id/submit', submitQuiz);

// Get quiz results
router.get('/:id/results', getQuizResults);

// Reset quiz for retaking
router.post('/:id/retake', resetQuiz);

// Delete quiz
router.delete('/:id', deleteQuiz);

export default router;