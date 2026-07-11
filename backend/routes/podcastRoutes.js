import express from 'express';
import {
    generatePodcast,
    getJob,
    retryJob,
    getPodcasts,
    getPodcastById,
    getChapterAudio,
    retryChapterAudio,
    addBookmark,
    saveProgress
} from '../controllers/podcastController.js';
import protect from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/generate', generatePodcast);
router.get('/jobs/:id', getJob);
router.post('/jobs/:id/retry', retryJob);
router.get('/document/:documentId', getPodcasts);
router.get('/:id', getPodcastById);
router.get('/:id/audio/:chapterIndex', getChapterAudio);
router.post('/:id/audio/:chapterIndex/retry', retryChapterAudio);
router.post('/:id/bookmarks', addBookmark);
router.put('/:id/progress', saveProgress);

export default router;
