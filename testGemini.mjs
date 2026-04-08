import dotenv from 'dotenv';
dotenv.config();

import { GoogleGenAI } from '@google/genai';

async function run() {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: "Hello",
    });
    console.log("Success:", response.text);
  } catch (e) {
    console.error("Error connecting to Gemini:");
    console.error(e);
  }
}

run();
