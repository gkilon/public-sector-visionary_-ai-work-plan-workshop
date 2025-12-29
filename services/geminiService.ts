import { GoogleGenAI, Type } from "@google/genai";
import { WorkPlan } from "../types.ts";

/**
 * 1. הגדרת הפונקציה (חייבת להופיע לפני השימוש בה)
 */
const getSafeApiKey = (): string => {
  try {
    // בדיקה עבור סביבת Vite (Netlify)
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      return import.meta.env.VITE_GEMINI_API_KEY || "";
    }
  } catch (e) {
    // מונע קריסה ב-Preview אם import.meta לא קיים
  }
  return "";
};

// 2. חילוץ המפתח למשתנה אחד ברור
const API_KEY = getSafeApiKey();

const EXPERT_SYSTEM_INSTRUCTION = `
אתה "אסטרטג-על" בכיר המתמחה בשירותים פסיכולוגיים ציבוריים (שפ"ח).
תפקידך לסייע למנהלים לבנות תוכנית עבודה מקצועית, חדה ואסטרטגית.
עליך להחזיר אך ורק JSON תקין.
`;

// פונקציית עזר לניקוי ה-JSON שחוזר מה-AI
const cleanJson = (text: string) => text.replace(/```json/g, '').replace(/```/g, '').trim();

/**
 * 3. פונקציות ה-AI (בדיוק כמו בפרויקט השני שלך)
 */
export async function getMentorAdvice(stage: string, currentData: any) {
  // אם אין מפתח, לא נבצע את הקריאה כדי למנוע 404
  if (!API_KEY) {
    console.warn("API Key is missing - skipping AI call");
    return { content: "מפתח API לא הוגדר כראוי בנטליפיי." };
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash', 
      contents: `שלב נוכחי: ${stage}. נתונים: ${JSON.stringify(currentData)}. תן ייעוץ קצר.`,
      config: {
        systemInstruction: EXPERT_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json"
      }
    });
    return JSON.parse(cleanJson(response.text || '{}'));
  } catch (error) {
    console.error("Advice Error:", error);
    return null;
  }
}

export async function generateFunnelDraft(type: string, currentData: any) {
  if (!API_KEY) return { items: [] };

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: `ייצר 3 הצעות ל${type} עבור שפ"ח: ${JSON.stringify(currentData)}`,
      config: {
        systemInstruction: EXPERT_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json"
      }
    });
    return JSON.parse(cleanJson(response.text || '{"items": []}'));
  } catch (error) {
    console.error("Draft Error:", error);
    return { items: [] };
  }
}

export async function integrateFullPlanWithAI(plan: WorkPlan): Promise<WorkPlan> {
  if (!API_KEY) throw new Error("Missing API Key");

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-1.5-flash',
    contents: `בצע שכתוב אסטרטגי מלא לתוכנית: ${JSON.stringify(plan)}`,
    config: {
      systemInstruction: EXPERT_SYSTEM_INSTRUCTION,
      responseMimeType: "application/json"
    }
  });
  return JSON.parse(cleanJson(response.text || '{}'));
}