import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

if (!process.env.GEMINI_API_KEY) {
    console.error('FATAL ERROR: GEMINI_API_KEY is not set');
    process.exit(1);
}

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});


export const generateFlashcards = async (text, countVal = 10, options = {}) => {
    const {
        studyMode = "Balanced Study",
        difficulty = "Intermediate"
    } = options;

    const count = parseInt(countVal) || 10;

    let studyModePrompt = "";
    if (studyMode === "Quick Revision") {
        studyModePrompt = "Focus on the most important, high-level core concepts and definitions.";
    } else if (studyMode === "Deep Learning") {
        studyModePrompt = "Provide deep conceptual questions, theoretical nuances, and detailed facts.";
    } else if (studyMode === "Exam Preparation") {
        studyModePrompt = "Focus on revision-oriented questions, key formulas, exact definitions, and core testable facts.";
    } else {
        studyModePrompt = "Balanced study coverage of the entire document's content.";
    }

    let diffPrompt = "";
    if (difficulty === "Beginner") {
        diffPrompt = "Use simple language, basic definitions, and introductory terminology.";
    } else if (difficulty === "Advanced") {
        diffPrompt = "Use challenging conceptual queries, scenario analysis, and advanced terminology.";
    } else {
        diffPrompt = "Use intermediate standard questions, logical checks, and conceptual application.";
    }

    const docLengthNotice = text.length < 500 
        ? "Quick revision should be sufficient." 
        : text.length > 10000 
            ? "Consider generating additional flashcards or using AI Tutor after completing this set." 
            : "";

    const prompt = `You are a professional educational assistant.
Generate exactly ${count} educational flashcards and study insights from the text below.
You MUST generate exactly ${count} flashcard objects. No duplicate questions are allowed.

Study Settings:
- Study Mode: ${studyMode} (${studyModePrompt})
- Target Difficulty: ${difficulty} (${diffPrompt})

Output Schema (return strictly valid JSON matching this schema):
{
  "insights": {
    "complexity": "Easy" | "Medium" | "Hard" (based on complexity of the source text),
    "estimatedTime": "X-Y minutes" (estimate total revision time, assuming 1.5 minutes per card),
    "recommendedStrategy": "Strategy recommendations (e.g. Review flashcards first, then take the AI Quiz)",
    "confidence": "High" | "Medium" | "Low" (AI confidence that generated cards cover core concepts of the text),
    "docLengthNotice": "${docLengthNotice}"
  },
  "cards": [
    {
      "question": "Question text",
      "answer": "Concise answer text",
      "explanation": "Brief educational context or reasoning explaining the answer",
      "memoryTip": "A mnemonic, key association, or memory helper trick to remember this card",
      "difficulty": "easy" | "medium" | "hard"
    }
  ]
}

Text:
${text.substring(0, 15000)}`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3.1-flash-lite",
            contents: prompt,
            config: {
                responseMimeType: "application/json"
            }
        });

        const parsed = JSON.parse(response.text.trim());
        let cards = parsed.cards || [];
        let insights = parsed.insights || {
            complexity: "Medium",
            estimatedTime: `${Math.round(count * 1.5)} minutes`,
            recommendedStrategy: "Review flashcards first, then take the AI Quiz.",
            confidence: "High",
            docLengthNotice
        };

        if (!insights.docLengthNotice) {
            insights.docLengthNotice = docLengthNotice;
        }

        cards = cards.slice(0, count).map(card => ({
            question: card.question || "Empty Question",
            answer: card.answer || "Empty Answer",
            explanation: card.explanation || "",
            memoryTip: card.memoryTip || "",
            difficulty: card.difficulty || "medium"
        }));

        return {
            insights,
            cards
        };

    } catch (error) {
        console.error('Error generating flashcards:', error);
        return {
            insights: {
                complexity: "Medium",
                estimatedTime: `${Math.round(count * 1.5)} minutes`,
                recommendedStrategy: "Review flashcards first, then take the AI Quiz.",
                confidence: "Medium",
                docLengthNotice
            },
            cards: [
                {
                    question: "Could not generate flashcards successfully. Please try again.",
                    answer: "AI JSON Parse Error",
                    explanation: error.message,
                    memoryTip: "",
                    difficulty: "medium"
                }
            ]
        };
    }
};


// ================= QUIZ =================

// Helper for duplicate detection
const normalizeText = (text) => {
    return text.toLowerCase()
        .replace(/[^\w\s]|_/g, "")
        .replace(/\b(a|an|the|is|are|was|were|what|which|how|why|when|where|who|do|does|did|can|could|would|should|to|of|for|in|on|at|by|with)\b/g, "")
        .replace(/\s+/g, " ")
        .trim();
};

const calculateSimilarity = (text1, text2) => {
    const words1 = normalizeText(text1).split(" ");
    const words2 = normalizeText(text2).split(" ");
    if (words1.length === 0 && words2.length === 0) return 1;
    const set1 = new Set(words1);
    const set2 = new Set(words2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    return union.size === 0 ? 0 : intersection.size / union.size;
};

const validateQuestion = (q) => {
    if (!q.question || q.question.length < 15) return false;
    if (q.question.split(" ").length < 4) return false; // reject very short/trivial questions
    if (!Array.isArray(q.options) || q.options.length !== 4) return false;
    if (!q.explanation || q.explanation.length < 5) return false;
    if (!q.correctAnswer) return false;
    if (q.options.some(opt => !opt || opt.trim().length < 2)) return false;
    
    const lowerOptions = q.options.map(o => o.toLowerCase().trim());
    const uniqueOptions = new Set(lowerOptions);
    if (uniqueOptions.size !== 4) return false;
    
    const qLower = q.question.toLowerCase();
    if (qLower.includes("all of the above") || qLower.includes("none of the above")) return false;
    if (lowerOptions.some(opt => opt.includes("all of the above") || opt.includes("none of the above"))) return false;

    // Validate correctAnswer maps correctly
    let isValidCorrectAnswer = false;
    if (typeof q.correctAnswer === 'string' && q.correctAnswer.startsWith('0')) {
        const idx = parseInt(q.correctAnswer.substring(1)) - 1;
        if (idx >= 0 && idx < 4) isValidCorrectAnswer = true;
    } else {
        isValidCorrectAnswer = q.options.some(opt => opt.trim() === q.correctAnswer.trim());
    }
    
    if (!isValidCorrectAnswer) return false;

    return true;
};

export const generateQuiz = async (text, numQuestions = 5, previousQuestions = []) => {
    const finalQuestions = [];
    let attempts = 0;
    const maxAttempts = 3;
    let totalRejected = 0;

    while (finalQuestions.length < numQuestions && attempts < maxAttempts) {
        attempts++;
        const needed = numQuestions - finalQuestions.length;
        const targetGeneration = Math.min(needed * 2 + 2, 25);
        
        const prompt = `You are a premium EdTech Quiz Generator. Generate exactly ${targetGeneration} highly diverse, conceptual MCQs based on the provided text.

CRITICAL INSTRUCTIONS:
1. DO NOT repeat or slightly reword these previous questions (if any):
${previousQuestions.length > 0 ? previousQuestions.map(q => "- " + q).join('\n') : "None"}

2. MIX QUESTION STYLES: Include conceptual, application-based, scenario-based, reasoning-based, and fill-in-the-gap questions. Avoid mere definition recall.
3. DIFFICULTY DISTRIBUTION: Aim for ~30% Easy (direct recall), ~50% Medium (understanding/application), ~20% Hard (reasoning/scenario logic).
4. DISTRACTORS: Wrong answers must be believable, conceptually close, and reflect common misconceptions. Do NOT use obvious nonsense.
5. CONSTRAINTS: 
   - Ensure exactly ONE correct answer.
   - Do NOT use "All of the above" or "None of the above".
   - Avoid duplicate options.
   - Randomize the placement of the correct option (don't always make Option 1 correct).
   - Ensure broad topic coverage across the text.

Format EXACTLY as:
Q: Question
01: Option 1
02: Option 2
03: Option 3
04: Option 4
C: Correct option
E: Explanation
D: easy/medium/hard

Separate each question block with "---"

Text:
${text.substring(0, 20000)}`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3.1-flash-lite",
            contents: prompt
        });

        if (!response || !response.text) {
            console.error("[QuizGen] Malformed or empty AI response.");
            continue;
        }

        const generatedText = response.text;
        let generatedQuestions = [];

        const blocks = generatedText.split('---').filter(q => q.trim());

        for (const block of blocks) {
            try {
                const lines = block.trim().split('\n');
                let question = '';
                let options = [];
                let correctAnswer = '';
                let explanation = '';
                let difficulty = 'medium';

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed) continue;

                    if (trimmed.startsWith('Q:')) {
                        question = trimmed.substring(2).trim().replace(/\n/g, ' ');
                    } else if (/^0\d:/.test(trimmed)) {
                        options.push(trimmed.substring(3).trim().replace(/\n/g, ' '));
                    } else if (trimmed.startsWith('C:')) {
                        correctAnswer = trimmed.substring(2).trim().replace(/\n/g, ' ');
                    } else if (trimmed.startsWith('E:')) {
                        explanation = trimmed.substring(2).trim().replace(/\n/g, ' ');
                    } else if (trimmed.startsWith('D:')) {
                        const diff = trimmed.substring(2).trim().toLowerCase();
                        if (['easy', 'medium', 'hard'].includes(diff)) difficulty = diff;
                    }
                }

                if (question && options.length === 4 && correctAnswer) {
                    const candidate = {
                        question,
                        options,
                        correctAnswer,
                        explanation: explanation || "Correct answer.",
                        difficulty,
                        generatedAt: new Date(),
                        generationBatch: Date.now()
                    };
                    if (validateQuestion(candidate)) {
                        generatedQuestions.push(candidate);
                    } else {
                        totalRejected++;
                    }
                }
            } catch (err) {
                // Safe parser fallback: ignore malformed block
                totalRejected++;
            }
        }

        for (const candidate of generatedQuestions) {
            let isDuplicate = false;
            let highestSimilarity = 0;

            for (const pastQ of previousQuestions) {
                const sim = calculateSimilarity(candidate.question, pastQ);
                if (sim > highestSimilarity) highestSimilarity = sim;
                if (sim >= 0.70) {
                    isDuplicate = true;
                    break;
                }
            }

            if (!isDuplicate) {
                for (const selected of finalQuestions) {
                    const sim = calculateSimilarity(candidate.question, selected.question);
                    if (sim > highestSimilarity) highestSimilarity = sim;
                    if (sim >= 0.70) {
                        isDuplicate = true;
                        break;
                    }
                }
            }

            if (isDuplicate) {
                totalRejected++;
            } else {
                finalQuestions.push(candidate);
            }

            if (finalQuestions.length >= numQuestions) break;
        }
    } catch (error) {
        console.error('[QuizGen ERROR] Exception during generation attempt:', error);
    }
    }

    if (finalQuestions.length === 0) {
        throw new Error("Failed to generate any valid questions. Please try again.");
    } else if (finalQuestions.length < numQuestions) {
        console.warn(`[QuizGen] Partial quiz generated: ${finalQuestions.length}/${numQuestions}`);
    }

    console.log(`[QuizGen] Final Selected: ${finalQuestions.length}/${numQuestions}. Total Rejected: ${totalRejected}.`);

    return finalQuestions.slice(0, numQuestions);
};


// ================= SUMMARY =================

export const generateSummary = async (text) => {
    const prompt = `Summarize the following text clearly:

${text.substring(0, 20000)}`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3.1-flash-lite",
            contents: prompt
        });

        if (!response || !response.text) {
            throw new Error("Empty response from Gemini");
        }

        return response.text;

    } catch (error) {
        console.error('Gemini API error:', error);
        throw new Error('Failed to generate summary');
    }
};


// ================= CHAT WITH CONTEXT =================

export const chatWithContext = async (question, chunks, historyMessages = [], memorySummary = "") => {
    const context = chunks
        .map((c, i) => `Chunk ${i + 1}:\n${c.content}`)
        .join('\n\n');

    let historyText = '';
    if (historyMessages && historyMessages.length > 0) {
        historyText = 'Recent Conversation:\n' + historyMessages.map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`).join('\n') + '\n\n';
    }

    let memoryText = '';
    if (memorySummary) {
        memoryText = `Long-Term Memory Summary (Context from older messages):\n${memorySummary}\n\n`;
    }

    const prompt = `Answer based on context, long-term memory, and recent conversation.

Context:
${context}

${memoryText}${historyText}Question:
${question}`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3.1-flash-lite",
            contents: prompt
        });

        return response.text;

    } catch (error) {
        console.error('Chat error:', error);
        throw new Error('Failed to generate answer');
    }
};

// ================= SUMMARIZE MEMORY =================

export const summarizeMemory = async (oldSummary, messages) => {
    const messagesText = messages.map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`).join('\n');
    
    const prompt = `You are a helpful AI memory assistant. 
Your task is to merge the following new conversation messages into the existing memory summary.
Keep it concise, retain important facts, user preferences, learning style, and document context.

Existing Summary:
${oldSummary || "No existing summary."}

New Messages to Summarize:
${messagesText.substring(0, 15000)}

Generate the new merged memory summary:`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3.1-flash-lite",
            contents: prompt
        });

        return response.text;
    } catch (error) {
        console.error('Memory summary error:', error);
        throw new Error('Failed to generate memory summary');
    }
};

// ================= EXPLAIN CONCEPT =================

export const explainConcept = async (concept, context) => {
    const prompt = `Explain "${concept}" clearly with examples.

Context:
${context.substring(0, 10000)}`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3.1-flash-lite",
            contents: prompt
        });

        if (!response || !response.text) {
            throw new Error("Empty response from Gemini");
        }

        return response.text;

    } catch (error) {
        console.error('Explain error:', error);
        throw new Error('Failed to explain concept');
    }
};

// ================= PODCAST SCRIPT =================

export const generatePodcastScript = async (text, settings) => {
    if (!text || typeof text !== "string") {
        throw new Error("Document content is missing.");
    }
    
    if (!settings) {
        throw new Error("Podcast settings are missing.");
    }

    let wordCountTarget = 1500;
    if (settings.length === '5 min') wordCountTarget = 800;
    else if (settings.length === '10 min') wordCountTarget = 1500;
    else if (settings.length === '20 min') wordCountTarget = 3000;
    else if (settings.length === '40 min') wordCountTarget = 6000;

    const studentName = settings.studentName || "Student";
    const documentTitle = settings.documentTitle || "Today's Topic";

    const introGreeting =
        studentName === "Student"
            ? "Hi there! 👋 Ready to start today's study session?"
            : `Hi ${studentName}! 👋 Today we're learning about ${documentTitle}.`;

    const teacherVoice = settings.teacherVoice || settings.voice || 'Sarah';

    const prompt = `You are a Private 1-on-1 human tutor conducting a premium AI Study Session for ONE student named ${studentName}.
Your task is to create a highly structured, engaging, and conversational tutoring script based on the provided text.
IMPORTANT: You are a friendly teacher, NOT a host. This is a private lesson, NOT a broadcast or show.

SETTINGS:
- Student Name: ${studentName}
- Teacher Name (Voice): ${teacherVoice}
- Teacher Personality: ${settings.personality || 'University Professor'}
- Study Mood (Study Mode): ${settings.studyMood || 'Normal Study'}
- Language: ${settings.language || 'English'}
- Accent: ${settings.accent || 'Indian'}
- Target Length: ~${wordCountTarget} words.
- Indian Student Mode: ${settings.indianStudentMode ? 'ENABLED. Explain difficult English words, give Indian context examples (like IIT exams), avoid overly academic vocabulary.' : 'DISABLED.'}
- Explain Difficult Words: ${settings.difficultWords ? 'ENABLED. Explicitly explain complex terms.' : 'DISABLED.'}
- Ask Questions: ${settings.askQuestions ? 'ENABLED. Ask rhetorical questions.' : 'DISABLED.'}

STUDY MOOD (STUDY MODE) INSTRUCTIONS:
${settings.studyMood === 'Exam Tomorrow' ? '- Fast revision. Focus on critical, high-yield exam questions, strict definitions, and quick memory tricks. Cut all the filler discussion. Focus entirely on revision.' : ''}
${settings.studyMood === 'Deep Learning' ? '- Focus on deep concept building. Explain concepts in great depth. Use elaborate stories and rich analogies. Take the time to build thorough intuition.' : ''}
${settings.studyMood === 'Quick Revision' ? '- Very fast-paced recap of key points. High energy.' : ''}
${settings.studyMood === 'Beginner Mode' ? '- Assume zero prior knowledge. Explain everything like I am 5. Use simple analogies.' : ''}

LANGUAGE & DIALOGUE STYLE INSTRUCTIONS:
${settings.language === 'Hinglish' ? `
- Generates the ENTIRE script conversation naturally in Hinglish (a natural colloquial mix of Hindi and English as commonly spoken by Indian students and college peers).
- Mix English and Hindi exactly how Indian students normally speak. Do NOT simply translate English text into Hindi.
- Keep technical/programming/academic terms (like "Pointers", "Arrays", "Contiguous Memory", "Inheritance", "Garbage Collection") in English. Do NOT translate them.
- Switch natural sentences between English and Hindi.
  Example:
  Instead of: "Pointers store memory addresses."
  Use: "Pointers basically memory address store karte hain. Simple language mein samjho, pointer ek address holder hota hai."
  Example: "Array ka first element yaad hai? Uska address hi pointer ke through access hota hai."
- The script dialogue should read like two real Indian peers talking casually and teaching each other.
` : ''}
${settings.language === 'Simple English' ? `
- The AI teacher and student must use extremely simple, easy vocabulary.
- Avoid academic, dense, or complex words (like "references", "contiguous", "encapsulates").
- Use short sentences. Explain like teaching a absolute beginner or school student.
  Example:
  Instead of: "The pointer references a contiguous memory location."
  Use: "A pointer stores the address of something in memory. Think of it like a house address. It tells the computer where to find the data."
` : ''}

CRITICAL INSTRUCTIONS:

1. ELIMINATE TEXTBOOK LANGUAGE:
   - NEVER simply read the document or give long definitions.
   - Explain concepts using everyday language, stories, and real-world situations BEFORE defining them.

2. NATURAL CONVERSATION (1-3 SENTENCES PER TURN):
   - This is a natural, back-and-forth tutoring session.
   - NO LONG MONOLOGUES. Each dialogue turn MUST contain 1 to 3 short sentences MAXIMUM.
   - The Teacher must ask questions, wait for student responses, give examples, encourage the learner, and use follow-up questions.
   - The Student must ask realistic doubts, interrupt occasionally, request simpler explanations, and say things like: "I didn't understand.", "Can you explain with an example?", "Wait, I'm confused.", "Wait, how does that work?".
   - Alternate speakers naturally: Teacher -> Student -> Teacher -> Student.
   - Use conversational fillers naturally (e.g., "Great question.", "Imagine this.", "Exactly.").

3. TEACHER PERSONALITY:
   - Must follow Teacher Personality "${settings.personality}".
   - Speak like a real human teacher. Start teaching immediately. Be direct and warm.
   - Do NOT welcome them to a show or act like a presenter.

4. STUDENT PERSONALITY:
   - Always use the name "${studentName}" or "You" for the student. NEVER call them "Student".
   - The student MUST interrupt naturally with beginner questions.
   - AVOID repeatedly saying the student's name in every response. Use it ONLY for: greetings, encouragement, congratulations, or important reminders.

5. TEACHING TECHNIQUES:
   - ANALOGIES: Whenever a difficult concept appears, explain it using a familiar analogy (e.g., Inheritance -> Family genetics, Scrum -> Cooking while tasting).
   - COMMON MISTAKES: Occasionally warn students (e.g., "Common Mistake: Many students think X and Y are identical. They are not.").
   - EXAM COACH MOMENTS: Every few minutes, insert an "⭐ Exam Tip" in the dialogue.
   - MEMORY TRICKS: Generate memorable mnemonics naturally.
   - KNOWLEDGE CHECKS: Every few minutes ask a small question. The student answers, and the teacher confirms.

6. CHAPTER STRUCTURE & ENDING:
   - Divide the script into logical chapters.
   - Generate the spoken script as an array of 'segments'. 
   - VERY IMPORTANT: The 'speaker' field MUST be EXACTLY "👩 ${teacherVoice}" or "👤 ${studentName}". NEVER use "HOST" or "Speaker 1".
   - ENDING: The very last Teacher segment of EVERY chapter MUST contain: a quick recap, one memory trick, one exam tip, and one motivational sentence.
   - EXAM BOOSTER & SMART PAUSE: At the end of each chapter, provide a brief summary for the UI and a reflective Smart Pause question.
   - METADATA: Generate 3-4 "goals" for today's lesson, and an overall "difficulty" (Beginner, Intermediate, Advanced).

OUTPUT FORMAT:
Return ONLY valid JSON. Do not include markdown or explanations.
You MUST return valid JSON exactly in this format:
{
  "goals": ["Understand the core concepts of X", "Learn how to apply Y", "Master exam questions on Z"],
  "difficulty": "Intermediate",
  "chapters": [
    {
      "title": "Introduction to ${documentTitle}",
      "duration": "3 min",
      "segments": [
        { "speaker": "👩 ${teacherVoice}", "text": "${introGreeting}" },
        { "speaker": "👤 ${studentName}", "text": "I'm a bit nervous, this looks hard." }
      ],
      "examBooster": {
        "definitions": ["OS: Organizer of System"],
        "faqs": ["Why is OS needed?"],
        "tips": ["Draw the diagram for full marks"],
        "mistakes": ["Mixing up kernel and shell"]
      },
      "smartPause": "Think for 15 seconds. What is the main difference between kernel and shell?"
    }
  ],
  "memoryTricks": [
    "OS -> Organizer of System: Imagine a school principal."
  ]
}

Text:
${text.substring(0, 30000)}`;

    console.log("================ FULL PROMPT SENT TO GEMINI ================\n" + prompt + "\n==========================================================");

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3.1-flash-lite",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
            }
        });

        if (!response || !response.text) {
            throw new Error("Empty response from Gemini");
        }

        console.log("RAW GEMINI RESPONSE:");
        console.log(response.text);

        let rawText = response.text;
        // Strip markdown before JSON.parse()
        rawText = rawText.replace(/^```json\s*/mi, '').replace(/```\s*$/m, '').trim();
        rawText = rawText.replace(/^```\s*/mi, '').replace(/```\s*$/m, '').trim();

        let scriptJson;
        try {
            scriptJson = JSON.parse(rawText);
        } catch (parseError) {
            console.error("JSON Parse Error. Cleaned raw text was:");
            console.log(rawText);
            throw new Error("Podcast generation failed because Gemini returned malformed JSON.");
        }
        
        console.log("PARSED PODCAST:");
        console.log(scriptJson);

        if (!scriptJson.chapters || !Array.isArray(scriptJson.chapters) || scriptJson.chapters.length === 0) {
            throw new Error("Gemini did not generate any chapters.");
        }
        
        return scriptJson;
    } catch (error) {
        console.error('Podcast script error:', error);
        throw error;
    }
};