
import { GoogleGenAI, Type } from "@google/genai";
import { WorkPlan } from "../types.ts";

const cleanJsonString = (str: string) => {
  if (!str) return "{}";
  // הסרת תגיות Markdown של קוד JSON אם קיימות
  let cleaned = str.replace(/```json/g, '').replace(/```/g, '').trim();
  // חיפוש האובייקט הראשון והאחרון למקרה שיש טקסט מיותר מסביב
  const startIdx = cleaned.indexOf('{');
  const endIdx = cleaned.lastIndexOf('}');
  const startArrIdx = cleaned.indexOf('[');
  const endArrIdx = cleaned.lastIndexOf(']');

  // אם זה אובייקט
  if (startIdx !== -1 && endIdx !== -1 && (startArrIdx === -1 || startIdx < startArrIdx)) {
    cleaned = cleaned.substring(startIdx, endIdx + 1);
  } 
  // אם זה מערך
  else if (startArrIdx !== -1 && endArrIdx !== -1) {
    cleaned = cleaned.substring(startArrIdx, endArrIdx + 1);
  }
  return cleaned;
};

const EXPERT_SYSTEM_INSTRUCTION = `
אתה "אסטרטג-על" בכיר המתמחה בשירותים פסיכולוגיים ציבוריים (שפ"ח).
תפקידך לסייע למנהלים לבנות תוכנית עבודה מקצועית, חדה ואסטרטגית.
חשוב: גם אם המידע שסופק חלקי, השתמש בידע המקצועי הרחב שלך כדי להציע רעיונות רלוונטיים ומעוררי השראה.
עליך להחזיר תמיד אך ורק JSON תקין ומדויק לפי הסכימה המבוקשת.
בלי הקדמות, בלי סיומות, ובלי "אני לא יכול". אם חסר מידע, תמציא דוגמאות גנריות מצוינות שמתאימות לשפ"ח.
`;

// פונקציה לבדיקת מפתח והתחברות
async function getAIClient() {
  // בדיקה אם קיים מפתח בסביבה
  let apiKey = process.env.API_KEY;
  
  // אם אין מפתח, נסה לפתוח את הדיאלוג של AI Studio (רלוונטי לסביבות פרודקשן)
  if (!apiKey && window.aistudio) {
    const hasKey = await window.aistudio.hasSelectedApiKey();
    if (!hasKey) {
      await window.aistudio.openSelectKey();
      // לאחר הפתיחה, המפתח אמור להיות מוזרק ל-process.env.API_KEY
      apiKey = process.env.API_KEY;
    }
  }
  
  if (!apiKey) {
    console.error("Missing API Key");
    return null;
  }
  
  return new GoogleGenAI({ apiKey });
}

export async function getMentorAdvice(stage: string, currentData: any) {
  const ai = await getAIClient();
  if (!ai) return null;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `שלב נוכחי בסדנה: ${stage}. נתוני תוכנית קיימים: ${JSON.stringify(currentData)}.
      תן ייעוץ אסטרטגי קצר, דוגמה לניסוח מעולה ותובנה פילוסופית על ניהול בשלב זה.`,
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
    const text = response.text || "{}";
    return JSON.parse(cleanJsonString(text));
  } catch (error) {
    console.error("AI Advice Error:", error);
    return null;
  }
}

export async function generateFunnelDraft(type: string, currentData: any) {
  const ai = await getAIClient();
  if (!ai) throw new Error("API_KEY_MISSING");

  try {
    const prompt = `בהתבסס על הנתונים הבאים: ${JSON.stringify(currentData)},
    ייצר 3 הצעות ל${type} (מטרות/יעדים/משימות) שמתאימות לשפ"ח מקצועי.
    היה יצירתי והשתמש בשפה ניהולית גבוהה.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
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
    const text = response.text || '{"items":[]}';
    return JSON.parse(cleanJsonString(text));
  } catch (error) {
    console.error("AI Draft Error:", error);
    throw error;
  }
}

export async function integrateFullPlanWithAI(plan: WorkPlan): Promise<WorkPlan> {
  const ai = await getAIClient();
  if (!ai) throw new Error("API_KEY_MISSING");

  try {
    const prompt = `בצע שכתוב אסטרטגי מלא ואינטגרציה לכל חלקי התוכנית: ${JSON.stringify(plan)}.
    הפוך את השפה למקצועית ביותר, וודא קוהרנטיות בין החזון, המטרות והמשימות.
    הוסף תובנות AI (aiInsight) לכל יעד וחידודים (aiRefinement) לכל מטרה.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
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
    if (error.message?.includes("Requested entity was not found") && window.aistudio) {
      await window.aistudio.openSelectKey();
    }
    throw error;
  }
}
