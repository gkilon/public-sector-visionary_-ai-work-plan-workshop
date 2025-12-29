
import { GoogleGenAI, Type } from "@google/genai";
import { WorkPlan } from "../types.ts";

const EXPERT_SYSTEM_INSTRUCTION = `
אתה "אסטרטג-על" ויועץ בכיר למנהלי שירותים פסיכולוגיים ציבוריים.
תפקידך לשדרג תוכניות עבודה גולמיות לתוצר ברמה של מנכ"ל.
אתה מתמקד בשימוש נכון ב-SWOT, חזון ואילוצים כדי ליצור מטרות ויעדים קוהרנטיים.
הפלט חייב להיות JSON סדור ומדויק בלבד.
אל תוסיף הסברים או טקסט מחוץ ל-JSON.
`;

export async function getMentorAdvice(stage: string, currentData: any) {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY missing");
    return null;
  }
  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `שלב נוכחי בסדנה: ${stage}. נתוני התוכנית: ${JSON.stringify(currentData)}. תן ייעוץ קצר וממוקד למנהל.`,
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
  } catch (error) {
    console.error("AI Advice Error:", error);
    return null;
  }
}

export async function generateFunnelDraft(stage: string, currentData: any) {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return { items: [] };
  const ai = new GoogleGenAI({ apiKey });

  try {
    const prompt = `בהתבסס על הנתונים הבאים: ${JSON.stringify(currentData)}, ייצר 3 הצעות ל${stage} מקצועיות לשירות פסיכולוגי ציבורי.`;
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
  } catch (error) {
    console.error("AI Draft Error:", error);
    return { items: [] };
  }
}

export async function integrateFullPlanWithAI(plan: WorkPlan): Promise<WorkPlan> {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return plan;
  const ai = new GoogleGenAI({ apiKey });

  try {
    const prompt = `בצע שכתוב אסטרטגי מלא לכל חלקי התוכנית: ${JSON.stringify(plan)}. הפוך אותה לחדה ומקצועית.`;
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

    const enhancedData = JSON.parse(response.text || "{}");
    return { ...plan, ...enhancedData };
  } catch (error) {
    console.error("Integration Error:", error);
    return plan;
  }
}
