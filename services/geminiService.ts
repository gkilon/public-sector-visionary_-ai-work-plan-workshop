import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// בדיקה אם המפתח מגיע לקוד
console.log("AI Check: ", API_KEY ? "Key exists" : "Key MISSING");

const genAI = new GoogleGenerativeAI(API_KEY || "");

/**
 * פתרון 404 סופי:
 * 1. משתמשים בשם המודל המלא עם התחילית models/
 * 2. נותנים ל-SDK להחליט על הגרסה הכי טובה אוטומטית
 */
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const parseSafeJson = (text: string) => {
  try {
    const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleanText);
  } catch (e) {
    console.error("Raw AI response was not JSON:", text);
    return null;
  }
};

export const getMentorAdvice = async (stage: any, plan: any) => {
  if (!API_KEY) return null;
  try {
    const result = await model.generateContent(`אתה מנטור אסטרטגי לשפ"ח. שלב: ${stage}. תן עצה קצרה בעברית בפורמט JSON בלבד: {"content": "..."}`);
    return parseSafeJson(result.response.text());
  } catch (error: any) {
    console.error("Advice Error Details:", error);
    return null;
  }
};

export const generateFunnelDraft = async (type: string, plan: any) => {
  if (!API_KEY) return { items: [] };
  try {
    const result = await model.generateContent(`הצע 3 ${type} לשפ"ח בעברית. החזר JSON בלבד: {"items": ["...", "...", "..."]}`);
    return parseSafeJson(result.response.text());
  } catch (error: any) {
    console.error("Draft Error:", error);
    return { items: [] };
  }
};

export const integrateFullPlanWithAI = async (plan: any) => {
  if (!API_KEY) return plan;
  try {
    const result = await model.generateContent(`בצע אינטגרציה לתוכנית: ${JSON.stringify(plan)}. החזר אובייקט JSON מלא בעברית.`);
    return parseSafeJson(result.response.text()) || plan;
  } catch (error: any) {
    console.error("Integration Error:", error);
    return plan;
  }
};