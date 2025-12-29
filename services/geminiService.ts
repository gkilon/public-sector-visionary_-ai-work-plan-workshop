import { GoogleGenAI, Type } from "@google/genai";
import { WorkPlan } from "../types.ts";

/**
 * השינוי היחיד מהפרויקט השני: 
 * ב-Vite משתמשים ב-import.meta.env ובקידומת VITE_
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

// פונקציית עזר לניקוי הטקסט שחוזר מה-AI
const cleanJson = (text: string) => text.replace(/```json/g, '').replace(/```/g, '').trim();

export const getMentorAdvice = async (stage: string, currentData: any) => {
  // יצירת מופע בדיוק כמו בקוד ששלחת
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  
  const response = await ai.models.generateContent({
    model: 'gemini-1.5-flash', // שימוש במודל יציב שתומך ב-v1beta של @google/genai
    contents: `שלב נוכחי: ${stage}. נתונים: ${JSON.stringify(currentData)}. תן ייעוץ קצר, דוגמה ותובנה.`,
    config: {
      systemInstruction: EXPERT_SYSTEM_INSTRUCTION,
      responseMimeType: "application/json"
    }
  });
  
  return JSON.parse(cleanJson(response.text || '{}'));
};

export const generateFunnelDraft = async (type: string, currentData: any) => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  
  const response = await ai.models.generateContent({
    model: 'gemini-1.5-flash',
    contents: `ייצר 3 הצעות ל${type} עבור שפ"ח על בסיס: ${JSON.stringify(currentData)}`,
    config: {
      systemInstruction: EXPERT_SYSTEM_INSTRUCTION,
      responseMimeType: "application/json"
    }
  });
  
  return JSON.parse(cleanJson(response.text || '{"items": []}'));
};

export const integrateFullPlanWithAI = async (plan: WorkPlan): Promise<WorkPlan> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  
  const response = await ai.models.generateContent({
    model: 'gemini-1.5-flash',
    contents: `בצע שכתוב אסטרטגי מלא לתוכנית: ${JSON.stringify(plan)}`,
    config: {
      systemInstruction: EXPERT_SYSTEM_INSTRUCTION,
      responseMimeType: "application/json"
    }
  });

  return JSON.parse(cleanJson(response.text || '{}'));
};