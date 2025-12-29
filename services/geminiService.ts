
import { GoogleGenAI, Type } from "@google/genai";
import { WorkPlan } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const EXPERT_SYSTEM_INSTRUCTION = `
אתה "אסטרטג-על" ויועץ בכיר למנהלי שירותים פסיכולוגיים ציבוריים.
תפקידך לשדרג תוכניות עבודה גולמיות לתוצר ברמה של מנכ"ל:
1. "שכתוב אסטרטגי": קח את המטרות והיעדים של המשתמש ושכתב אותם לשפה חדה, מדידה ומקצועית (למשל, במקום "לתת מענה להורים" השתמש ב"הנגשת התערבות ממוקדת הורות לחיזוק החוסן הקהילתי").
2. "חיבור SWOT": וודא שכל יעד עונה על איום או ממנף חוזקה שהוזכרו ב-SWOT.
3. "משימות חסרות": הוסף משימות ביצועיות קונקרטיות שהמנהל שכח (כגון: "בניית מחוון להערכה", "מיפוי משאבים תקציביים").
4. "ניתוח מומחה": כתוב סיכום מקצועי קצר שנותן למנהל ביטחון בדרך שלו.
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
  const prompt = `בצע שכתוב ואינטגרציה מלאה לתוכנית: ${JSON.stringify(plan)}. 
  1. שכתב את כותרות המטרות והיעדים לשפה אסטרטגית.
  2. לכל יעד, הוסף 2-3 משימות אופרטיביות חדשות (isAiSuggested: true).
  3. הוסף 'aiInsight' לכל יעד שמסביר את הלוגיקה שלו ביחס ל-SWOT.
  4. ספק 'expertAnalysis' כולל ומעצים.`;

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
