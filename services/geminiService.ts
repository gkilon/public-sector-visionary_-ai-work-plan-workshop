import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// בדיקת אבטחה קטנה שתראה לנו ב-Console אם המפתח הגיע בשלמותו
if (API_KEY) {
  console.log("AI Status: Key detected (Length: " + API_KEY.length + ")");
} else {
  console.error("AI Status: ❌ API KEY MISSING!");
}

const genAI = new GoogleGenerativeAI(API_KEY || "");

/**
 * פתרון ה-404 הסופי:
 * אנחנו משתמשים במודל 'gemini-pro'.
 * זהו המודל הכי ותיק ויציב של גוגל בגרסה v1.
 * הוא "סוס עבודה" שחייב לענות בכתובת הזו.
 */
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

const parseSafeJson = (text: string) => {
  try {
    // ניקוי אגרסיבי של סימני Markdown
    const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    // חיפוש ה-JSON האמיתי בתוך הטקסט (למקרה שה-AI הוסיף הסברים)
    const start = cleanText.indexOf('{');
    const end = cleanText.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
      return JSON.parse(cleanText.substring(start, end + 1));
    }
    return JSON.parse(cleanText);
  } catch (e) {
    console.error("AI Formatting Error:", text);
    return null;
  }
};

export const getMentorAdvice = async (stage: any, plan: any) => {
  if (!API_KEY) return null;
  try {
    const prompt = `אתה מנטור אסטרטגי לשפ"ח. שלב: ${stage}. תוכנית: ${JSON.stringify(plan)}. תן עצה קצרה בעברית בפורמט JSON בלבד: {"content": "...", "example": "...", "nextStepConnection": "...", "suggestions": [], "philosophicalInsight": "..."}`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return parseSafeJson(response.text());
  } catch (error: any) {
    console.error("Detailed AI Error:", error);
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
    console.error("Draft Error:", error);
    return { items: [] };
  }
};

export const integrateFullPlanWithAI = async (plan: any) => {
  if (!API_KEY) return plan;
  try {
    const prompt = `בצע אינטגרציה לתוכנית: ${JSON.stringify(plan)}. החזר אובייקט JSON מלא בעברית.`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return parseSafeJson(response.text()) || plan;
  } catch (error: any) {
    console.error("Integration Error:", error);
    return plan;
  }
};