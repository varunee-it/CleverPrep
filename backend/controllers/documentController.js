import Document from "../models/Document.js";
import Flashcard from "../models/Flashcard.js";
import Quiz from "../models/Quize.js";
import Podcast from "../models/Podcast.js";
import ChatHistory from "../models/ChatHistory.js";
import GenerationJob from "../models/GenerationJob.js";
import { chunkText } from "../utils/textChunker.js";
import { extractTextFromPDF } from "../utils/pdfParser.js";
import { writeToGridFS, deleteFromGridFS, getGridFSBucket } from "../utils/gridfs.js";
import { createReadStream } from "fs";
import fs from "fs/promises";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ================= UPLOAD DOCUMENT ================= */
export const uploadDocument = async (req, res, next) => {
  try {
    console.log("[Document Upload] Starting upload for user:", req.user?._id);
    console.log("[Document Upload] Uploaded file:", req.file ? "Exists" : "Missing");

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No file uploaded",
      });
    }

    const { title } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        error: "Title is required",
      });
    }

    // Save PDF directly in GridFS
    const gridFsFileId = await writeToGridFS(req.file.buffer, req.file.originalname, req.file.mimetype);

    const document = await Document.create({
      userId: req.user._id,
      title,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      gridFsFileId,
      contentType: req.file.mimetype,
      originalFileName: req.file.originalname,
      status: "processing",
    });

    // process PDF async using in-memory buffer
    processPDF(document._id, req.file.buffer).catch((err) => {
      console.error("PDF processing error:", err);
    });

    res.status(201).json({
      success: true,
      message: "Document uploaded successfully",
      data: document,
    });
  } catch (error) {
    console.error("[Document Upload] Error saving document:", error);
    next(error);
  }
};

/* ================= PROCESS PDF ================= */
const processPDF = async (documentId, fileBuffer) => {
  try {
    const { text } = await extractTextFromPDF(fileBuffer);

    const chunks = chunkText(text, 500);

    await Document.findByIdAndUpdate(documentId, {
      extractedText: text,
      chunks,
      status: "ready",
    });

    console.log(`✅ Document ${documentId} processed`);
  } catch (err) {
    console.error(`❌ Error processing document ${documentId}`, err);

    await Document.findByIdAndUpdate(documentId, {
      status: "failed",
    });
  }
};

/* ================= CREATE DOCUMENT ================= */
export const createDocument = async (req, res, next) => {
  try {
    const { title, description, file } = req.body;

    const document = await Document.create({
      title,
      description,
      file,
      userId: req.user._id,
    });

    res.status(201).json({
      success: true,
      data: document,
    });
  } catch (error) {
    next(error);
  }
};

/* ================= GET ALL DOCUMENTS ================= */
export const getDocuments = async (req, res, next) => {
  try {
    const documents = await Document.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(req.user._id),
        },
      },
      {
        $lookup: {
          from: "flashcards",
          localField: "_id",
          foreignField: "documentId",
          as: "flashcards",
        },
      },
      {
        $lookup: {
          from: "quizzes",
          localField: "_id",
          foreignField: "documentId",
          as: "quizzes",
        },
      },
      {
        $addFields: {
          flashcardCount: { $size: "$flashcards" },
          quizCount: { $size: "$quizzes" },
        },
      },
      {
        $project: {
          extractedText: 0,
          chunks: 0,
          flashcards: 0,
          quizzes: 0,
        },
      },
      {
        $sort: { createdAt: -1 },
      },
    ]);

    res.status(200).json({
      success: true,
      count: documents.length,
      data: documents,
    });
  } catch (error) {
    next(error);
  }
};

/* ================= GET SINGLE DOCUMENT ================= */
export const getDocument = async (req, res, next) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: "Document not found",
      });
    }

    const flashcardCount = await Flashcard.countDocuments({
      documentId: document._id,
    });

    const quizCount = await Quiz.countDocuments({
      documentId: document._id,
    });

    document.lastAccessed = Date.now();
    await document.save();

    const docObj = document.toObject();
    docObj.flashcardCount = flashcardCount;
    docObj.quizCount = quizCount;

    res.status(200).json({
      success: true,
      data: docObj,
    });
  } catch (error) {
    next(error);
  }
};

/* ================= DELETE DOCUMENT ================= */
export const deleteDocument = async (req, res, next) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: "Document not found",
      });
    }

    // 1. Delete associated files
    if (document.gridFsFileId) {
      await deleteFromGridFS(document.gridFsFileId).catch((err) => {
        console.error("Failed to delete GridFS document file:", err);
      });
    } else if (document.filePath) {
      const filename = document.filePath.split("/").pop();
      const localPath = path.join(__dirname, "../uploads/documents", filename);
      await fs.unlink(localPath).catch((err) => {
        console.error("Failed to delete local document file:", err);
      });
    }

    // 2. Delete related quizzes
    await Quiz.deleteMany({ documentId: document._id }).catch(err => {
      console.error("Failed to delete related quizzes:", err);
    });

    // 3. Delete related flashcards
    await Flashcard.deleteMany({ documentId: document._id }).catch(err => {
      console.error("Failed to delete related flashcards:", err);
    });

    // 4. Delete related podcasts (and notes/bookmarks inside podcasts)
    await Podcast.deleteMany({ documentId: document._id }).catch(err => {
      console.error("Failed to delete related podcasts:", err);
    });

    // 5. Delete related AI conversations (Chat histories)
    await ChatHistory.deleteMany({ documentId: document._id }).catch(err => {
      console.error("Failed to delete related chat histories:", err);
    });

    // 6. Delete related generation jobs
    await GenerationJob.deleteMany({ documentId: document._id }).catch(err => {
      console.error("Failed to delete related generation jobs:", err);
    });

    // 7. Finally delete the document record
    await document.deleteOne();

    res.status(200).json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

/* ================= STREAM DOCUMENT FILE ================= */
export const streamDocumentFile = async (req, res, next) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: "Document not found",
      });
    }

    if (!document.gridFsFileId) {
      // Try local fallback for legacy documents
      if (document.filePath) {
        try {
          const filename = document.filePath.split("/").pop();
          const localPath = path.join(__dirname, "../uploads/documents", filename);
          await fs.access(localPath);
          res.setHeader("Content-Type", "application/pdf");
          res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(document.fileName || 'document.pdf')}"`);
          const readStream = createReadStream(localPath);
          return readStream.pipe(res);
        } catch (err) {
          console.error("Legacy file access failed:", err);
          res.status(400).setHeader("Content-Type", "text/html");
          return res.send(`
            <html>
              <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background-color: #f8fafc; color: #475569;">
                <div style="text-align: center; padding: 32px; border: 1px solid #e2e8f0; border-radius: 16px; background: white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); max-width: 400px;">
                  <p style="font-size: 20px; font-weight: bold; margin-bottom: 12px; color: #0f172a;">Legacy Storage Document</p>
                  <p style="font-size: 14px; line-height: 1.6; margin: 0;">This document was uploaded before the new storage system. Please re-upload it to view it.</p>
                </div>
              </body>
            </html>
          `);
        }
      }
      res.status(400).setHeader("Content-Type", "text/html");
      return res.send(`
        <html>
          <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background-color: #f8fafc; color: #475569;">
            <div style="text-align: center; padding: 32px; border: 1px solid #e2e8f0; border-radius: 16px; background: white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); max-width: 400px;">
              <p style="font-size: 20px; font-weight: bold; margin-bottom: 12px; color: #0f172a;">Legacy Storage Document</p>
              <p style="font-size: 14px; line-height: 1.6; margin: 0;">This document was uploaded before the new storage system. Please re-upload it to view it.</p>
            </div>
          </body>
        </html>
      `);
    }

    // Set headers
    res.setHeader("Content-Type", document.contentType || "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(document.originalFileName || document.fileName || 'document.pdf')}"`);

    // Stream directly from GridFS
    const bucket = getGridFSBucket();
    const downloadStream = bucket.openDownloadStream(document.gridFsFileId);

    downloadStream.on("error", (err) => {
      console.error("GridFS stream error:", err);
      if (!res.headersSent) {
        res.status(404).json({
          success: false,
          error: "Document file not found in database storage.",
        });
      }
    });

    downloadStream.pipe(res);
  } catch (error) {
    next(error);
  }
};

/* ================= UPDATE DOCUMENT ================= */
export const updateDocument = async (req, res, next) => {
  try {
    const document = await Document.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.status(200).json({
      success: true,
      data: document,
    });
  } catch (error) {
    next(error);
  }
};