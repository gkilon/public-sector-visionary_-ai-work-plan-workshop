import { GoogleGenerativeAI } from "@google/generative-ai";
import { WorkPlan, WorkshopStage } from "../types";

// שליפת המפתח מה-Environment Variables של Vite או Netlify
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// בדיקה אם המפתח קיים - אם לא, נדפיס אזהרה ברורה בקונסול
if (!API_KEY) {
  console.error("❌ MISSING API KEY: וודא שהגדרת VITE_GEMINI_API_KEY ב-Netlify או בקובץ .env");
}

// יצירת החיבור לגוגל
const genAI = new GoogleGenerativeAI(API_KEY || "");

/**
 * הגדרת המודל: 
 * השתמשתי ב-gemini-1.5-flash כי הוא המודל הכי מהיר ויציב למשימות כאלו.
 * אם גוגל יחזיר שוב 404, הפונקציות למטה יתפסו את זה.
 */
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

/**
 * פונקציית עזר לניקוי ה-JSON שה-AI מחזיר.
 * היא מטפלת במקרים שה-AI מחזיר טקסט מיותר לפני או אחרי ה-JSON.
 */
const parseSafeJson = (text: string) => {
  try {
    // הסרת תגיות Markdown של קוד אם קיימות
    const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleanText);
  } catch (e) {
    console.error("Could not parse AI response as JSON. Raw text:", text);
    return null;
  }
};

/**
 * פונקציה 1: קבלת ייעוץ מנטור
 */
export const getMentorAdvice = async (stage: WorkshopStage, plan: WorkPlan) => {
  if (!API_KEY) return null;
  try {
    const prompt = `אתה מנטור אסטרטגי לשפ"ח. השלב הנוכחי: ${stage}. 
    תוכנית עבודה נוכחית: ${JSON.stringify(plan)}.
    תן עצה מקצועית קצרה בעברית.
    תחזיר אך ורק JSON בפורמט הזה:
    {
      "content": "העצה",
      "example": "דוגמה",
      "nextStepConnection": "חיבור לשלב הבא",
      "suggestions": ["הצעה 1", "הצעה 2"],
      "philosophicalInsight": "תובנה"
    }`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return parseSafeJson(text);
  } catch (error: any) {
    console.error("AI Advice Error:", error.message);
    return null;
  }
};

/**
 * פונקציה 2: יצירת טיוטה (מטרות/יעדים/משימות)
 */
export const generateFunnelDraft = async (type: string, plan: WorkPlan) => {
  if (!API_KEY) return { items: [] };
  try {
    const prompt = `בהתבסס על התוכנית: ${JSON.stringify(plan)}, 
    הצע 3 ${type} מתאימים לשפ"ח בעברית.
    תחזיר JSON בפורמט: { "items": ["...", "...", "..."] }`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return parseSafeJson(text);
  } catch (error: any) {
    console.error("AI Draft Error:", error.message);
    return { items: [] };
  }
};

/**
 * פונקציה 3: אינטגרציה סופית לתוכנית כולה
 */
export const integrateFullPlanWithAI = async (plan: WorkPlan) => {
  if (!API_KEY) return plan;
  try {
    const prompt = `שפר את תוכנית העבודה הבאה של שפ"ח: ${JSON.stringify(plan)}. 
    הוסף aiRefinement למטרות ו-aiInsight ליעדים. הוסף expertAnalysis מסכם.
    החזר את כל אובייקט ה-WorkPlan המעודכן בפורמט JSON בלבד בעברית.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return parseSafeJson(text) || plan;
  } catch (error: any) {
    console.error("AI Integration Error:", error.message);
    return plan;
  }
};