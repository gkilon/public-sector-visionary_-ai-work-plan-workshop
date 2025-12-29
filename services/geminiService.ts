
import { GoogleGenAI, Type } from "@google/genai";
import { WorkPlan } from "../types.ts";

const cleanJsonString = (str: string) => {
  if (!str) return "{}";
  let cleaned = str.replace(/```json/g, '').replace(/```/g, '').trim();
  const startIdx = cleaned.indexOf('{');
  const endIdx = cleaned.lastIndexOf('}');
  const startArrIdx = cleaned.indexOf('[');
  const endArrIdx = cleaned.lastIndexOf(']');

  if (startIdx !== -1 && endIdx !== -1 && (startArrIdx === -1 || startIdx < startArrIdx)) {
    cleaned = cleaned.substring(startIdx, endIdx + 1);
  } else if (startArrIdx !== -1 && endArrIdx !== -1) {
    cleaned = cleaned.substring(startArrIdx, endArrIdx + 1);
  }
  return cleaned;
};

const EXPERT_SYSTEM_INSTRUCTION = `
אתה "אסטרטג-על" בכיר המתמחה בשירותים פסיכולוגיים ציבוריים (שפ"ח).
תפקידך לסייע למנהלים לבנות תוכנית עבודה מקצועית, חדה ואסטרטגית.
חשוב: גם אם המידע שסופק חלקי, השתמש בידע המקצועי הרחב שלך כדי להציע רעיונות רלוונטיים.
עליך להחזיר תמיד אך ורק JSON תקין.
`;

/**
 * פונקציה ליצירת לקוח AI. 
 * אינה חוסמת אם המפתח חסר ב-process.env, אלא מאפשרת למערכת לנסות ולהשתמש במפתח המוזרק.
 */
async function createAIInstance(requirePro = false) {
  if (requirePro && window.aistudio) {
    const hasKey = await window.aistudio.hasSelectedApiKey();
    if (!hasKey) {
      await window.aistudio.openSelectKey();
      // ממשיכים מיד לאחר פתיחת הדיאלוג לפי ההנחיות
    }
  }
  // משתמשים במפתח שקיים ב-process.env.API_KEY (מוזרק אוטומטית ב-Preview או לאחר בחירה)
  return new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
}

export async function getMentorAdvice(stage: string, currentData: any) {
  try {
    const ai = await createAIInstance();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `שלב נוכחי: ${stage}. נתונים: ${JSON.stringify(currentData)}. תן ייעוץ קצר, דוגמה ותובנה.`,
      config: {
        systemInstruction: EXPERT_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            content: { type: Type.STRING },
            example: { type: Type.STRING },
            nextStepConnection: { type: Type.STRING },
            suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
            philosophicalInsight: { type: Type.STRING }
          },
          required: ["content", "example", "nextStepConnection", "suggestions", "philosophicalInsight"]
        }
      }
    });
    return JSON.parse(cleanJsonString(response.text));
  } catch (error) {
    console.error("Advice Error:", error);
    return null;
  }
}

export async function generateFunnelDraft(type: string, currentData: any) {
  try {
    const ai = await createAIInstance();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `ייצר 3 הצעות ל${type} עבור שפ"ח על בסיס: ${JSON.stringify(currentData)}`,
      config: {
        systemInstruction: EXPERT_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: { items: { type: Type.ARRAY, items: { type: Type.STRING } } },
          required: ["items"]
        }
      }
    });
    return JSON.parse(cleanJsonString(response.text));
  } catch (error) {
    console.error("Draft Error:", error);
    return { items: [] };
  }
}

export async function integrateFullPlanWithAI(plan: WorkPlan): Promise<WorkPlan> {
  try {
    // מודל Pro דורש בחירת מפתח מפורשת במידת הצורך
    const ai = await createAIInstance(true);
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `בצע שכתוב אסטרטגי מלא: ${JSON.stringify(plan)}`,
      config: {
        systemInstruction: EXPERT_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            objectives: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: { id: { type: Type.STRING }, title: { type: Type.STRING }, aiRefinement: { type: Type.STRING } },
                required: ["id", "title", "aiRefinement"]
              }
            },
            goals: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  parentObjectiveId: { type: Type.STRING },
                  title: { type: Type.STRING },
                  aiInsight: { type: Type.STRING },
                  tasks: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: { id: { type: Type.STRING }, description: { type: Type.STRING }, owner: { type: Type.STRING }, deadline: { type: Type.STRING }, isAiSuggested: { type: Type.BOOLEAN } },
                      required: ["id", "description", "owner", "deadline", "isAiSuggested"]
                    }
                  }
                },
                required: ["id", "parentObjectiveId", "title", "aiInsight", "tasks"]
              }
            },
            expertAnalysis: { type: Type.STRING }
          },
          required: ["objectives", "goals", "expertAnalysis"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response");
    return JSON.parse(cleanJsonString(text));
  } catch (error: any) {
    console.error("Integration Error:", error);
    // אם המפתח נדחה או חסר, פתח את הדיאלוג ונסה שוב
    if (error.message?.includes("Requested entity was not found") && window.aistudio) {
      await window.aistudio.openSelectKey();
    }
    throw error;
  }
}
