import mongoose from "mongoose";

const chathistorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    documentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Document",
        required: true,
    },
    title: {
        type: String,
        default: "New Conversation"
    },
    isPublic: {
        type: Boolean,
        default: false
    },
    shareId: {
        type: String,
        default: null
    },
    memorySummary: {
        type: String,
        default: ""
    },
    messages: [{
        role: {
            type: String,
            enum: ["user", "assistant"],
            required: true,
        },
        content: {
            type: String,
            required: true,
        },
        timestamp: {
            type: Date,
            default: Date.now,
        },
        relevantChunks: [{
            type: Number
        }]
    }]
}, {
    timestamps: true
});

chathistorySchema.index({ userId: 1, documentId: 1 });

const ChatHistory = mongoose.model("ChatHistory", chathistorySchema);
export default ChatHistory;
