import fs from 'fs';
import path from 'path';

// Note: Ensure ELEVENLABS_API_KEY is in your .env
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || '';

export const generateChapterAudio = async (text, voiceId, outputPath) => {
  if (!process.env.ELEVENLABS_API_KEY) {
      throw new Error("ELEVENLABS_API_KEY is not configured in .env");
  }
  
  try {
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
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      })
    });

    if (!response.ok) {
        const errText = await response.text();
        console.error("ElevenLabs API Error:", errText);
        let errorMsg = `ElevenLabs API failed with status ${response.status}`;
        try {
            const parsed = JSON.parse(errText);
            if (parsed.detail?.message) errorMsg = parsed.detail.message;
            else if (typeof parsed.detail === 'string') errorMsg = parsed.detail;
            else if (parsed.message) errorMsg = parsed.message;
        } catch (e) {
            // Keep status or errText
        }
        throw new Error(errorMsg);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    await fs.promises.writeFile(outputPath, buffer);
    return outputPath;
  } catch (error) {
    console.error("ElevenLabs TTS Error:", error);
    throw new Error("Failed to generate speech via ElevenLabs");
  }
};
