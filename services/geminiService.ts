
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
עליך להחזיר אך ורק JSON תקין ומדויק.
`;

/**
 * פונקציית עזר ליצירת מופע AI.
 * המפתח נלקח תמיד מ-process.env.API_KEY שמוזרק על ידי הסביבה.
 */
function getAI() {
  return new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
}

export async function getMentorAdvice(stage: string, currentData: any) {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `שלב נוכחי: ${stage}. נתונים: ${JSON.stringify(currentData)}. תן ייעוץ אסטרטגי קצר, דוגמה ותובנה פילוסופית.`,
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
    return JSON.parse(cleanJsonString(response.text || "{}"));
  } catch (error: any) {
    console.error("Advice Error:", error);
    return null;
  }
}

export async function generateFunnelDraft(type: string, currentData: any) {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `ייצר 3 הצעות ל${type} עבור שפ"ח על בסיס הנתונים: ${JSON.stringify(currentData)}`,
      config: {
        systemInstruction: EXPERT_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: { 
            items: { type: Type.ARRAY, items: { type: Type.STRING } } 
          },
          required: ["items"]
        }
      }
    });
    return JSON.parse(cleanJsonString(response.text || '{"items":[]}'));
  } catch (error: any) {
    console.error("Draft Error:", error);
    return { items: [] };
  }
}

export async function integrateFullPlanWithAI(plan: WorkPlan): Promise<WorkPlan> {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `בצע שכתוב אסטרטגי מלא לתוכנית: ${JSON.stringify(plan)}`,
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
                properties: { 
                  id: { type: Type.STRING }, 
                  title: { type: Type.STRING }, 
                  aiRefinement: { type: Type.STRING } 
                },
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
                      properties: { 
                        id: { type: Type.STRING }, 
                        description: { type: Type.STRING }, 
                        owner: { type: Type.STRING }, 
                        deadline: { type: Type.STRING }, 
                        isAiSuggested: { type: Type.BOOLEAN } 
                      },
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
    if (!text) throw new Error("Empty AI response");
    return JSON.parse(cleanJsonString(text));
  } catch (error: any) {
    console.error("Integration Error:", error);
    throw error;
  }
}
