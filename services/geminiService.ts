import { GoogleGenerativeAI } from "@google/generative-ai";
import { WorkPlan, WorkshopStage } from "../types";

// שליפת המפתח בצורה מאובטחת מהסביבה של Vite
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.warn("⚠️ Gemini API Key missing in .env file");
}

const genAI = new GoogleGenerativeAI(API_KEY || "");
// שימוש במודל flash שהוא מהיר ומתאים למשימות טקסט כאלו
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

/**
 * פונקציית עזר לניקוי תגובת ה-AI.
 * לעיתים ה-AI מחזיר קוד עטוף ב-Markdown (סימני ```json), הפונקציה הזו מנקה אותם.
 */
const parseSafeJson = (text: string) => {
  try {
    const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleanText);
  } catch (e) {
    console.error("Failed to parse AI response as JSON:", text);
    return null;
  }
};

/**
 * 1. קבלת ייעוץ מהמנטור עבור שלב ספציפי
 */
export const getMentorAdvice = async (stage: WorkshopStage, plan: WorkPlan) => {
  if (!API_KEY) return null;
  try {
    const prompt = `אתה מנטור אסטרטגי מומחה לשירותים פסיכולוגיים חינוכיים (שפ"ח).
    המשתמש נמצא בשלב: ${stage}.
    זהו מצב תוכנית העבודה הנוכחי: ${JSON.stringify(plan)}.
    
    משימה: תן עצה קצרה, השראה וכיוון מחשבה מקצועי לשלב זה.
    החזר תשובה אך ורק בפורמט JSON עם השדות הבאים:
    {
      "content": "העצה העיקרית",
      "example": "דוגמה קונקרטית ליישום",
      "nextStepConnection": "איך זה מתחבר לשלב הבא",
      "suggestions": ["הצעה 1", "הצעה 2"],
      "philosophicalInsight": "תובנה מעמיקה קצרה"
    }`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return parseSafeJson(response.text());
  } catch (error) {
    console.error("Error fetching mentor advice:", error);
    return null;
  }
};

/**
 * 2. יצירת טיוטה ראשונית למטרות, יעדים או משימות
 */
export const generateFunnelDraft = async (type: 'objectives' | 'goals' | 'tasks', plan: WorkPlan) => {
  if (!API_KEY) return { items: [] };
  try {
    const prompt = `בהתבסס על תוכנית העבודה של שפ"ח: ${JSON.stringify(plan)},
    הצע רשימה של 3 ${type} (מטרות/יעדים/משימות) מקצועיים וריאליים.
    החזר אך ורק JSON בפורמט:
    { "items": ["הצעה 1", "הצעה 2", "הצעה 3"] }`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return parseSafeJson(response.text());
  } catch (error) {
    console.error("Error generating draft:", error);
    return { items: [] };
  }
};

/**
 * 3. אינטגרציה סופית של כל התוכנית
 */
export const integrateFullPlanWithAI = async (plan: WorkPlan) => {
  if (!API_KEY) return plan;
  try {
    const prompt = `בצע אינטגרציה אסטרטגית ושיפור לתוכנית העבודה הבאה של שפ"ח: ${JSON.stringify(plan)}.
    משימות:
    1. הוסף שדה "aiRefinement" לכל מטרה (objective).
    2. הוסף שדה "aiInsight" לכל יעד (goal).
    3. הוסף שדה "expertAnalysis" לכללי (ניתוח מסכם של התוכנית).
    
    החזר את כל אובייקט ה-WorkPlan המעודכן כ-JSON בלבד.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const enhancedPlan = parseSafeJson(response.text());
    return enhancedPlan || plan;
  } catch (error) {
    console.error("Error integrating plan:", error);
    return plan;
  }
};