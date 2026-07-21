// Study Session Status Lifecycle constants
export const STATUS_IDLE = "idle";
export const STATUS_CREATED = "created";
export const STATUS_RUNNING = "running";
export const STATUS_PAUSED = "paused";
export const STATUS_COMPLETED = "completed";
export const STATUS_CANCELLED = "cancelled";

// Reusable Activity types
export const ACTIVITY_PDF = "Reading PDF";
export const ACTIVITY_NOTES = "Viewing Notes";
export const ACTIVITY_FLASHCARDS = "Reviewing Flashcards";
export const ACTIVITY_QUIZ = "Taking Quiz";
export const ACTIVITY_PODCAST = "Listening Podcast";
export const ACTIVITY_QUICK = "Quick Focus";

// Launch sources tracking
export const SOURCE_DASHBOARD = "dashboard";
export const SOURCE_DOCUMENT = "document";
export const SOURCE_HEADER = "header";

// Static ambient sounds configuration registry
export const AMBIENT_SOUNDS = [
  // Focus Ambience
  { id: "rain", title: "Rainy Window", category: "Focus Ambience", icon: "🌧️", subtitle: "Gentle rain tapping on glass", moods: ["Deep Focus", "Relax"], filePath: "/audio/rain.mp3", loop: true, enabled: true },
  { id: "forest-birds", title: "Forest Retreat", category: "Focus Ambience", icon: "🌲", subtitle: "Rustling leaves and birds", moods: ["Creative", "Relax"], filePath: "/audio/forest.mp3", loop: true, enabled: true },
  { id: "ocean-waves", title: "Ocean Breeze", category: "Focus Ambience", icon: "🌊", subtitle: "Rhythmic tides on sandy shore", moods: ["Relax", "Reading"], filePath: "/audio/ocean-waves.mp3", loop: true, enabled: true },
  { id: "night-train", title: "Midnight Express", category: "Focus Ambience", icon: "🚂", subtitle: "Distant metallic hum of a night train", moods: ["Deep Focus", "Relax"], filePath: "/audio/night-train.mp3", loop: true, enabled: true },
  { id: "fireplace", title: "Cozy Fireplace", category: "Focus Ambience", icon: "🔥", subtitle: "Warm wood crackles and glow", moods: ["Relax", "Creative"], filePath: "/audio/fireplace.mp3", loop: true, enabled: true },
  { id: "instrumental-lofi", title: "Piano Dreams", category: "Focus Ambience", icon: "🎵", subtitle: "Calm chord progressions and keys", moods: ["Creative", "Reading"], filePath: "/audio/instrumental-lofi.mp3", loop: true, enabled: true },
  { id: "lofi-beats", title: "Lo-fi Beats", category: "Focus Ambience", icon: "🎧", subtitle: "Relaxed study beat rhythms", moods: ["Creative", "Reading"], filePath: "/audio/lofi.mp3", loop: true, enabled: true }
];
