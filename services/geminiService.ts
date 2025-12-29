import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.error("❌ API KEY IS MISSING!");
}

const genAI = new GoogleGenerativeAI(API_KEY || "");

/**
 * פתרון ה-404 הסופי:
 * אנחנו מעבירים את apiVersion כפרמטר שני לפונקציית ה-model.
 * זה מכריח את ה-SDK להשתמש ב-v1 ולא ב-v1beta.
 */
const model = genAI.getGenerativeModel(
  { model: "gemini-1.5-flash" },
  { apiVersion: "v1" } 
);

const parseSafeJson = (text: string) => {
  try {
    const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleanText);
  } catch (e) {
    return null;
  }
};

export const getMentorAdvice = async (stage: any, plan: any) => {
  if (!API_KEY) return null;
  try {
    const result = await model.generateContent(`אתה מנטור לשפ"ח. שלב: ${stage}. תן עצה קצרה בעברית ב-JSON: {"content": "..."}`);
    const response = await result.response;
    return parseSafeJson(response.text());
  } catch (error: any) {
    console.error("Advice Error:", error.message);
    return null;
  }
};

export const generateFunnelDraft = async (type: string, plan: any) => {
  if (!API_KEY) return { items: [] };
  try {
    const result = await model.generateContent(`הצע 3 ${type} לשפ"ח בעברית. JSON: {"items": []}`);
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
    const result = await model.generateContent(`שפר את תוכנית העבודה הזו לשפ"ח והחזר JSON מלא: ${JSON.stringify(plan)}`);
    const response = await result.response;
    return parseSafeJson(response.text()) || plan;
  } catch (error: any) {
    console.error("Integration Error:", error.message);
    return plan;
  }
};