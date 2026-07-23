import Document from '../models/Document.js';
import Flashcard from '../models/Flashcard.js';
import Quiz from '../models/Quize.js';

// =======================================
// @desc    Get user learning statistics
// @route   GET /api/progress/dashboard
// @access  Private
// =======================================
export const getDashboard = async (req, res, next) => {
  try {
    console.log(`[GET /api/progress/dashboard] Fetching dashboard for user: ${req.user?._id}`);
    const userId = req.user._id;

    // =========================
    // Get total counts
    // =========================
    const totalDocuments = await Document.countDocuments({
      userId,
    });

    const totalFlashcardSets =
      await Flashcard.countDocuments({
        userId,
      });

    const totalQuizzes = await Quiz.countDocuments({
      userId,
    });

    const completedQuizzes =
      await Quiz.countDocuments({
        userId,
        completedAt: { $ne: null },
      });

    // =========================
    // Flashcard statistics
    // =========================
    const flashcardSets = await Flashcard.find({
      userId,
    });

    let totalFlashcards = 0;
    let reviewedFlashcards = 0;
    let starredFlashcards = 0;

    flashcardSets.forEach((set) => {
      totalFlashcards += set.cards.length;

      // Reviewed cards
      reviewedFlashcards += set.cards.filter(
        (card) => card.reviewCount > 0
      ).length;

      // Starred cards
      starredFlashcards += set.cards.filter(
        (card) => card.isStarred
      ).length;
    });

    // =========================
    // Quiz statistics
    // =========================
    const quizzes = await Quiz.find({
      userId,
      completedAt: { $ne: null },
    });

    // Calculate average score
    let averageScore =
      quizzes.length > 0
        ? Math.round(
            quizzes.reduce(
              (sum, q) => sum + q.score,
              0
            ) / quizzes.length
          )
        : 0;

    // =========================
    // Recent documents
    // =========================
    const recentDocuments = await Document.find({
      userId,
    })
      .sort({ lastAccessed: -1 })
      .limit(5)
      .select('title lastAccessed');

    // =========================
    // Recent quizzes
    // =========================
    const recentQuizzes = await Quiz.find({
      userId,
    })
      .sort({ completedAt: -1 })
      .limit(5)
      .populate('documentId', 'title')
      .select('title completedAt score');

    // Check decay
    const localDate = req.query.localDate || req.headers['x-local-date'];
    if (localDate && req.user.lastStudyDate) {
      const d1 = new Date(req.user.lastStudyDate);
      const d2 = new Date(localDate);
      const diffTime = d2.getTime() - d1.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 1) {
        req.user.currentStreak = 0;
        await req.user.save();
      }
    }

    // =========================
    // Final response
    // =========================
    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalDocuments,
          totalFlashcardSets,
          totalFlashcards,
          reviewedFlashcards,
          starredFlashcards,
          totalQuizzes,
          completedQuizzes,
          averageScore,
          currentStreak: req.user.currentStreak || 0,
          longestStreak: req.user.longestStreak || 0,
          lastStudyDate: req.user.lastStudyDate || null,
          totalStudyDays: req.user.totalStudyDays || 0
        },

        recentActivity: {
          documents: recentDocuments,
          quizzes: recentQuizzes,
        },
      },
    });
  } catch (error) {
    console.error("[GET /api/progress/dashboard] Dashboard error:", error);
    next(error);
  }
};