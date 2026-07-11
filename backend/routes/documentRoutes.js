import express from 'express'
import { uploadDocument, getDocuments, getDocument, deleteDocument, updateDocument, streamDocumentFile } from '../controllers/documentController.js';
import protect from '../middleware/auth.js';
import upload from '../config/multer.js'

const router = express.Router()
router.use(protect);
router.post('/upload', upload.single('file'), uploadDocument);
router.get('/', getDocuments);
router.get('/:id/file', streamDocumentFile);
router.get('/:id', getDocument);
router.delete('/:id', deleteDocument);


export default router;