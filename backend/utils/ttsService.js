import fs from 'fs';
import path from 'path';
import { EdgeTTS } from 'node-edge-tts';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import { withRetry } from './retryHelper.js';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

// Note: Ensure TTS_PROVIDER is in your .env. Default to 'edge' if not provided.
const TTS_PROVIDER = process.env.TTS_PROVIDER || 'edge';
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || '';

const EDGE_VOICE_IDS = {
  'Sarah': 'en-US-JennyNeural',
  'Alex': 'en-US-GuyNeural',
  'Mentor': 'en-US-AriaNeural',
  'Coach': 'en-US-ChristopherNeural',
  'Student Female': 'en-US-MichelleNeural',
  'Student Male': 'en-US-SteffanNeural'
};

const EDGE_IN_VOICE_IDS = {
  'Sarah': 'en-IN-NeerjaNeural',
  'Alex': 'en-IN-PrabhatNeural',
  'Mentor': 'en-IN-NeerjaNeural',
  'Coach': 'en-IN-PrabhatNeural',
  'Student Female': 'en-IN-NeerjaNeural',
  'Student Male': 'en-IN-PrabhatNeural'
};

const EDGE_GB_VOICE_IDS = {
  'Sarah': 'en-GB-SoniaNeural',
  'Alex': 'en-GB-RyanNeural',
  'Mentor': 'en-GB-LibbyNeural',
  'Coach': 'en-GB-OliverNeural',
  'Student Female': 'en-GB-MaisieNeural',
  'Student Male': 'en-GB-ThomasNeural'
};

const ELEVENLABS_VOICE_IDS = {
  'Sarah': '21m00Tcm4TlvDq8ikWAM', // Rachel
  'Alex': 'pNInz6obpgDQGcFmaJgB',  // Adam
  'Mentor': 'EXAVITQu4vr4xnSDxMaL', // Bella
  'Coach': 'ErXwobaYiN019PkySvjV',  // Antoni
  'Student Female': 'AZnzlk1XvdvUeBnXmlld', // Domi
  'Student Male': 'N2lVS1w7qc0MD573zD4g'   // Clyde
};

const generateElevenLabsAudio = async (text, voiceName, outputPath) => {
    if (!ELEVENLABS_API_KEY) {
        throw new Error("ELEVENLABS_API_KEY is not configured in .env");
    }
    
    const voiceId = ELEVENLABS_VOICE_IDS[voiceName] || ELEVENLABS_VOICE_IDS['Sarah'];

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: text,
        model_id: "eleven_multilingual_v2",
        voice_settings: { stability: 0.5, similarity_boost: 0.75 }
      })
    });

    if (!response.ok) {
        const errText = await response.text();
        let errorMsg = `ElevenLabs API failed with status ${response.status}`;
        try {
            const parsed = JSON.parse(errText);
            // Specifically catch the paid plan requirement
            if (errText.includes('paid_plan_required') || parsed.detail?.status === 'quota_exceeded') {
                errorMsg = "paid_plan_required";
            } else if (parsed.detail?.message) errorMsg = parsed.detail.message;
            else if (typeof parsed.detail === 'string') errorMsg = parsed.detail;
            else if (parsed.message) errorMsg = parsed.message;
        } catch (e) {}
        throw new Error(errorMsg);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    await fs.promises.writeFile(outputPath, buffer);
    return outputPath;
};

const generateEdgeAudio = async (text, voiceName, outputPath, options = {}) => {
    const { accent = 'Indian', language = 'English' } = options;
    
    // Choose appropriate voice ID mapping table based on Accent or Hinglish Language
    let voiceMap = EDGE_VOICE_IDS; // Default is US English
    
    if (accent === 'Indian' || language === 'Hinglish') {
        voiceMap = EDGE_IN_VOICE_IDS;
    } else if (accent === 'UK') {
        voiceMap = EDGE_GB_VOICE_IDS;
    }
    
    const voiceId = voiceMap[voiceName] || voiceMap['Sarah'];
    const isIndian = (accent === 'Indian' || language === 'Hinglish');
    const isUK = (accent === 'UK');

    const tts = new EdgeTTS({
        voice: voiceId,
        lang: isIndian ? 'en-IN' : (isUK ? 'en-GB' : 'en-US'),
        outputFormat: 'audio-24khz-48kbitrate-mono-mp3'
    });
    
    await tts.ttsPromise(text, outputPath);
    return outputPath;
};

export const generateChapterAudio = async (text, voiceName, outputPath, options = {}) => {
    const { accent = 'Indian', language = 'English' } = options;
    console.log(`[TTS] Requested provider: ${TTS_PROVIDER} for voice: ${voiceName} | Accent: ${accent} | Language: ${language}`);

    if (TTS_PROVIDER === 'elevenlabs') {
        try {
            console.log(`[TTS] Generating with ElevenLabs...`);
            return await generateElevenLabsAudio(text, voiceName, outputPath);
        } catch (error) {
            if (error.message.includes('paid_plan_required') || error.message.includes('quota') || error.message.includes('free')) {
                console.warn(`[TTS] ElevenLabs failed with paid plan/quota error. Falling back to edge-tts.`);
                return await generateEdgeAudio(text, voiceName, outputPath, options);
            }
            throw error;
        }
    } else {
        // Default is edge
        try {
            console.log(`[TTS] Generating with Edge TTS...`);
            return await generateEdgeAudio(text, voiceName, outputPath, options);
        } catch (error) {
            console.error(`[TTS] Edge TTS Error:`, error);
            throw error;
        }
    }
};

export const generateMultiVoiceChapterAudio = async (segments, teacherVoiceName, studentGender, outputPath, options = {}) => {
    const { podcastId = 'temp', chapterIndex = '0', accent = 'Indian', language = 'English' } = options;
    console.log(`[TTS] Starting multi-voice generation. Teacher: ${teacherVoiceName}, Student: ${studentGender} | Podcast: ${podcastId} | Chapter: ${chapterIndex}`);
    
    // Map Student Gender to actual voice name
    const studentVoiceName = studentGender === 'Male' ? 'Student Male' : 'Student Female'; 
    const tempDir = path.join(process.cwd(), 'uploads', 'temp');
    
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }

    const tempFiles = [];

    // 1. Preprocess and group segments
    const mergedChunks = [];
    let currentChunk = null;

    for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        const isTeacher = seg.speaker.includes('👩') || !seg.speaker.includes('👤');
        const voice = isTeacher ? teacherVoiceName : studentVoiceName;
        const wordsCount = seg.text.trim().split(/\s+/).length;
        const estimatedDuration = wordsCount / 2.5;

        if (!currentChunk) {
            currentChunk = {
                speaker: seg.speaker,
                voice: voice,
                text: seg.text,
                originalSegmentIndexes: [i],
                segmentCount: 1,
                charCount: seg.text.length,
                estimatedDuration: estimatedDuration,
                isTeacher: isTeacher
            };
        } else {
            const sameSpeaker = currentChunk.voice === voice;
            const underSegLimit = currentChunk.segmentCount < 3;
            const underCharLimit = (currentChunk.charCount + seg.text.length) <= 450;
            const underDurationLimit = (currentChunk.estimatedDuration + estimatedDuration) <= 18;

            if (sameSpeaker && underSegLimit && underCharLimit && underDurationLimit) {
                currentChunk.text += " " + seg.text;
                currentChunk.originalSegmentIndexes.push(i);
                currentChunk.segmentCount += 1;
                currentChunk.charCount += seg.text.length + 1; // +1 for the space
                currentChunk.estimatedDuration += estimatedDuration;
            } else {
                mergedChunks.push(currentChunk);
                currentChunk = {
                    speaker: seg.speaker,
                    voice: voice,
                    text: seg.text,
                    originalSegmentIndexes: [i],
                    segmentCount: 1,
                    charCount: seg.text.length,
                    estimatedDuration: estimatedDuration,
                    isTeacher: isTeacher
                };
            }
        }
    }
    if (currentChunk) {
        mergedChunks.push(currentChunk);
    }

    const reduction = Math.round(((segments.length - mergedChunks.length) / segments.length) * 100) || 0;
    console.log(`[TTS]`);
    console.log(`Original Segments: ${segments.length}`);
    console.log(`Merged Chunks: ${mergedChunks.length}`);
    console.log(`Reduction: ${reduction}%`);

    // 2. Generate chunks with retries and caching
    for (let i = 0; i < mergedChunks.length; i++) {
        const chunk = mergedChunks[i];
        const tempPath = path.join(tempDir, `chunk_${podcastId}_${chapterIndex}_${i}.mp3`);
        
        if (fs.existsSync(tempPath) && fs.statSync(tempPath).size > 0) {
            console.log(`[TTS] Chunk ${i+1}/${mergedChunks.length} already exists. Skipping generation.`);
            tempFiles.push({ path: tempPath, isTeacher: chunk.isTeacher });
            continue;
        }

        console.log(`[TTS] Generating chunk ${i+1}/${mergedChunks.length} | Voice: ${chunk.voice}`);
        
        try {
            await withRetry(
                () => generateChapterAudio(chunk.text, chunk.voice, tempPath, { accent, language }),
                3,
                [1000, 2000, 4000],
                (attempt, max, error) => {
                    console.log(`[Retry] Chunk ${i+1} TTS attempt ${attempt} of ${max} failed: ${error.message}`);
                },
                60000
            );
            tempFiles.push({ path: tempPath, isTeacher: chunk.isTeacher });
        } catch (error) {
            console.error(`[TTS] Failed to generate chunk ${i+1} after all retries.`);
            // Do not delete previously successful chunks here.
            throw error;
        }
    }

    console.log(`[Merge] Merging ${tempFiles.length} chunks...`);

    // Helper to attempt merge
    const attemptFFmpegMerge = (useAlternateStrategy = false) => {
        return new Promise((resolve, reject) => {
            const command = ffmpeg();
            tempFiles.forEach(file => command.input(file.path));

            if (!useAlternateStrategy) {
                // Strategy 1: Complex filter with pacing adjustments
                const filterComplex = tempFiles.map((file, i) => {
                    const tempo = file.isTeacher ? 1.0 : 1.1;
                    return `[${i}:a]atempo=${tempo}[a${i}]`;
                }).join(';');
                const concatStr = tempFiles.map((_, i) => `[a${i}]`).join('');
                
                command
                    .complexFilter([`${filterComplex};${concatStr}concat=n=${tempFiles.length}:v=0:a=1[out]`])
                    .outputOptions(['-map [out]', '-c:a libmp3lame', '-q:a 2']);
            } else {
                // Strategy 2: Simple concat without pacing, more stable for FFmpeg errors
                const concatStr = tempFiles.map((_, i) => `[${i}:a]`).join('');
                command
                    .complexFilter([`${concatStr}concat=n=${tempFiles.length}:v=0:a=1[out]`])
                    .outputOptions(['-map [out]', '-c:a libmp3lame', '-q:a 2']);
            }

            command
                .save(outputPath)
                .on('end', () => resolve(outputPath))
                .on('error', (err) => reject(err));
        });
    };

    const cleanupTempFiles = async () => {
        for (const file of tempFiles) {
            await fs.promises.unlink(file.path).catch(() => {});
        }
    };

    try {
        await attemptFFmpegMerge(false);
        console.log(`[Merge] Strategy 1 (FFmpeg pacing) succeeded.`);
        await cleanupTempFiles();
        console.log(`[TTS] Total API calls saved: ${segments.length - mergedChunks.length}`);
        return outputPath;
    } catch (err1) {
        console.error(`[Merge] Strategy 1 failed:`, err1.message);
        try {
            console.log(`[Merge] Retrying with Strategy 2 (FFmpeg simple concat)...`);
            await attemptFFmpegMerge(true);
            console.log(`[Merge] Strategy 2 succeeded.`);
            await cleanupTempFiles();
            console.log(`[TTS] Total API calls saved: ${segments.length - mergedChunks.length}`);
            return outputPath;
        } catch (err2) {
            console.error(`[Merge] Strategy 2 failed:`, err2.message);
            console.log(`[Merge] Falling back to emergency binary concatenation...`);
            
            try {
                // Emergency Fallback: Raw binary MP3 concat
                if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
                for (const file of tempFiles) {
                    const data = fs.readFileSync(file.path);
                    fs.appendFileSync(outputPath, data);
                }
                console.log(`[Merge] Binary concatenation succeeded as fallback.`);
                await cleanupTempFiles();
                console.log(`[TTS] Total API calls saved: ${segments.length - mergedChunks.length}`);
                return outputPath;
            } catch (err3) {
                console.error(`[Merge] Binary concatenation failed:`, err3.message);
                throw new Error("All FFmpeg and binary merge strategies failed.");
            }
        }
    }
};
