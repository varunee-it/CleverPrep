import Document from "../models/Document.js";
import Flashcard from "../models/Flashcard.js";
import Quiz from "../models/Quize.js";
import ChatHistory from "../models/ChatHistory.js";

import * as geminiService from "../utils/geminiService.js";
import { findRelevantChunks } from "../utils/textChunker.js";
import crypto from 'crypto';

/* ================= GENERATE FLASHCARDS ================= */

export const generateFlashcards = async (req, res, next) => {
  try {
    const { documentId, count = 10 } = req.body;

    if (!documentId) {
      return res.status(400).json({
        success: false,
        error: "Document ID is required",
        statusCode: 400,
      });
    }

    const document = await Document.findOne({
      _id: documentId,
      userId: req.user._id,
      status: "ready",
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: "Document not found",
        statusCode: 404,
      });
    }

    const cards = await geminiService.generateFlashcards(
      document.extractedText,
      parseInt(count)
    );

    const flashcardSet = await Flashcard.create({
      documentId,
      userId: req.user._id,
      cards: cards.map((card) => ({
        question: card.question,
        answer: card.answer,
        difficulty: card.difficulty,
        reviewCount: 0,
        isStarred: false,
      })),
    });

    return res.status(201).json({
      success: true,
      data: flashcardSet,
      message: "Flashcards generated successfully",
    });
  } catch (error) {
    next(error);
  }
};

/* ================= GENERATE QUIZ ================= */

export const generateQuiz = async (req, res, next) => {
  try {
    const { documentId, numQuestions = 5, title } = req.body;

    if (!documentId) {
      return res.status(400).json({
        success: false,
        error: "Document ID is required",
        statusCode: 400,
      });
    }

    const document = await Document.findOne({
      _id: documentId,
      userId: req.user._id,
      status: "ready",
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: "Document not found",
        statusCode: 404,
      });
    }

    const questions = await geminiService.generateQuiz(
      document.extractedText,
      parseInt(numQuestions)
    );

    const quiz = await Quiz.create({
      userId: req.user._id,
      documentId: document._id,
      title: title || `${document.title} Quiz`,
      questions,
      totalQuestions: questions.length,
      userAnswers: [],
      score: 0,
    });

    return res.status(201).json({
      success: true,
      data: quiz,
      message: "Quiz generated successfully",
    });
  } catch (error) {
    next(error);
  }
};

/* ================= GENERATE SUMMARY ================= */

export const generateSummary = async (req, res, next) => {
  try {
    const { documentId } = req.body;
    console.log("Authenticated user:", req.user?._id);
    console.log("Generate summary request:", req.body);

    if (!documentId) {
      return res.status(400).json({
        success: false,
        message: "Document ID is required",
      });
    }

    const document = await Document.findById(documentId);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    console.log("Calling Gemini...");
    const summary = await geminiService.generateSummary(
      document.extractedText
    );

    return res.status(200).json({
      success: true,
      data: {
        documentId: document._id,
        title: document.title,
        summary,
      },
      message: "Summary generated successfully",
    });
  } catch (error) {
    console.error("Generate Summary Error:", error);
    return res.status(500).json({
        success: false,
        message: error.message || "AI request failed"
    });
  }
};

/* ================= CHAT ================= */

export const chat = async (req, res, next) => {
  try {
    const { documentId, question, conversationId } = req.body;

    if (!documentId || !question) {
      return res.status(400).json({
        success: false,
        error: "Document ID and question are required",
        statusCode: 400,
      });
    }

    const document = await Document.findOne({
      _id: documentId,
      userId: req.user._id,
      status: "ready",
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: "Document not found",
        statusCode: 404,
      });
    }

    const relevantChunks = findRelevantChunks(
      document.chunks,
      question,
      3
    );

    const chunkIndices = relevantChunks.map(
      (chunk) => chunk.chunkIndex
    );

    let history;
    if (conversationId) {
      history = await ChatHistory.findOne({
        _id: conversationId,
        userId: req.user._id,
      });
      if (!history) {
        return res.status(404).json({
          success: false,
          error: "Conversation not found",
        });
      }
    } else {
      // Auto-generate title from first prompt
      const title = question.length > 40 ? question.substring(0, 37) + '...' : question;
      history = await ChatHistory.create({
        userId: req.user._id,
        documentId: document._id,
        title,
        messages: [],
      });
    }

    const recentMessages = history.messages.slice(-15);

    const answer = await geminiService.chatWithContext(
      question,
      relevantChunks,
      recentMessages,
      history.memorySummary
    );

    history.messages.push(
      {
        role: "user",
        content: question,
        timestamp: new Date(),
        relevantChunks: [],
      },
      {
        role: "assistant",
        content: answer,
        timestamp: new Date(),
        relevantChunks: chunkIndices,
      }
    );

    // Context Optimization Summarization (Background)
    if (history.messages.length > 20 && history.messages.length % 20 === 0) {
      const messagesToSummarize = history.messages.slice(0, -10); // exclude latest 10
      geminiService.summarizeMemory(history.memorySummary, messagesToSummarize)
        .then(async (newSummary) => {
          history.memorySummary = newSummary;
          await history.save();
        })
        .catch(err => console.error("Memory summary failed:", err));
    } else {
      await history.save();
    }

    return res.status(200).json({
      success: true,
      data: {
        question,
        answer,
        relevantChunks: chunkIndices,
        chatHistoryId: history._id,
        title: history.title
      },
      message: "Response generated successfully",
    });
  } catch (error) {
    next(error);
  }
};

/* ================= EXPLAIN CONCEPT ================= */

export const explainConcept = async (req, res, next) => {
  try {
    const { documentId, concept } = req.body;
    console.log("Authenticated user:", req.user?._id);
    console.log("Explain concept request:", req.body);

    if (!documentId) {
      return res.status(400).json({
        success: false,
        message: "Document ID is required",
      });
    }

    if (!concept?.trim()) {
        return res.status(400).json({
            success: false,
            message: "Concept is required"
        });
    }

    const document = await Document.findById(documentId);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    const relevantChunks = findRelevantChunks(
      document.chunks,
      concept,
      3
    );

    const context = relevantChunks
      .map((chunk) => chunk.content)
      .join("\n\n");

    console.log("Calling Gemini...");
    const explanation = await geminiService.explainConcept(
      concept,
      context
    );

    return res.status(200).json({
      success: true,
      data: {
        concept,
        explanation,
        relevantChunks: relevantChunks.map(
          (chunk) => chunk.chunkIndex
        ),
      },
      message: "Explanation generated successfully",
    });
  } catch (error) {
    console.error("Explain Concept Error:", error);
    return res.status(500).json({
        success: false,
        message: error.message || "AI request failed"
    });
  }
};

/* ================= GET CHAT HISTORY ================= */

export const getChatHistory = async (req, res, next) => {
  try {
    const { conversationId } = req.params;

    if (!conversationId) {
      return res.status(400).json({
        success: false,
        error: "Conversation ID is required",
        statusCode: 400,
      });
    }

    const history = await ChatHistory.findOne({
      _id: conversationId,
      userId: req.user._id,
    }).select("messages title");

    if (!history) {
      return res.status(200).json({
        success: true,
        data: [],
        message: "No chat history found",
      });
    }

    return res.status(200).json({
      success: true,
      data: history.messages,
      message: "Chat history retrieved successfully",
    });
  } catch (error) {
    next(error);
  }
};

/* ================= CONVERSATION MANAGEMENT ================= */

export const getConversations = async (req, res, next) => {
  try {
    const { documentId } = req.params;
    
    if (!documentId) {
      return res.status(400).json({
        success: false,
        error: "Document ID is required",
        statusCode: 400,
      });
    }

    const conversations = await ChatHistory.find({
      userId: req.user._id,
      documentId,
    })
    .select("_id title updatedAt")
    .sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      data: conversations,
      message: "Conversations retrieved successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const deleteConversation = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    
    const history = await ChatHistory.findOneAndDelete({
      _id: conversationId,
      userId: req.user._id,
    });

    if (!history) {
      return res.status(404).json({
        success: false,
        error: "Conversation not found",
        statusCode: 404,
      });
    }

    return res.status(200).json({
      success: true,
      data: {},
      message: "Conversation deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const clearConversation = async (req, res, next) => {
  try {
    const { conversationId } = req.params;

    const history = await ChatHistory.findOne({
      _id: conversationId,
      userId: req.user._id,
    });

    if (!history) {
      return res.status(404).json({
        success: false,
        error: "Conversation not found",
        statusCode: 404,
      });
    }

    history.messages = [];
    history.memorySummary = "";
    await history.save();

    return res.status(200).json({
      success: true,
      data: [],
      message: "Conversation cleared successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const renameConversation = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        error: "Title is required"
      });
    }

    const history = await ChatHistory.findOneAndUpdate(
      { _id: conversationId, userId: req.user._id },
      { title },
      { new: true }
    );

    if (!history) {
      return res.status(404).json({ success: false, error: "Conversation not found" });
    }

    return res.status(200).json({
      success: true,
      data: history,
      message: "Conversation renamed"
    });
  } catch (error) {
    next(error);
  }
};

export const shareConversation = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    
    let history = await ChatHistory.findOne({ _id: conversationId, userId: req.user._id });
    
    if (!history) {
      return res.status(404).json({ success: false, error: "Conversation not found" });
    }

    if (!history.shareId) {
      history.shareId = crypto.randomUUID();
      history.isPublic = true;
      await history.save();
    }

    return res.status(200).json({
      success: true,
      data: {
        shareId: history.shareId,
        isPublic: history.isPublic
      },
      message: "Conversation shared"
    });
  } catch (error) {
    next(error);
  }
};

export const getSharedConversation = async (req, res, next) => {
  try {
    const { shareId } = req.params;

    // No userId filter needed because it's public, but verify it exists
    const history = await ChatHistory.findOne({ shareId, isPublic: true })
      .select("messages title updatedAt")
      .lean();

    if (!history) {
      return res.status(404).json({ success: false, error: "Shared conversation not found or is private" });
    }

    return res.status(200).json({
      success: true,
      data: history
    });
  } catch (error) {
    next(error);
  }
};