import mongoose from "mongoose";

const FlashcardSchema = new mongoose.Schema({
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
    settings: {
        studyMode: { type: String, default: "Balanced Study" },
        flashcardCount: { type: String, default: "10" },
        difficulty: { type: String, default: "Intermediate" },
        includeExplanation: { type: Boolean, default: true },
        includeMemoryTips: { type: Boolean, default: true }
    },
    insights: {
        complexity: { type: String, default: "Medium" },
        estimatedTime: { type: String, default: "10-15 minutes" },
        recommendedStrategy: { type: String, default: "Review flashcards first, then take the AI Quiz." },
        confidence: { type: String, default: "High" },
        docLengthNotice: { type: String, default: "" }
    },
    analytics: [
        {
            studyDuration: Number,
            cardsReviewed: Number,
            cardsBookmarked: Number,
            againCount: Number,
            goodCount: Number,
            easyCount: Number,
            avgResponseTime: Number,
            completedAt: { type: Date, default: Date.now }
        }
    ],
    cards:  [
        {
            question:{type: String, required: true},
            answer:{type: String, required: true},
            explanation: {
                type: String,
                default: ""
            },
            memoryTip: {
                type: String,
                default: ""
            },
            difficulty:{
                type: String,
                enum: ["easy", "medium", "hard"],
                default: "medium"
            },

            lastReviewed: {
                type: Date,
                default: null,
            },
            reviewCount: {
                type: Number,
                default: 0,

            },
            isStarred:{
                type: Boolean,
                default: false
            },
        },
    ],
    
},{ timestamps: true,
});
FlashcardSchema.index({ userId: 1, documentId: 1 });
const Flashcard = mongoose.model("Flashcard", FlashcardSchema);
export default Flashcard;
