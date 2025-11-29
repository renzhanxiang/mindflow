import { GoogleGenAI, Type } from "@google/genai";
import { EmotionType, Language } from "../types";

export const analyzeAudioEntry = async (audioBase64: string, language: Language = Language.EN): Promise<{ text: string; emotion: EmotionType; tags: string[]; category: string }> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
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
          description: "Up to 3 relevant tags based on the content."
        }
      },
      required: ["transcription", "emotion", "category", "tags"]
    };

    // Prompt instructions based on language
    const langInstruction = language === Language.ZH 
      ? "Transcribe the audio accurately (if Chinese, use Simplified Chinese). Output tags and category in Simplified Chinese." 
      : "Transcribe the audio accurately in English. Output tags and category in English.";

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "audio/webm",
              data: audioBase64
            }
          },
          {
            text: `${langInstruction} Analyze the content to determine the dominant emotion, a general category, and generate relevant tags.`
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
    
    let emotion = EmotionType.NEUTRAL;
    const upperEmo = parsed.emotion?.toUpperCase();
    if (Object.values(EmotionType).includes(upperEmo as EmotionType)) {
      emotion = upperEmo as EmotionType;
    }

    return {
      text: parsed.transcription,
      emotion: emotion,
      tags: parsed.tags || [],
      category: parsed.category || (language === Language.ZH ? "生活" : "Life")
    };

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return {
      text: language === Language.ZH ? "录音已保存（AI 处理暂时不可用）" : "Audio recorded (AI processing unavailable). Click to play.",
      emotion: EmotionType.NEUTRAL,
      tags: [language === Language.ZH ? "录音" : "Recording"],
      category: language === Language.ZH ? "未处理" : "Unprocessed"
    };
  }
};

export const analyzeTextEntry = async (text: string, language: Language = Language.EN): Promise<{ emotion: EmotionType; tags: string[]; category: string }> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        emotion: {
          type: Type.STRING,
          description: "The dominant emotion of the text. Must be one of: JOY, SADNESS, CALM, ANGRY, EXCITED, ANXIOUS, NEUTRAL."
        },
        category: {
          type: Type.STRING,
          description: "A high-level category for this thought."
        },
        tags: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Up to 3 relevant tags based on the content."
        }
      },
      required: ["emotion", "category", "tags"]
    };

    const langInstruction = language === Language.ZH 
      ? "Analyze the following text (Simplified Chinese preferred for output tags/category)." 
      : "Analyze the following text (English preferred for output tags/category).";

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            text: `${langInstruction} Determine the dominant emotion, a general category, and generate relevant tags.\n\nText: "${text}"`
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

    let emotion = EmotionType.NEUTRAL;
    const upperEmo = parsed.emotion?.toUpperCase();
    if (Object.values(EmotionType).includes(upperEmo as EmotionType)) {
      emotion = upperEmo as EmotionType;
    }

    return {
      emotion: emotion,
      tags: parsed.tags || [],
      category: parsed.category || (language === Language.ZH ? "生活" : "Life")
    };

  } catch (error) {
    console.error("Gemini Text Analysis Error:", error);
    return {
      emotion: EmotionType.NEUTRAL,
      tags: [language === Language.ZH ? "文本" : "Text"],
      category: language === Language.ZH ? "未处理" : "Unprocessed"
    };
  }
};

export const generateEntryInsight = async (text: string, emotion: string, language: Language = Language.EN): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const systemPrompt = language === Language.ZH 
      ? `你是一个富有同理心、智慧且略带哲学气息的私人日记 AI 助手。
         用户的想法: "${text}"
         用户的情绪: ${emotion}
         任务: 提供一段非常简短（最多2句话）、温暖且有洞察力的反馈，或者一个温和的认知重构问题（CBT 风格），帮助用户获得视角或感到被理解。
         不要以“听起来...”或“我理解...”开头。要直接但亲切。请用简体中文回答。`
      : `You are an empathetic, wise, and slightly philosophical AI assistant for a personal journal app. 
         User's Thought: "${text}"
         User's Emotion: ${emotion}
         Task: Provide a very brief (max 2 sentences), warm, and insightful reflection or a gentle reframing question (CBT style) to help the user gain perspective or feel understood. 
         Do NOT start with "It sounds like..." or "I understand...". Be direct but kind. Respond in English.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          { text: systemPrompt }
        ]
      }
    });

    return response.text || (language === Language.ZH ? "向内探索，答案就在你心中。" : "Keep reflecting, the answers are within you.");
  } catch (error) {
    console.error("Gemini Insight Error:", error);
    return "";
  }
};