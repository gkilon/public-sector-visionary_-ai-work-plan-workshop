import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// בדיקה אם המפתח קיים (יופיע בקונסול שלך)
console.log("Gemini Init - API Key detected:", !!API_KEY);

const genAI = new GoogleGenerativeAI(API_KEY || "");

// הכרחת שימוש בגרסה v1 ובמודל flash היציב
const model = genAI.getGenerativeModel(
  { model: "gemini-1.5-flash" },
  { apiVersion: "v1" }
);

// פונקציית עזר לניקוי ה-JSON מהתגובה
const cleanJson = (text: string) => {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
  } catch (e) {
    console.error("JSON parse error:", e);
    return null;
  }
};

export const getMentorAdvice = async (stage: any, plan: any) => {
  if (!API_KEY) return null;
  try {
    const result = await model.generateContent(`אתה מנטור אסטרטגי לשפ"ח. שלב: ${stage}. תן עצה קצרה בעברית בפורמט JSON בלבד: {"content": "..."}`);
    const response = await result.response;
    return cleanJson(response.text());
  } catch (error: any) {
    console.error("Gemini Advice Error:", error.message);
    return null;
  }
};

export const generateFunnelDraft = async (type: string, plan: any) => {
  if (!API_KEY) return { items: [] };
  try {
    const result = await model.generateContent(`הצע 3 ${type} לשפ"ח בעברית. החזר JSON בלבד: {"items": ["...", "...", "..."]}`);
    const response = await result.response;
    return cleanJson(response.text());
  } catch (error: any) {
    console.error("Gemini Draft Error:", error.message);
    return { items: [] };
  }
};

export const integrateFullPlanWithAI = async (plan: any) => {
  if (!API_KEY) return plan;
  try {
    const result = await model.generateContent(`שפר את תוכנית העבודה הזו לשפ"ח והחזר JSON מלא בעברית: ${JSON.stringify(plan)}`);
    const response = await result.response;
    return cleanJson(response.text()) || plan;
  } catch (error: any) {
    console.error("Gemini Integration Error:", error.message);
    return plan;
  }
};