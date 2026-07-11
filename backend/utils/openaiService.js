import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

// Note: Ensure OPENAI_API_KEY is in your .env
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '', 
});

export const generateSpeech = async (text, voice, outputPath) => {
  if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured in .env");
  }
  
  try {
    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: voice, // 'alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'
      input: text,
    });
    
    const buffer = Buffer.from(await mp3.arrayBuffer());
    await fs.promises.writeFile(outputPath, buffer);
    return outputPath;
  } catch (error) {
    console.error("OpenAI TTS Error:", error);
    throw new Error("Failed to generate speech");
  }
};
