import Quiz from "../models/Quize.js";

// ==============================
// @desc    Get all quizzes
// @route   GET /api/quizzes/:documentId
// @access  Private
// ==============================
export const getQuizzes = async (req, res, next) => {
  try {
    const quizzes = await Quiz.find({
      userId: req.user._id,
      documentId: req.params.documentId,
    })
      .populate("documentId", "title fileName")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: quizzes.length,
      data: quizzes,
    });
  } catch (error) {
    next(error);
  }
};

// ==============================
// @desc    Get single quiz
// @route   GET /api/quizzes/quiz/:id
// @access  Private
// ==============================
export const getQuizById = async (req, res, next) => {
  try {
    const quiz = await Quiz.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: "Quiz not found",
        statusCode: 404,
      });
    }

    res.status(200).json({
      success: true,
      data: quiz,
    });
  } catch (error) {
    next(error);
  }
};

// ==============================
// @desc    Submit quiz answers
// @route   POST /api/quizzes/:id/submit
// @access  Private
// ==============================
export const submitQuiz = async (req, res, next) => {
  try {
    const { answers } = req.body;

    // Validate answers
    if (!Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        error: "Please provide answers array",
        statusCode: 400,
      });
    }

    // Find quiz
    const quiz = await Quiz.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: "Quiz not found",
        statusCode: 404,
      });
    }

    // Prevent resubmission
    if (quiz.completedAt) {
      return res.status(400).json({
        success: false,
        error: "Quiz already completed",
        statusCode: 400,
      });
    }

    let correctCount = 0;
    const userAnswers = [];

    // Check answers
    answers.forEach((answer) => {
      const { questionIndex, selectedAnswer } = answer;

      // Check valid index
      if (questionIndex < quiz.questions.length) {
        const question = quiz.questions[questionIndex];

        const isCorrect =
          question.correctAnswer === selectedAnswer;

        if (isCorrect) {
          correctCount++;
        }

        userAnswers.push({
          questionIndex,
          selectedAnswer,
          isCorrect,
          answeredAt: new Date(),
        });
      }
    });

    // Calculate score
    const score = Math.round(
      (correctCount / quiz.questions.length) * 100
    );

    // Save quiz result
    quiz.userAnswers = userAnswers;
    quiz.score = score;
    quiz.completedAt = new Date();

    await quiz.save();

    // Response
    res.status(200).json({
      success: true,
      data: {
        quizId: quiz._id,
        score,
        correctCount,
        totalQuestions: quiz.totalQuestions,
        percentage: score,
        userAnswers,
      },
      message: "Quiz completed successfully",
    });
  } catch (error) {
    next(error);
  }
};

// ==============================
// @desc    Get quiz results
// @route   GET /api/quizzes/:id/results
// @access  Private
// ==============================
export const getQuizResults = async (req, res, next) => {
  try {
    const quiz = await Quiz.findOne({
      _id: req.params.id,
      userId: req.user._id,
    }).populate("documentId", "title");

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found",
        statusCode: 404,
      });
    }

    // Check completion
    if (!quiz.completedAt) {
      return res.status(400).json({
        success: false,
        message: "Quiz not completed",
        statusCode: 400,
      });
    }

    // Detailed results
    const detailedResults = quiz.questions.map(
      (question, index) => {
        const userAnswer = quiz.userAnswers.find(
          (a) => a.questionIndex === index
        );

        return {
          questionIndex: index,
          question: question.question,
          options: question.options,
          correctAnswer: question.correctAnswer,
          selectedAnswer:
            userAnswer?.selectedAnswer || null,
          isCorrect: userAnswer?.isCorrect || false,
          explanation: question.explanation,
        };
      }
    );

    res.status(200).json({
      success: true,
      data: {
        quiz: {
          id: quiz._id,
          title: quiz.title,
          document: quiz.documentId,
          score: quiz.score,
          totalQuestions: quiz.questions.length,
          completedAt: quiz.completedAt,
        },
        results: detailedResults,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==============================
// @desc    Delete quiz
// @route   DELETE /api/quizzes/:id
// @access  Private
// ==============================
export const deleteQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: "Quiz not found",
        statusCode: 404,
      });
    }

    await quiz.deleteOne();

    res.status(200).json({
      success: true,
      message: "Quiz deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};