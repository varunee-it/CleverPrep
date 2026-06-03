import Document from "../models/Document.js";
import Flashcard from "../models/Flashcard.js";
import Quiz from "../models/Quize.js";
import { chunkText } from "../utils/textChunker.js";
import { extractTextFromPDF } from "../utils/pdfParser.js";
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
      await fs.unlink(req.file.path);
      return res.status(400).json({
        success: false,
        error: "Title is required",
      });
    }

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const fileUrl = `${baseUrl}/uploads/documents/${req.file.filename}`;

    const document = await Document.create({
      userId: req.user._id,
      title,
      fileName: req.file.originalname,
      filePath: fileUrl,
      fileSize: req.file.size,
      status: "processing",
    });

    // process PDF async
    processPDF(document._id, req.file.path).catch((err) => {
      console.error("PDF processing error:", err);
    });

    res.status(201).json({
      success: true,
      message: "Document uploaded successfully",
      data: document,
    });
  } catch (error) {
    console.error("[Document Upload] Error saving document:", error);
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }
    next(error);
  }
};

/* ================= PROCESS PDF ================= */
const processPDF = async (documentId, filePath) => {
  try {
    const { text } = await extractTextFromPDF(filePath);

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

    
    const filename = document.filePath.split("/").pop();
    const localPath = path.join(__dirname, "../uploads/documents", filename);
    await fs.unlink(localPath).catch((err) => {
      console.error("Failed to delete local document file:", err);
    });

    await document.deleteOne();

    res.status(200).json({
      success: true,
      message: "Document deleted successfully",
    });
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