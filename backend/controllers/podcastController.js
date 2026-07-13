import Document from "../models/Document.js";
import Podcast from "../models/Podcast.js";
import * as geminiService from "../utils/geminiService.js";
import * as ttsService from "../utils/ttsService.js";
import fs from 'fs';
import path from 'path';
import { isValidDisplayName } from '../utils/nameValidation.js';



// Helper to get a natural display name
function getDisplayName(user) {
    if (user?.fullName && isValidDisplayName(user.fullName.split(" ")[0]))
        return user.fullName.split(" ")[0];

    if (user?.firstName && isValidDisplayName(user.firstName))
        return user.firstName;

    if (user?.displayName && isValidDisplayName(user.displayName))
        return user.displayName;

    if (user?.username) {
        const username = user.username.trim();
        if (isValidDisplayName(username)) {
            return username.charAt(0).toUpperCase() + username.slice(1);
        }
    }

    return null;
}

import GenerationJob from '../models/GenerationJob.js';
import { withRetry, getErrorCode } from '../utils/retryHelper.js';

// Generate podcast script
export const generatePodcast = async (req, res, next) => {
  try {
    const { documentId, ...requestSettings } = req.body;

    if (!documentId) {
      return res.status(400).json({ success: false, error: "Document ID is required" });
    }

    const job = await GenerationJob.create({
      userId: req.user._id,
      documentId,
      settings: requestSettings,
      status: 'pending',
      progress: 0,
      stepLabel: 'Initializing...'
    });

    // Fire & Forget background worker
    runGenerationPipeline(job._id).catch(err => console.error("Pipeline crash:", err));

    return res.status(201).json({ success: true, jobId: job._id });
  } catch (error) {
    next(error);
  }
};

const runGenerationPipeline = async (jobId) => {
    let job;
    try {
        job = await GenerationJob.findById(jobId);
        if (!job) return;

        const updateJob = async (fields) => {
            Object.assign(job, fields);
            await job.save();
        };

        await updateJob({ status: 'processing', stepLabel: 'Reading document...', progress: 10 });
        
        const document = await Document.findOne({ _id: job.documentId, userId: job.userId });
        if (!document || !document.extractedText) {
            throw new Error('PDF_PARSE_ERROR');
        }

        const userObj = { _id: job.userId }; // Minimal mock if needed, or query User
        const resolvedStudentName = job.settings.preferredStudyName || "Student";
        const settings = {
            ...job.settings,
            studentName: resolvedStudentName,
            documentTitle: document.title || 'Study Material'
        };

        await updateJob({ stepLabel: 'Generating study script...', progress: 30 });

        const scriptJson = await withRetry(
            () => geminiService.generatePodcastScript(document.extractedText, settings),
            3,
            [1000, 2000, 4000],
            async (attempt, max, error) => {
                await updateJob({ 
                    stepLabel: `Retrying AI request (Attempt ${attempt} of ${max})...`,
                    retryCount: job.retryCount + 1
                });
            },
            60000
        );

        if (!scriptJson.chapters || scriptJson.chapters.length === 0) {
            throw new Error('GEMINI_ERROR');
        }

        await updateJob({ stepLabel: 'Saving study session...', progress: 60 });

        // Delete any previous Study Sessions for this document
        await Podcast.deleteMany({ documentId: job.documentId, userId: job.userId });

        const podcast = await Podcast.create({
            userId: job.userId,
            documentId: document._id,
            settings,
            chapters: scriptJson.chapters,
            memoryTricks: scriptJson.memoryTricks || [],
            difficulty: scriptJson.difficulty || 'Intermediate',
            goals: scriptJson.goals || ['Master the core concepts'],
            status: 'ready',
            audioStatus: new Array(scriptJson.chapters.length).fill('queued')
        });

        // Podcast generated successfully, mark job completed immediately
        await updateJob({ 
            status: 'completed', 
            podcastId: podcast._id, 
            stepLabel: 'Study session created successfully. Audio is still being generated.', 
            progress: 100 
        });

        // Send all chapters to background worker
        import('../utils/backgroundAudioWorker.js').then(({ processPodcastAudio }) => {
            processPodcastAudio(podcast._id).catch(err => console.error(err));
        });

    } catch (error) {
        console.error("Pipeline Error:", error);
        if (job) {
            const errorCode = getErrorCode(error);
            const isPartialSuccess = job.podcastId !== null;
            
            job.status = isPartialSuccess ? 'completed' : 'failed';
            job.errorCode = errorCode;
            job.errorMessage = error.message;
            job.stepLabel = isPartialSuccess ? 'Audio partially failed. Opening study session...' : 'We couldn\'t finish generating your study session.';
            await job.save();
            
            if (isPartialSuccess) {
                // If partial success, background worker might still be able to generate remaining chapters
                import('../utils/backgroundAudioWorker.js').then(({ processPodcastAudio }) => {
                    processPodcastAudio(job.podcastId).catch(err => console.error(err));
                });
            }
        }
    }
};

export const getJob = async (req, res, next) => {
    try {
        const job = await GenerationJob.findOne({ _id: req.params.id, userId: req.user._id });
        if (!job) return res.status(404).json({ success: false, error: "Job not found" });
        return res.status(200).json({ success: true, data: job });
    } catch (error) {
        next(error);
    }
};

export const retryJob = async (req, res, next) => {
    try {
        const job = await GenerationJob.findOne({ _id: req.params.id, userId: req.user._id });
        if (!job) return res.status(404).json({ success: false, error: "Job not found" });
        
        if (job.status === 'completed') {
             return res.status(400).json({ success: false, error: "Job is already completed" });
        }

        job.status = 'pending';
        job.stepLabel = 'Recovering from temporary error...';
        job.retryCount += 1;
        job.errorCode = null;
        job.errorMessage = null;
        await job.save();

        runGenerationPipeline(job._id).catch(console.error);

        return res.status(200).json({ success: true, jobId: job._id });
    } catch (error) {
        next(error);
    }
};

export const getPodcasts = async (req, res, next) => {
    try {
        const { documentId } = req.params;
        const podcasts = await Podcast.find({ documentId, userId: req.user._id }).sort({ createdAt: -1 });
        
        // Also fetch any failed jobs that don't have a podcastId yet (if they have a podcastId, they're partial successes and the podcast exists)
        const failedJobs = await GenerationJob.find({ 
            documentId, 
            userId: req.user._id, 
            status: 'failed',
            podcastId: null
        }).sort({ createdAt: -1 });
        
        return res.status(200).json({ success: true, data: podcasts, failedJobs });
    } catch (error) {
        next(error);
    }
};

export const getPodcastById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const podcast = await Podcast.findOne({ _id: id, userId: req.user._id });
        if (!podcast) return res.status(404).json({ success: false, error: "Podcast not found" });
        return res.status(200).json({ success: true, data: podcast });
    } catch (error) {
        next(error);
    }
};

export const getChapterAudio = async (req, res, next) => {
    try {
        const { id, chapterIndex } = req.params;
        const podcast = await Podcast.findOne({ _id: id, userId: req.user._id });
        
        if (!podcast) return res.status(404).json({ success: false, error: "Podcast not found" });
        
        const index = parseInt(chapterIndex);
        
        console.log({
            requestedIndex: index,
            totalChapters: podcast.chapters.length,
            chaptersSnapshot: podcast.chapters
        });

        if (isNaN(index) || index < 0 || index >= podcast.chapters.length) {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid chapter index",
                requested: index,
                available: podcast.chapters.length
            });
        }

        const chapter = podcast.chapters[index];
        const audioDir = path.join(process.cwd(), 'uploads', 'podcasts');
        
        if (!fs.existsSync(audioDir)) {
            fs.mkdirSync(audioDir, { recursive: true });
        }

        // Extract voices with backward compatibility
        const teacherVoice = podcast.settings?.teacherVoice || podcast.settings?.voice || 'Sarah';
        const studentVoice = podcast.settings?.studentVoice || 'Female';
        const accent = podcast.settings?.accent || 'Indian';
        const language = podcast.settings?.language || 'English';

        const audioFileName = `${id}_chapter_${index}_${teacherVoice}_${studentVoice}_${accent}_${language}.mp3`;
        const audioPath = path.join(audioDir, audioFileName);

        if (fs.existsSync(audioPath)) {
            res.setHeader('Content-Type', 'audio/mpeg');
            return fs.createReadStream(audioPath).pipe(res);
        }

        // Prevent conflicts if background worker is currently generating this chapter
        if (podcast.audioStatus && podcast.audioStatus[index] === 'generating') {
            return res.status(422).json({ success: false, error: "Audio is still generating in background" });
        }

        // Generate audio via generic TTS Service (fallback)
        try {
            podcast.audioStatus[index] = 'generating';
            podcast.markModified('audioStatus');
            await podcast.save();

            await ttsService.generateMultiVoiceChapterAudio(
                chapter.segments, 
                teacherVoice, 
                studentVoice, 
                audioPath
            );
            
            podcast.audioStatus[index] = 'ready';
            podcast.markModified('audioStatus');
            await podcast.save();

            res.setHeader('Content-Type', 'audio/mpeg');
            return fs.createReadStream(audioPath).pipe(res);
        } catch (ttsErr) {
            console.error("Audio generation failed:", ttsErr);
            podcast.audioStatus[index] = 'failed';
            podcast.markModified('audioStatus');
            await podcast.save();
            return res.status(500).json({ success: false, error: ttsErr.message || "Audio generation failed" });
        }
    } catch (error) {
        next(error);
    }
};

export const addBookmark = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { timestamp, chapterIndex, note } = req.body;

        const podcast = await Podcast.findOneAndUpdate(
            { _id: id, userId: req.user._id },
            { $push: { bookmarks: { timestamp, chapterIndex, note } } },
            { new: true }
        );

        if (!podcast) return res.status(404).json({ success: false, error: "Podcast not found" });
        return res.status(200).json({ success: true, data: podcast });
    } catch (error) {
        next(error);
    }
};

export const saveProgress = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { lastPlayedChapter, lastPlayedPosition } = req.body;

        const podcast = await Podcast.findOneAndUpdate(
            { _id: id, userId: req.user._id },
            { lastPlayedChapter, lastPlayedPosition },
            { new: true }
        );

        if (!podcast) return res.status(404).json({ success: false, error: "Podcast not found" });
        return res.status(200).json({ success: true, data: podcast });
    } catch (error) {
        next(error);
    }
};

export const retryChapterAudio = async (req, res, next) => {
    try {
        const { id, chapterIndex } = req.params;
        const podcast = await Podcast.findOne({ _id: id, userId: req.user._id });
        if (!podcast) return res.status(404).json({ success: false, error: "Podcast not found" });

        const index = parseInt(chapterIndex, 10);
        if (isNaN(index) || index < 0 || index >= podcast.chapters.length) {
            return res.status(400).json({ success: false, error: "Invalid chapter index" });
        }

        // Reset the status to generating so the frontend can update immediately
        podcast.audioStatus[index] = 'generating';
        podcast.markModified('audioStatus');
        await podcast.save();

        // Spawn regeneration in the background
        const teacherVoice = podcast.settings?.teacherVoice || podcast.settings?.voice || 'Sarah';
        const studentVoice = podcast.settings?.studentVoice || 'Female';
        const accent = podcast.settings?.accent || 'Indian';
        const language = podcast.settings?.language || 'English';
        const audioFileName = `${podcast._id}_chapter_${index}_${teacherVoice}_${studentVoice}_${accent}_${language}.mp3`;
        const audioPath = import('path').then(path => path.join(process.cwd(), 'uploads', 'podcasts', audioFileName));
        
        import('../utils/ttsService.js').then(async (ttsService) => {
            const resolvedPath = await audioPath;
            try {
                await ttsService.generateMultiVoiceChapterAudio(
                    podcast.chapters[index].segments, 
                    teacherVoice, 
                    studentVoice, 
                    resolvedPath,
                    { 
                        podcastId: podcast._id.toString(), 
                        chapterIndex: index,
                        accent,
                        language
                    }
                );
                await Podcast.updateOne(
                    { _id: podcast._id },
                    { $set: { [`audioStatus.${index}`]: 'ready' } }
                );
            } catch (err) {
                console.error(`[Retry] Failed to regenerate chapter ${index}:`, err.message);
                await Podcast.updateOne(
                    { _id: podcast._id },
                    { $set: { [`audioStatus.${index}`]: 'failed' } }
                );
            }
        });

        // Return immediately
        return res.status(200).json({ success: true, message: "Regeneration started" });
    } catch (error) {
        console.error("[RetryAudio]", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
