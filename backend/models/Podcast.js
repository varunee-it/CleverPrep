import mongoose from "mongoose";

const segmentSchema = new mongoose.Schema({
  speaker: { type: String, required: true },
  text: { type: String, required: true }
});

const chapterSchema = new mongoose.Schema({
  title: { type: String, required: true },
  duration: { type: String }, // e.g., "4 min"
  segments: [segmentSchema],
  examBooster: {
      definitions: [String],
      faqs: [String],
      tips: [String],
      mistakes: [String]
  },
  smartPause: { type: String } // e.g. "Pause for 15 seconds and try explaining inheritance yourself."
});

const podcastSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  documentId: { type: mongoose.Schema.Types.ObjectId, ref: "Document", required: true },
  settings: {
    style: { type: String },
    voice: { type: String }, // Legacy, kept for backward compatibility
    teacherVoice: { type: String },
    studentVoice: { type: String },
    language: { type: String },
    accent: { type: String },
    length: { type: String }, 
    personality: { type: String }, // mood
    studyMood: { type: String },
    indianStudentMode: { type: Boolean, default: false },
    liveCaptions: { type: Boolean, default: true },
    difficultWords: { type: Boolean, default: false },
    askQuestions: { type: Boolean, default: false },
    studentName: { type: String },
    documentTitle: { type: String }
  },
  difficulty: { type: String },
  goals: [String],
  status: { type: String, enum: ['generating_script', 'generating_audio', 'ready', 'failed'], default: 'generating_script' },
  chapters: [chapterSchema],
  audioStatus: [{ type: String, enum: ['queued', 'generating', 'ready', 'failed'] }],
  memoryTricks: [String],
  bookmarks: [{
    timestamp: { type: Number, required: true },
    chapterIndex: { type: Number, required: true },
    note: { type: String }
  }],
  lastPlayedChapter: { type: Number, default: 0 },
  lastPlayedPosition: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model("Podcast", podcastSchema);
