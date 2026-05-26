import express from 'express';
import { getDashboard } from '../controllers/progressController.js';
import protect from '../middleware/auth.js';

const router = express.Router();

// Protect all routes
router.use(protect);

// Dashboard route
router.get('/dashboard', getDashboard);

export default router;