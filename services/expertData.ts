
import { WorkshopStage, WorkshopActivity } from '../types';

export const WORKSHOP_ACTIVITIES: Record<string, WorkshopActivity> = {
  [WorkshopStage.SWOT_ANALYSIS]: {
    title: "התבוננות יחידתית (SWOT)",
    type: 'individual',
    instruction: "התבוננו בשפ״ח כיחידה ארגונית, לא כאנשים פרטיים.",
    questions: [
      "מהם המיקודים המרכזיים שאנחנו מתמודדים איתם בשנה הקרובה?",
      "איזו חוזקה ארגונית שלנו היא 'נכס צאן ברזל' שלא נרצה לאבד?",
      "איזה איום חיצוני מחייב אותנו להיערך אחרת כבר עכשיו?"
    ]
  },
  [WorkshopStage.VISION_ETHOS]: {
    title: "זיקוק המצפן: שיחה בזוגות",
    type: 'pairs',
    instruction: "דברו על ה'לב' המקצועי שנותן משמעות לעבודה שלכם.",
    questions: [
      "לו הייתם צריכים לכתוב את 'האני מאמין' שלנו על גלויה, מה היה כתוב בה?",
      "איך החזון הזה פוגש את המיקודים שהגדרנו בשלב הקודם?"
    ]
  },
  [WorkshopStage.REALITY_CHECK]: {
    title: "עוגני מציאות: זיקוק אישי",
    type: 'individual',
    instruction: "בואו נמפה את המכשולים ונמצא את המשאבים שיעזרו לנו לעבור אותם.",
    questions: [
      "מהו המחסום המרכזי שעלול לעצור אותנו?",
      "איזה כוח פנימי שלנו יעזור לנו 'לפרק' את המחסום הזה?"
    ]
  }
};

export const PROFESSIONAL_GUIDANCE: Record<string, any> = {
  [WorkshopStage.SWOT_ANALYSIS]: {
    insight: "ה-SWOT הוא בסיס הנתונים לכל התוכנית. אל תחששו להציף חולשות ארגוניות.",
    example: "חוזקה: גמישות במעבר לחירום. חולשה: חוסר בתיעוד דיגיטלי סדור."
  },
  [WorkshopStage.STRATEGIC_OBJECTIVES]: {
    insight: "מטרת על היא הכיוון הכללי. היא לא צריכה להיות מדידה עדיין, אלא מעוררת השראה.",
    example: "מטרה: העמקת המענה המקצועי בתחום הגיל הרך."
  },
  [WorkshopStage.OPERATIONAL_GOALS]: {
    insight: "כאן אנחנו הופכים ליעדים מדידים (SMART). מה יחשב כהצלחה?",
    example: "יעד: בניית 3 קבוצות הדרכה להורי גנים עד סוף דצמבר."
  },
  [WorkshopStage.DETAILED_TASKS]: {
    insight: "משימה היא פעולה פשוטה ביומן. מי עושה מה ומתי?",
    example: "משימה: שליחת מייל לגננות לגבי פתיחת ההרשמה לקבוצה."
  }
};
