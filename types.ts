
export enum WorkshopStage {
  INTRO = 'INTRO',
  SWOT_ANALYSIS = 'SWOT_ANALYSIS',
  VISION_ETHOS = 'VISION_ETHOS',
  REALITY_CHECK = 'REALITY_CHECK',
  STRATEGIC_OBJECTIVES = 'STRATEGIC_OBJECTIVES',
  OPERATIONAL_GOALS = 'OPERATIONAL_GOALS',
  DETAILED_TASKS = 'DETAILED_TASKS',
  FINAL_DASHBOARD = 'FINAL_DASHBOARD'
}

export type ActivityType = 'individual' | 'pairs' | 'group';

export interface WorkshopActivity {
  title: string;
  instruction: string;
  type: ActivityType;
  questions: string[];
}

export interface Task {
  id: string;
  description: string;
  owner: string;
  deadline: string;
  priority: 'קריטי' | 'חשוב' | 'רצוי';
  isAiSuggested?: boolean;
}

export interface Goal {
  id: string;
  parentObjectiveId: string;
  title: string;
  tasks: Task[];
  aiInsight?: string;
}

export interface Objective {
  id: string;
  title: string;
  aiRefinement?: string;
}

export interface RealityConstraint {
  id: string;
  category: string;
  detail: string;
  resourceToLeverage: string;
}

export interface SWOTData {
  focalPoints: string;
  strengths: string;
  weaknesses: string;
  opportunities: string;
  threats: string;
}

export interface WorkPlan {
  swot: SWOTData;
  vision: string;
  ethos: string;
  realityConstraints: RealityConstraint[];
  objectives: Objective[];
  goals: Goal[];
  expertAnalysis?: string;
}

export interface AIAdvice {
  content: string;
  example: string;
  nextStepConnection: string;
  suggestions: string[];
  philosophicalInsight: string;
}
