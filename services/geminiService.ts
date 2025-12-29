import { GoogleGenerativeAI } from "@google/generative-ai";
import { WorkPlan, WorkshopStage } from "../types";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// --- כאן השינוי הקריטי: אנחנו מכריחים את ה-SDK להשתמש ב-v1 במקום v1beta ---
const genAI = new GoogleGenerativeAI(API_KEY || "", { apiVersion: "v1" });

// אנחנו משתמשים במודל 1.5-flash בגרסה היציבה שלו
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const parseSafeJson = (text: string) => {
  try {
    const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleanText);
  } catch (e) {
    console.error("JSON Parse Error:", text);
    return null;
  }
};

export const getMentorAdvice = async (stage: WorkshopStage, plan: WorkPlan) => {
  if (!API_KEY) return null;
  try {
    const prompt = `אתה מנטור אסטרטגי לשפ"ח. שלב: ${stage}. תוכנית: ${JSON.stringify(plan)}. תן עצה קצרה בעברית ב-JSON: { "content": "...", "example": "...", "nextStepConnection": "...", "suggestions": [], "philosophicalInsight": "..." }`;
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
    const prompt = `הצע 3 ${type} לשפ"ח בעברית לפי: ${JSON.stringify(plan)}. החזר JSON: { "items": [] }`;
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
    const prompt = `שפר תוכנית עבודה לשפ"ח: ${JSON.stringify(plan)}. החזר אובייקט WorkPlan מלא ב-JSON עם aiRefinement ו-aiInsight.`;
    const result = await model.generateContent(prompt);
    return parseSafeJson(result.response.text()) || plan;
  } catch (error: any) {
    console.error("Integration Error:", error.message);
    return plan;
  }
};