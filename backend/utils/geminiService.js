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


// ================= FLASHCARDS =================

export const generateFlashcards = async (text, count = 10) => {
    const prompt = `Generate exactly ${count} educational flashcards from the following text.

Format each flashcard as:
Q: [Question]
A: [Answer]
D: [easy/medium/hard]

Separate each flashcard with "---"

Text:
${text.substring(0, 15000)}`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt
        });

        const generatedText = response.text;
        const flashcards = [];

        const cards = generatedText.split('---').filter(c => c.trim());

        for (const card of cards) {
            const lines = card.trim().split('\n');

            let question = '';
            let answer = '';
            let difficulty = 'medium';

            for (const line of lines) {
                const trimmed = line.trim();

                if (trimmed.startsWith('Q:')) {
                    question = trimmed.substring(2).trim();
                } else if (trimmed.startsWith('A:')) {
                    answer = trimmed.substring(2).trim();
                } else if (trimmed.startsWith('D:')) {
                    const diff = trimmed.substring(2).trim().toLowerCase();
                    if (['easy', 'medium', 'hard'].includes(diff)) {
                        difficulty = diff;
                    }
                }
            }

            if (question && answer) {
                flashcards.push({ question, answer, difficulty });
            }
        }

        return flashcards.slice(0, count);

    } catch (error) {
        console.error('Error generating flashcards:', error);
        throw new Error('Failed to generate flashcards');
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
            model: "gemini-2.5-flash",
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
            model: "gemini-2.5-flash",
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
            model: "gemini-2.5-flash",
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
            model: "gemini-2.5-flash",
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
            model: "gemini-2.5-flash",
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