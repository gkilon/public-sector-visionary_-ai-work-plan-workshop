import { GoogleGenAI, Type } from "@google/genai";
import { WorkPlan } from "../types.ts";

// 1. הגדרה ישירה ובטוחה של המפתח כדי למנוע ReferenceError
const getKey = () => {
  try {
    // @ts-ignore
    return import.meta.env?.VITE_GEMINI_API_KEY || "";
  } catch (e) {
    return "";
  }
};

const EXPERT_INSTRUCTION = `אתה אסטרטג-על בשירותים פסיכולוגיים ציבוריים. החזר תמיד JSON תקין.`;

/**
 * פונקציה מרכזית לביצוע הקריאות - בדיוק במבנה של הפרויקט השני שלך
 */
async function runAI(modelName: string, prompt: string) {
  const key = getKey();
  if (!key) {
    throw new Error("מפתח API חסר. וודא שהגדרת VITE_GEMINI_API_KEY בנטליפיי.");
  }

  const ai = new GoogleGenAI({ apiKey: key });
  
  // ה-404 קורה כי הספרייה @google/genai לפעמים דורשת שמות דגמים ספציפיים
  // אנחנו ננסה את השם הכי סטנדרטי
  return await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config: {
      systemInstruction: EXPERT_INSTRUCTION,
      responseMimeType: "application/json"
    }
  });
}

// פונקציות הייצוא של האפליקציה
export const getMentorAdvice = async (stage: string, currentData: any) => {
  try {
    const result = await runAI('gemini-1.5-flash', `שלב: ${stage}. נתונים: ${JSON.stringify(currentData)}`);
    return JSON.parse(result.text || '{}');
  } catch (e: any) {
    console.error("AI Error:", e.message);
    return { content: "חלה שגיאה בחיבור ל-AI. וודא שהמפתח תקין." };
  }
};

export const generateFunnelDraft = async (type: string, currentData: any) => {
  try {
    const result = await runAI('gemini-1.5-flash', `ייצר 3 הצעות ל${type}: ${JSON.stringify(currentData)}`);
    return JSON.parse(result.text || '{"items": []}');
  } catch (e) {
    return { items: [] };
  }
};

export const integrateFullPlanWithAI = async (plan: WorkPlan): Promise<WorkPlan> => {
  const result = await runAI('gemini-1.5-flash', `שכתב אסטרטגית: ${JSON.stringify(plan)}`);
  return JSON.parse(result.text || '{}');
};