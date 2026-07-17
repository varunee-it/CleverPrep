export const tourSteps = [
  {
    title: "Welcome to CleverPrep 🧠",
    content: "CleverPrep is your personal AI study companion. We automatically transform your textbooks, lecture notes, and PDFs into clear notes, flashcard decks, practice tests, and engaging audio summaries.",
    route: "/dashboard",
    targetSelector: null,
    position: "center"
  },
  {
    title: "Upload Study Material 📁",
    content: "Every learning path begins here. Uploading study files kicks off the AI processor, which extracts core themes, structures summaries, and initializes your tools.",
    route: "/dashboard",
    targetSelector: ".tour-upload-section",
    position: "bottom"
  },
  {
    title: "Your AI Workspace 📝",
    content: "This is where CleverPrep organizes your study materials. AI summaries, interactive quizzes, flashcards, and podcasts are all organized here into workspace tabs.",
    route: "/documents/:id",
    tab: "Summary",
    targetSelector: ".tour-tab-notes",
    position: "bottom"
  },
  {
    title: "Your Library Hub 📚",
    content: "Manage all your documents in your library. Track study statuses, view document metrics, and create new study workspaces easily.",
    route: "/documents",
    targetSelector: ".tour-sidebar-library",
    position: "right"
  },
  {
    title: "Profile & Settings ⚙️",
    content: "Configure personal details, security settings, change themes, or replay this guided tour at any time.",
    route: "/profile",
    targetSelector: ".tour-sidebar-profile",
    position: "right"
  },
  {
    title: "You're Ready to Learn! 🎉",
    content: "You now know the CleverPrep workflow. Let's start learning!",
    route: "/dashboard",
    targetSelector: null,
    position: "center",
    isFinal: true
  }
];
