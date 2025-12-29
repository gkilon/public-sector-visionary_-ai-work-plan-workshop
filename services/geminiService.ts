
import { GoogleGenAI, Type } from "@google/genai";
import { WorkPlan } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const EXPERT_SYSTEM_INSTRUCTION = `
אתה "אסטרטג על" ומומחה לבניית תוכניות עבודה בשירותים פסיכולוגיים ציבוריים.
תפקידך אינו טכני בלבד - עליך להפעיל שיקול דעת מקצועי:
1. "שכתוב לשיפור": קח את המטרות הגולמיות של המשתמש והפוך אותן לניסוחים חדים, מקצועיים ומניעים לפעולה.
2. "סגירת פערים": אם ב-SWOT מופיע איום או חולשה, ואין להם מענה בטבלת המשימות - עליך לייצר משימה חדשה שנותנת מענה ספציפי לכך.
3. "דיוק היעדים": הפוך יעדים אמורפיים ליעדים מדידים (SMART).
4. "אינטגרציה": וודא שהחזון מורגש בתוך המשימות הקטנות.

הפלט חייב להיות JSON סדור ומדויק.
`;

async function callWithRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const errorStr = JSON.stringify(error).toUpperCase();
      if ((errorStr.includes("429") || errorStr.includes("RESOURCE_EXHAUSTED")) && i < maxRetries - 1) {
        await new Promise(r => setTimeout(r, 2000 * Math.pow(2, i)));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

export async function getMentorAdvice(stage: string, currentData: any) {
  const model = 'gemini-3-flash-preview';
  return callWithRetry(async () => {
    const response = await ai.models.generateContent({
      model,
      contents: `שלב: ${stage}. נתונים: ${JSON.stringify(currentData)}. ספק זיקוק אסטרטגי.`,
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
    return JSON.parse(response.text || "{}");
  });
}

export async function generateFunnelDraft(stage: string, currentData: any) {
  const model = 'gemini-3-flash-preview';
  const prompt = `בהתבסס על SWOT: ${JSON.stringify(currentData.swot)}, חזון: ${currentData.vision} ואילוצים: ${JSON.stringify(currentData.realityConstraints)}, תן לי 3 הצעות ל${stage === 'objectives' ? 'מטרות על' : stage === 'goals' ? 'יעדים אופרטיביים' : 'משימות לביצוע'}.`;
  
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
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
  return JSON.parse(response.text || '{"items":[]}');
}

export async function integrateFullPlanWithAI(plan: WorkPlan): Promise<WorkPlan> {
  const model = 'gemini-3-flash-preview';
  const prompt = `בצע אינטגרציה מוחלטת לתוכנית הבאה. שכתב מטרות, הוסף משימות חסרות שנובעות מה-SWOT ומהאילוצים: ${JSON.stringify(plan)}. 
  לכל מטרה (objective), שכתב את הכותרת שתהיה ברמת מומחה.
  לכל יעד (goal), הוסף תובנה עמוקה המקשרת אותו לחולשות או איומים מה-SWOT.
  הוסף לפחות 2 משימות חדשות לכל יעד שהן קריטיות להצלחה ולא נכתבו ע"י המשתמש.`;

  const response = await ai.models.generateContent({
    model,
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

  const enhancedData = JSON.parse(response.text || "{}");
  return {
    ...plan,
    objectives: enhancedData.objectives,
    goals: enhancedData.goals,
    expertAnalysis: enhancedData.expertAnalysis
  };
}
