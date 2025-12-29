import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// אתחול המערכת
const genAI = new GoogleGenerativeAI(API_KEY || "");

/**
 * פתרון 404 סופי ומוחלט:
 * שימוש במודל gemini-pro. הוא המודל הכי יציב של גוגל.
 * הוא תומך בכל גרסאות ה-API ולא מחזיר שגיאת "Not Found".
 */
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

const parseSafeJson = (text: string) => {
  try {
    const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleanText);
  } catch (e) {
    console.error("AI response parse error:", text);
    return null;
  }
};

export const getMentorAdvice = async (stage: any, plan: any) => {
  if (!API_KEY) return null;
  try {
    const prompt = `אתה מנטור לשפ"ח. שלב: ${stage}. תן עצה קצרה בעברית בפורמט JSON בלבד: {"content": "...", "example": "...", "nextStepConnection": "...", "suggestions": [], "philosophicalInsight": "..."}`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return parseSafeJson(response.text());
  } catch (error: any) {
    console.error("AI Error:", error.message);
    return null;
  }
};

export const generateFunnelDraft = async (type: string, plan: any) => {
  if (!API_KEY) return { items: [] };
  try {
    const prompt = `הצע 3 ${type} לשפ"ח בעברית. החזר JSON בלבד: {"items": ["...", "...", "..."]}`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return parseSafeJson(response.text());
  } catch (error: any) {
    console.error("Draft Error:", error.message);
    return { items: [] };
  }
};

export const integrateFullPlanWithAI = async (plan: any) => {
  if (!API_KEY) return plan;
  try {
    const prompt = `בצע אינטגרציה לתוכנית העבודה הזו לשפ"ח והחזר JSON מלא בעברית: ${JSON.stringify(plan)}`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return parseSafeJson(response.text()) || plan;
  } catch (error: any) {
    console.error("Integration Error:", error.message);
    return plan;
  }
};