import { GoogleGenAI, Type } from "@google/genai";
import { WorkPlan } from "../types.ts";

/**
 * שליפת מפתח ה-API בצורה בטוחה עבור סביבת Vite/Netlify
 */
const getSafeApiKey = (): string => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      return import.meta.env.VITE_GEMINI_API_KEY || "";
    }
  } catch (e) {
    console.warn("Environment settings not found, checking fallback...");
  }
  return "";
};

const cleanJsonString = (str: string) => {
  if (!str) return "{}";
  let cleaned = str.replace(/```json/g, '').replace(/```/g, '').trim();
  const startIdx = cleaned.indexOf('{');
  const endIdx = cleaned.lastIndexOf('}');
  const startArrIdx = cleaned.indexOf('[');
  const endArrIdx = cleaned.lastIndexOf(']');

  if (startIdx !== -1 && endIdx !== -1 && (startArrIdx === -1 || startIdx < startArrIdx)) {
    cleaned = cleaned.substring(startIdx, endIdx + 1);
  } else if (startArrIdx !== -1 && endArrIdx !== -1) {
    cleaned = cleaned.substring(startArrIdx, endArrIdx + 1);
  }
  return cleaned;
};

const EXPERT_SYSTEM_INSTRUCTION = `
אתה "אסטרטג-על" בכיר המתמחה בשירותים פסיכולוגיים ציבוריים (שפ"ח).
תפקידך לסייע למנהלים לבנות תוכנית עבודה מקצועית, חדה ואסטרטגית.
עליך להחזיר אך ורק JSON תקין.
`;

async function createAIInstance() {
  const apiKey = getSafeApiKey();
  
  // תמיכה בסביבת AI Studio במידה והמפתח חסר
  // @ts-ignore
  if (!apiKey && typeof window !== 'undefined' && window.aistudio) {
    // @ts-ignore
    const hasKey = await window.aistudio.hasSelectedApiKey();
    if (!hasKey) {
      // @ts-ignore
      await window.aistudio.openSelectKey();
    }
  }
  
  return new GoogleGenAI({ apiKey: getSafeApiKey() });
}

export async function getMentorAdvice(stage: string, currentData: any) {
  try {
    const ai = await createAIInstance();
    const response = await ai.models.generateContent({
      model: 'gemini-pro', // שינוי השם לגרסה היציבה
      contents: `שלב נוכחי: ${stage}. נתונים: ${JSON.stringify(currentData)}. תן ייעוץ קצר, דוגמה ותובנה.`,
      config: {
        systemInstruction: EXPERT_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            content: { type: Type.STRING },
            example: { type: Type.STRING },
            nextStepConnection: { type: Type.STRING },
            suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
            philosophicalInsight: { type: Type.STRING }
          },
          required: ["content", "example", "nextStepConnection", "suggestions", "philosophicalInsight"]
        }
      }
    });
    return JSON.parse(cleanJsonString(response.text));
  } catch (error: any) {
    console.error("Advice Error:", error);
    return null;
  }
}

export async function generateFunnelDraft(type: string, currentData: any) {
  try {
    const ai = await createAIInstance();
    const response = await ai.models.generateContent({
      model: 'gemini-pro', // שינוי השם לגרסה היציבה
      contents: `ייצר 3 הצעות ל${type} עבור שפ"ח על בסיס: ${JSON.stringify(currentData)}`,
      config: {
        systemInstruction: EXPERT_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: { items: { type: Type.ARRAY, items: { type: Type.STRING } } },
          required: ["items"]
        }
      }
    });
    return JSON.parse(cleanJsonString(response.text));
  } catch (error: any) {
    console.error("Draft Error:", error);
    return { items: [] };
  }
}

export async function integrateFullPlanWithAI(plan: WorkPlan): Promise<WorkPlan> {
  try {
    const ai = await createAIInstance();
    const response = await ai.models.generateContent({
      model: 'gemini-pro', // שינוי השם לגרסה היציבה
      contents: `בצע שכתוב אסטרטגי מלא: ${JSON.stringify(plan)}`,
      config: {
        systemInstruction: EXPERT_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response");
    return JSON.parse(cleanJsonString(text));
  } catch (error: any) {
    console.error("Integration Error:", error);
    throw error;
  }
}