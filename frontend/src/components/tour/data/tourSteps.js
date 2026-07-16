export const tourSteps = [
  {
    title: "Welcome to CleverPrep 🧠",
    content: "CleverPrep is your personal AI study companion. We automatically transform your textbooks, lecture notes, and PDFs into clear notes, flashcard decks, practice tests, and engaging audio summaries.",
    route: "/dashboard",
    targetSelector: null,
    position: "center",
    required: true
  },
  {
    title: "Upload Study Material 📁",
    content: "Every learning path begins here. Uploading study files kicks off the AI processor, which extracts core themes, structures summaries, and initializes your tools.",
    route: "/dashboard",
    targetSelector: ".tour-upload-section",
    position: "bottom",
    required: true
  },
  {
    title: "AI Notes 📝",
    content: "Inside the Study Workspace, our AI processes your document, organizing key themes, definitions, and complex concepts into clear, structured summaries.",
    route: "/documents/:id",
    tab: "Summary",
    targetSelector: ".tour-tab-notes",
    position: "bottom",
    required: true
  },
  {
    title: "AI Quizzes 📝",
    content: "Ready for self-assessment? CleverPrep generates customized mock quizzes directly from your files to test your recall and tracking progress.",
    route: "/documents/:id",
    tab: "Quizzes",
    targetSelector: ".tour-tab-quiz",
    position: "bottom",
    required: true
  },
  {
    title: "Flashcard Decks 🃏",
    content: "Reinforce key terms using interactive flashcards. CleverPrep automatically generates flashcards and uses spaced repetition to strengthen long-term memory.",
    route: "/documents/:id",
    tab: "Flashcards",
    targetSelector: ".tour-tab-flashcards",
    position: "bottom",
    required: true
  },
  {
    title: "AI Podcast Player 🎧",
    content: "Review on the go! Listen to a natural, AI-generated podcast dialogue summarizing your study material, turning study hours into commute revision.",
    route: "/documents/:id",
    tab: "Podcast",
    targetSelector: ".tour-tab-podcast",
    position: "bottom",
    required: false
  },
  {
    title: "Your Library Hub 📚",
    content: "Manage all your documents in your library. You can track study statuses, view document metrics, and create new study workspaces easily.",
    route: "/documents",
    targetSelector: ".tour-sidebar-library",
    position: "right",
    required: false
  },
  {
    title: "Profile & Settings ⚙️",
    content: "Configure personal details, security settings, change themes, toggle automatic feature updates, or replay this guided tour at any time.",
    route: "/profile",
    profileSection: "settings",
    targetSelector: ".tour-sidebar-profile",
    position: "right",
    required: false
  },
  {
    title: "You're Ready to Learn! 🎉",
    content: "You now know the CleverPrep workflow. Let's start learning!",
    route: "/dashboard",
    targetSelector: null,
    position: "center",
    isFinal: true,
    required: true
  }
];
