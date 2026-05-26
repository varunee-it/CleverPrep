import mongoose from "mongoose";

const QuizSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    documentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Document",
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    questions: [{
        question: {
            type: String,
            required: true
        },
        options: {
            type: [String],
            required: true,
            validate: [
                arr => arr.length === 4,
                "Please provide 4 options"
            ]
        },
        correctAnswer: {
            type: String,
            required: true
        },
        explanation: {
            type: String,
            default: "No explanation"
        }
    }],
    userAnswers: [{
        questionIndex: {
            type: Number,
            required: true
        },
        selectedAnswer: {
            type: String,
            required: true
        },
        isCorrect: {
            type: Boolean,
            default: false
        },
        answeredAt: {
            type: Date,
            default: Date.now
        }
    }],
    score: {
        type: Number,
        default: 0
    },
    totalQuestions: {
        type: Number,
        default: 0
    },
    completedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// ✅ index
QuizSchema.index({ userId: 1, documentId: 1 });

// ✅ model
const Quiz = mongoose.model("Quiz", QuizSchema);

export default Quiz;