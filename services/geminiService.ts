import { GoogleGenerativeAI } from "@google/generative-ai";
import { WorkPlan, WorkshopStage } from "../types";

// שליפת המפתח
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// אתחול המערכת - שים לב לשימוש ב-v1 אם ה-v1beta עושה בעיות
const genAI = new GoogleGenerativeAI(API_KEY || "");

/**
 * פתרון ה-404: 
 * אנחנו עוברים לגרסה הכי יציבה של המודל. 
 * אם gemini-1.5-flash נותן 404, נשתמש ב-gemini-pro שהוא תמיד זמין.
 */
const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash", // או "gemini-pro" אם הבעיה ממשיכה
});

const parseSafeJson = (text: string) => {
  try {
    const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleanText);
  } catch (e) {
    console.error("JSON Parse error:", text);
    return null;
  }
};

export const getMentorAdvice = async (stage: WorkshopStage, plan: WorkPlan) => {
  if (!API_KEY) return null;
  try {
    const prompt = `אתה מנטור לשפ"ח. שלב: ${stage}. תוכנית: ${JSON.stringify(plan)}. תן עצה קצרה בעברית בפורמט JSON בלבד עם השדות: content, example, nextStepConnection, suggestions, philosophicalInsight.`;
    const result = await model.generateContent(prompt);
    return parseSafeJson(result.response.text());
  } catch (error: any) {
    console.error("Advice Error:", error.message);
    return null;
  }
};

export const generateFunnelDraft = async (type: string, plan: WorkPlan) => {
  if (!API_KEY) return { items: [] };
  try {
    const prompt = `הצע 3 ${type} לשפ"ח בעברית לפי התוכנית: ${JSON.stringify(plan)}. החזר JSON: { "items": ["...", "...", "..."] }`;
    const result = await model.generateContent(prompt);
    return parseSafeJson(result.response.text());
  } catch (error: any) {
    console.error("Draft Error:", error.message);
    return { items: [] };
  }
};

export const integrateFullPlanWithAI = async (plan: WorkPlan) => {
  if (!API_KEY) return plan;
  try {
    const prompt = `שפר את תוכנית העבודה הזו: ${JSON.stringify(plan)}. הוסף aiRefinement ו-aiInsight. החזר WorkPlan מלא כ-JSON בעברית.`;
    const result = await model.generateContent(prompt);
    return parseSafeJson(result.response.text()) || plan;
  } catch (error: any) {
    console.error("Integration Error:", error.message);
    return plan;
  }
};