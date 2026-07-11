import mongoose from "mongoose";

const generationJobSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  documentId: { type: mongoose.Schema.Types.ObjectId, ref: "Document", required: true },
  podcastId: { type: mongoose.Schema.Types.ObjectId, ref: "Podcast", default: null }, // Nullable until created
  settings: { type: Object, required: true }, // Store settings for retries
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'retrying', 'completed', 'failed'], 
    default: 'pending' 
  },
  progress: { type: Number, default: 0 },
  stepLabel: { type: String, default: "Initializing..." },
  retryCount: { type: Number, default: 0 },
  errorCode: { 
    type: String, 
    enum: [null, 'API_TIMEOUT', 'API_RATE_LIMIT', 'GEMINI_ERROR', 'TTS_ERROR', 'DATABASE_ERROR', 'PDF_PARSE_ERROR', 'UNKNOWN_ERROR'], 
    default: null 
  },
  errorMessage: { type: String, default: null }
}, { timestamps: true });

export default mongoose.model("GenerationJob", generationJobSchema);
