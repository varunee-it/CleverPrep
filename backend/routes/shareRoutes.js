import express from 'express';
import { getSharedConversation } from '../controllers/aiController.js';

const router = express.Router();

// Public route - no auth middleware
router.get('/:shareId', getSharedConversation);

export default router;
