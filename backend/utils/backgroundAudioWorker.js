import Podcast from "../models/Podcast.js";
import * as ttsService from "./ttsService.js";
import { withRetry } from "./retryHelper.js";
import path from "path";
import fs from "fs";

export const processPodcastAudio = async (podcastId) => {
    try {
        const podcast = await Podcast.findById(podcastId);
        if (!podcast) return;

        const audioDir = path.join(process.cwd(), 'uploads', 'podcasts');
        if (!fs.existsSync(audioDir)) {
            fs.mkdirSync(audioDir, { recursive: true });
        }

        const teacherVoice = podcast.settings?.teacherVoice || podcast.settings?.voice || 'Sarah';
        const studentVoice = podcast.settings?.studentVoice || 'Female';

        const CONCURRENCY_LIMIT = 2;
        const chaptersToProcess = [];
        for (let i = 0; i < podcast.chapters.length; i++) {
            chaptersToProcess.push(i);
        }

        for (let i = 0; i < chaptersToProcess.length; i += CONCURRENCY_LIMIT) {
            const chunk = chaptersToProcess.slice(i, i + CONCURRENCY_LIMIT);
            
            await Promise.all(chunk.map(async (index) => {
                try {
                    await Podcast.updateOne(
                        { _id: podcast._id },
                        { $set: { [`audioStatus.${index}`]: 'generating' } }
                    );

                    const chapter = podcast.chapters[index];
                    const accent = podcast.settings?.accent || 'Indian';
                    const language = podcast.settings?.language || 'English';
                    const audioFileName = `${podcast._id}_chapter_${index}_${teacherVoice}_${studentVoice}_${accent}_${language}.mp3`;
                    const audioPath = path.join(audioDir, audioFileName);

                    if (!fs.existsSync(audioPath)) {
                        console.log(`[Worker] Starting audio generation for Chapter ${index}`);
                        await ttsService.generateMultiVoiceChapterAudio(
                            chapter.segments, 
                            teacherVoice, 
                            studentVoice, 
                            audioPath,
                            { 
                                podcastId: podcast._id.toString(), 
                                chapterIndex: index,
                                accent: podcast.settings?.accent || 'Indian',
                                language: podcast.settings?.language || 'English'
                            }
                        );
                    }

                    console.log(`[Worker] Successfully generated Chapter ${index}`);
                    await Podcast.updateOne(
                        { _id: podcast._id },
                        { $set: { [`audioStatus.${index}`]: 'ready' } }
                    );
                    
                } catch (err) {
                    console.error(`[Worker] Failed to generate audio for Chapter ${index}:`, err.message);
                    await Podcast.updateOne(
                        { _id: podcast._id },
                        { $set: { [`audioStatus.${index}`]: 'failed' } }
                    );
                }
            }));
        }
        
    } catch (error) {
        console.error("Background Audio Worker Error:", error);
    }
};
