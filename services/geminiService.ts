import { GoogleGenAI, Type } from "@google/genai";
import { WorkPlan } from "../types.ts";

/**
 * פונקציה לשליפת המפתח מנטליפיי/Vite
 */
const getApiKey = () => {
  // @ts-ignore
  return import.meta.env?.VITE_GEMINI_API_KEY || "";
};

const EXPERT_SYSTEM_INSTRUCTION = `
אתה "אסטרטג-על" בכיר המתמחה בשירותים פסיכולוגיים ציבוריים (שפ"ח).
תפקידך לסייע למנהלים לבנות תוכנית עבודה מקצועית, חדה ואסטרטגית.
עליך להחזיר אך ורק JSON תקין.
`;

export const getMentorAdvice = async (stage: string, currentData: any) => {
  // אתחול ה-AI בדיוק כמו בפרויקט השני שלך
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  
  try {
    const response = await ai.models.generateContent({
      // כאן שמתי את השם שה-SDK הזה מחפש. 
      // אם gemini-1.5-flash נותן 404, נסה להחליף ל 'gemini-pro'
      model: 'gemini-1.5-flash', 
      contents: `שלב נוכחי: ${stage}. נתונים: ${JSON.stringify(currentData)}. תן ייעוץ קצר.`,
      config: {
        systemInstruction: EXPERT_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json"
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (e) {
    console.error("Advice fetch failed:", e);
    return { content: "שגיאה בחיבור ל-AI" };
  }
};

export const generateFunnelDraft = async (type: string, currentData: any) => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: `ייצר 3 הצעות ל${type} עבור שפ"ח: ${JSON.stringify(currentData)}`,
      config: {
        systemInstruction: EXPERT_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json"
      }
    });
    return JSON.parse(response.text || '{"items": []}');
  } catch (e) {
    console.error("Drafting failed:", e);
    return { items: [] };
  }
};

export const integrateFullPlanWithAI = async (plan: WorkPlan): Promise<WorkPlan> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: `בצע שכתוב אסטרטגי מלא: ${JSON.stringify(plan)}`,
      config: {
        systemInstruction: EXPERT_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json"
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (e) {
    console.error("Integration failed:", e);
    throw e;
  }
};