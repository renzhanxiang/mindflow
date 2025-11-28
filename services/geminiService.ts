import { GoogleGenAI, Type } from "@google/genai";
import { EmotionType } from "../types";

// Helper to convert base64 to strict format if needed, 
// but generateContent accepts standard base64 strings in inlineData.

export const analyzeAudioEntry = async (audioBase64: string): Promise<{ text: string; emotion: EmotionType; tags: string[]; category: string }> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // We want structured JSON output
    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        transcription: { type: Type.STRING, description: "The precise transcription of the audio." },
        emotion: { 
          type: Type.STRING, 
          description: "The dominant emotion of the text. Must be one of: JOY, SADNESS, CALM, ANGRY, EXCITED, ANXIOUS, NEUTRAL." 
        },
        category: {
          type: Type.STRING,
          description: "A high-level category for this thought. Choose the best fit from: Work, Life, Philosophy, Social, Health, Idea."
        },
        tags: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Up to 3 relevant tags based on the content (e.g., Design, Family, Stress)."
        }
      },
      required: ["transcription", "emotion", "category", "tags"]
    };

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "audio/wav", // Assuming recorder creates wav/webm, Gemini handles standard formats well
              data: audioBase64
            }
          },
          {
            text: "Transcribe this audio accurately. Then analyze the content to determine the dominant emotion, a general category (Work, Life, Philosophy, etc), and generate relevant tags."
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });

    const resultText = response.text;
    if (!resultText) throw new Error("No response from AI");

    const parsed = JSON.parse(resultText);
    
    // Map string emotion to Enum, fallback to Neutral
    let emotion = EmotionType.NEUTRAL;
    const upperEmo = parsed.emotion?.toUpperCase();
    if (Object.values(EmotionType).includes(upperEmo as EmotionType)) {
      emotion = upperEmo as EmotionType;
    }

    return {
      text: parsed.transcription,
      emotion: emotion,
      tags: parsed.tags || [],
      category: parsed.category || "Life"
    };

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    // Fallback in case of error
    return {
      text: "Error processing audio. Please try again.",
      emotion: EmotionType.NEUTRAL,
      tags: ["Error"],
      category: "Uncategorized"
    };
  }
};