
import { GoogleGenAI, Type } from "@google/genai";
import { WorkPlan } from "../types.ts";

const getSafeApiKey = () => {
  try {
    return process.env.API_KEY || (window as any).process?.env?.API_KEY || "";
  } catch {
    return "";
  }
};

const getAIInstance = () => {
  const apiKey = getSafeApiKey();
  if (!apiKey) {
    console.warn("⚠️ Gemini API Key missing.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

const EXPERT_SYSTEM_INSTRUCTION = `
אתה "אסטרטג-על" ויועץ בכיר למנהלי שירותים פסיכולוגיים ציבוריים.
תפקידך לשדרג תוכניות עבודה גולמיות לתוצר ברמה של מנכ"ל.
הפלט חייב להיות JSON סדור ומדויק.
`;

async function callWithRetry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      if (i < maxRetries - 1) await new Promise(r => setTimeout(r, 1000));
    }
  }
  throw lastError;
}

export async function getMentorAdvice(stage: string, currentData: any) {
  const ai = getAIInstance();
  if (!ai) return { content: "שירות AI לא זמין", example: "", suggestions: [], philosophicalInsight: "נדרש מפתח API לפונקציונליות זו." };

  return callWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `שלב: ${stage}. נתונים: ${JSON.stringify(currentData)}.`,
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
  const ai = getAIInstance();
  if (!ai) return { items: ["(מפתח API חסר)"] };

  const prompt = `בהתבסס על SWOT: ${JSON.stringify(currentData.swot)}, תן 3 הצעות ל${stage}.`;
  
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
  return JSON.parse(response.text || '{"items":[]}');
}

export async function integrateFullPlanWithAI(plan: WorkPlan): Promise<WorkPlan> {
  const ai = getAIInstance();
  if (!ai) return plan;

  const prompt = `בצע שכתוב ואינטגרציה מלאה לתוכנית: ${JSON.stringify(plan)}.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
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

  const enhancedData = JSON.parse(response.text || "{}");
  return { ...plan, ...enhancedData };
}
