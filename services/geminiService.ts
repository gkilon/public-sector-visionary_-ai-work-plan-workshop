import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// אתחול פשוט - המודל gemini-pro הוא "סוס עבודה" שלא עושה בעיות גרסאות
const genAI = new GoogleGenerativeAI(API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

const parseSafeJson = (text: string) => {
  try {
    const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleanText);
  } catch (e) {
    console.error("AI Response was not JSON:", text);
    return null;
  }
};

export const getMentorAdvice = async (stage: any, plan: any) => {
  if (!API_KEY) return null;
  try {
    const result = await model.generateContent(`מנטור לשפ"ח. שלב: ${stage}. תן עצה קצרה בעברית בפורמט JSON: {"content": "..."}`);
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
    const result = await model.generateContent(`הצע 3 ${type} לשפ"ח בעברית. החזר JSON: {"items": ["...", "...", "..."]}`);
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
    const result = await model.generateContent(`שפר את תוכנית העבודה הזו של שפ"ח והחזר אותה כ-JSON מלא בעברית: ${JSON.stringify(plan)}`);
    const response = await result.response;
    return parseSafeJson(response.text()) || plan;
  } catch (error: any) {
    console.error("Integration Error:", error.message);
    return plan;
  }
};