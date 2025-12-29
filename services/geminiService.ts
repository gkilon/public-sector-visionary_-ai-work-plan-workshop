import { WorkPlan } from "../types.ts";

// שליפת המפתח מ-Vite/Netlify
const getApiKey = (): string => {
  try {
    // @ts-ignore
    return import.meta.env?.VITE_GEMINI_API_KEY || "";
  } catch (e) {
    return "";
  }
};

const API_KEY = getApiKey();

/**
 * פונקציה חסינה לשליחת בקשה ל-Gemini
 */
async function callGeminiAPI(prompt: string, systemInstruction: string) {
  if (!API_KEY) throw new Error("Missing API Key");

  // שימוש ב-v1beta עם השם המלא של המודל
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
  
  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    system_instruction: { parts: [{ text: systemInstruction }] },
    generation_config: {
      response_mime_type: "application/json",
      temperature: 0.7
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const responseData = await response.json();

  if (!response.ok) {
    console.error("Gemini API Error details:", responseData);
    throw new Error(responseData.error?.message || 'API request failed');
  }

  return responseData.candidates[0].content.parts[0].text;
}

const EXPERT_SYSTEM_INSTRUCTION = `
אתה "אסטרטג-על" בכיר המתמחה בשירותים פסיכולוגיים ציבוריים (שפ"ח).
תפקידך לסייע למנהלים לבנות תוכנית עבודה מקצועית, חדה ואסטרטגית.
עליך להחזיר אך ורק JSON תקין.
`;

export async function getMentorAdvice(stage: string, currentData: any) {
  try {
    const prompt = `שלב נוכחי: ${stage}. נתונים: ${JSON.stringify(currentData)}. תן ייעוץ קצר, דוגמה ותובנה.`;
    const result = await callGeminiAPI(prompt, EXPERT_SYSTEM_INSTRUCTION);
    return JSON.parse(result);
  } catch (error) {
    console.error("Advice Error:", error);
    return null;
  }
}

export async function generateFunnelDraft(type: string, currentData: any) {
  try {
    const prompt = `ייצר 3 הצעות ל${type} עבור שפ"ח על בסיס: ${JSON.stringify(currentData)}`;
    const result = await callGeminiAPI(prompt, EXPERT_SYSTEM_INSTRUCTION);
    return JSON.parse(result);
  } catch (error) {
    console.error("Draft Error:", error);
    return { items: [] };
  }
}

export async function integrateFullPlanWithAI(plan: WorkPlan): Promise<WorkPlan> {
  try {
    const prompt = `בצע שכתוב אסטרטגי מלא לתוכנית: ${JSON.stringify(plan)}`;
    const result = await callGeminiAPI(prompt, EXPERT_SYSTEM_INSTRUCTION);
    return JSON.parse(result);
  } catch (error) {
    console.error("Integration Error:", error);
    throw error;
  }
}