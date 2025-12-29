
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ChevronRight, ChevronLeft, ShieldCheck, Target, Zap, 
  Plus, Trash2, Layers, Printer, Activity, 
  User, MessageCircle, Search, Info, ClipboardList, Sparkles, 
  Wand2, BrainCircuit, RefreshCw, AlertTriangle, ArrowRight
} from 'lucide-react';
import { WorkshopStage, WorkPlan, AIAdvice } from './types.ts';
import { getMentorAdvice, generateFunnelDraft, integrateFullPlanWithAI } from './services/geminiService.ts';
import { PROFESSIONAL_GUIDANCE, WORKSHOP_ACTIVITIES } from './services/expertData.ts';
import StageWrapper from './components/StageWrapper.tsx';
import AIMentor from './components/AIMentor.tsx';

const INITIAL_PLAN: WorkPlan = {
  swot: { focalPoints: '', strengths: '', weaknesses: '', opportunities: '', threats: '' },
  vision: '',
  ethos: '',
  realityConstraints: [],
  objectives: [{ id: 'obj-1', title: '' }],
  goals: []
};

function App() {
  const [stage, setStage] = useState<WorkshopStage>(WorkshopStage.INTRO);
  const [plan, setPlan] = useState<WorkPlan>(INITIAL_PLAN);
  const [aiAdvice, setAiAdvice] = useState<AIAdvice | null>(null);
  const [isAdviceLoading, setIsAdviceLoading] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [isAiDrafting, setIsAiDrafting] = useState<string | null>(null); // שומר את סוג הדיראפט שנטען
  const [isIntegrating, setIsIntegrating] = useState(false);
  
  const adviceCache = useRef<Record<string, AIAdvice>>({});
  const activeRequestRef = useRef<string | null>(null);
  const lastStageRef = useRef<WorkshopStage | null>(null);
  const stagesSequence = Object.values(WorkshopStage);

  // פונקציה להצגת ייעוץ AI - מופעלת רק כשעוברים שלב
  const fetchAdvice = useCallback(async (targetStage: WorkshopStage) => {
    if (targetStage === WorkshopStage.INTRO || targetStage === WorkshopStage.FINAL_DASHBOARD) {
      setAiAdvice(null);
      return;
    }
    
    if (adviceCache.current[targetStage]) {
      setAiAdvice(adviceCache.current[targetStage]);
      return;
    }

    const requestId = Math.random().toString(36);
    activeRequestRef.current = requestId;
    setIsAdviceLoading(true);
    
    try {
      const advice = await getMentorAdvice(targetStage, plan);
      if (activeRequestRef.current === requestId && advice) {
        setAiAdvice(advice);
        adviceCache.current[targetStage] = advice;
      }
    } catch (e) { 
      console.error("AI Advice Error:", e);
    } finally { 
      if (activeRequestRef.current === requestId) setIsAdviceLoading(false); 
    }
  }, [plan]);

  // האפקט המרכזי ששולט במעברי שלבים - מונע הקפצה חוזרת של החלון בזמן הקלדה
  useEffect(() => {
    if (lastStageRef.current !== stage) {
      fetchAdvice(stage);
      setShowActivity(!!WORKSHOP_ACTIVITIES[stage]);
      lastStageRef.current = stage;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [stage, fetchAdvice]);

  const updatePlan = (updates: Partial<WorkPlan>) => setPlan(prev => ({ ...prev, ...updates }));

  const handleAiDraft = async (funnelType: 'objectives' | 'goals' | 'tasks', parentId?: string) => {
    const loadingKey = parentId ? `${funnelType}-${parentId}` : funnelType;
    setIsAiDrafting(loadingKey);
    
    try {
      const draft = await generateFunnelDraft(funnelType, plan);
      if (draft && draft.items && draft.items.length > 0) {
        if (funnelType === 'objectives') {
          const newObjs = draft.items.map((t: string) => ({ id: `obj-${Math.random()}`, title: t }));
          updatePlan({ objectives: [...plan.objectives, ...newObjs] });
        } else if (funnelType === 'goals' && parentId) {
          const newGoals = draft.items.map((t: string) => ({ id: `goal-${Math.random()}`, parentObjectiveId: parentId, title: t, tasks: [] }));
          updatePlan({ goals: [...plan.goals, ...newGoals] });
        } else if (funnelType === 'tasks' && parentId) {
          const newTasks = draft.items.map((t: string) => ({ id: `task-${Math.random()}`, description: t, owner: 'הצעה', deadline: '2025', priority: 'חשוב' }));
          updatePlan({ goals: plan.goals.map(g => g.id === parentId ? { ...g, tasks: [...g.tasks, ...newTasks] } : g) });
        }
      } else {
        alert("ה-AI לא הצליח לייצר הצעות כרגע. נסה שוב בעוד דקה.");
      }
    } catch (e) { 
      console.error(e);
      alert("שגיאה בתקשורת עם שרת ה-AI. וודא שמפתח ה-API מוגדר כראוי.");
    } finally { 
      setIsAiDrafting(null); 
    }
  };

  const runFullIntegration = async () => {
    setIsIntegrating(true);
    try {
      const enhanced = await integrateFullPlanWithAI(plan);
      if (enhanced) {
        setPlan(enhanced);
      }
    } catch (e) { 
      console.error(e);
      alert("שגיאה באינטגרציה. נסה שוב.");
    } finally { 
      setIsIntegrating(false); 
    }
  };

  const renderWorkshopActivity = () => {
    const activity = WORKSHOP_ACTIVITIES[stage];
    if (!showActivity || !activity) return null;

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn print:hidden">
        <div className="bg-[#0f172a] border-2 border-emerald-500/40 rounded-3xl max-w-2xl w-full p-8 shadow-[0_0_60px_rgba(16,185,129,0.3)] space-y-6 text-right" dir="rtl">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-400">
                <MessageCircle size={24} />
              </div>
              <h3 className="text-2xl font-black text-white">{activity.title}</h3>
            </div>
            <button onClick={() => setShowActivity(false)} className="text-slate-500 hover:text-white transition-colors bg-white/5 p-2 rounded-full">
              <Plus size={24} className="rotate-45" />
            </button>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-2xl italic text-emerald-50 text-lg leading-relaxed">{activity.instruction}</div>
          <div className="space-y-4">
            {activity.questions.map((q, idx) => (
              <div key={idx} className="flex gap-4 items-start bg-slate-800/80 p-5 rounded-2xl border border-white/5 shadow-lg">
                <span className="bg-emerald-600 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-black shrink-0 mt-1 shadow-md">{idx + 1}</span>
                <p className="text-slate-100 font-semibold leading-relaxed text-base">{q}</p>
              </div>
            ))}
          </div>
          <button onClick={() => setShowActivity(false)} className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black text-xl hover:bg-emerald-500 transition-all shadow-xl active:scale-[0.98]">הבנתי, בואו נתחיל למלא</button>
        </div>
      </div>
    );
  };

  const renderStage = () => {
    const inputClasses = "w-full bg-slate-900 p-4 rounded-xl border border-white/20 focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all placeholder:text-slate-600 text-white font-medium";
    const labelClasses = "block text-xs font-black text-slate-500 uppercase tracking-widest mb-2";

    switch (stage) {
      case WorkshopStage.INTRO:
        return (
          <div className="space-y-12 py-10 text-center animate-fadeIn">
            <div className="space-y-6">
              <div className="inline-flex p-6 bg-emerald-600/10 text-emerald-400 rounded-3xl border border-emerald-500/20 shadow-2xl mb-4">
                <BrainCircuit size={80} />
              </div>
              <h1 className="text-8xl font-black text-white tracking-tighter">מצפן ניהול שפ"ח</h1>
              <p className="text-2xl text-slate-400 max-w-2xl mx-auto italic font-light">פלטפורמה אסטרטגית לבניית תוכניות עבודה חכמות.</p>
            </div>
            <button onClick={() => setStage(WorkshopStage.SWOT_ANALYSIS)} className="bg-emerald-600 text-white px-20 py-7 rounded-3xl font-black text-3xl hover:bg-emerald-500 shadow-[0_20px_50px_rgba(16,185,129,0.3)] active:scale-95 transition-all">התחלת הסדנה</button>
          </div>
        );

      case WorkshopStage.SWOT_ANALYSIS:
        return (
          <StageWrapper title="שלב 1: התבוננות ומיקוד" subtitle="ניתוח SWOT ומיקודים שנתיים" icon={<Activity size={28} />}>
            <div className="space-y-8 pb-32">
              <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/10 shadow-inner">
                <label className={labelClasses}>מהם המיקודים המרכזיים שלנו לתקופה הקרובה?</label>
                <textarea className={`${inputClasses} min-h-[120px] border-emerald-500/30`} value={plan.swot.focalPoints} onChange={e => updatePlan({ swot: { ...plan.swot, focalPoints: e.target.value } })} placeholder="הגדרת זירת הפעולה של השפ״ח השנה..." />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <label className={labelClasses}>חוזקות ארגוניות (פנימי)</label>
                    <textarea className={inputClasses} value={plan.swot.strengths} onChange={e => updatePlan({ swot: { ...plan.swot, strengths: e.target.value } })} placeholder="מה הכוח שלנו כיחידה?" />
                  </div>
                  <div>
                    <label className={labelClasses}>חולשות ארגוניות (פנימי)</label>
                    <textarea className={inputClasses} value={plan.swot.weaknesses} onChange={e => updatePlan({ swot: { ...plan.swot, weaknesses: e.target.value } })} placeholder="איפה אנחנו מתקשים בתפעול?" />
                  </div>
                </div>
                <div className="space-y-6">
                  <div>
                    <label className={labelClasses}>הזדמנויות חיצוניות</label>
                    <textarea className={inputClasses} value={plan.swot.opportunities} onChange={e => updatePlan({ swot: { ...plan.swot, opportunities: e.target.value } })} placeholder="תקציבים, שותפויות..." />
                  </div>
                  <div>
                    <label className={labelClasses}>איומים חיצוניים</label>
                    <textarea className={inputClasses} value={plan.swot.threats} onChange={e => updatePlan({ swot: { ...plan.swot, threats: e.target.value } })} placeholder="שינויי מדיניות, קיצוצים..." />
                  </div>
                </div>
              </div>
            </div>
          </StageWrapper>
        );

      case WorkshopStage.VISION_ETHOS:
        return (
          <StageWrapper title="שלב 2: זהות ומצפן" subtitle="חזון ואתוס מקצועי" icon={<ShieldCheck size={28} />}>
            <div className="space-y-8 pb-32">
              <div className="bg-slate-900/40 p-8 rounded-[40px] border border-emerald-500/10">
                <label className={labelClasses}>חזון היחידה (היעד העליון)</label>
                <textarea className={`${inputClasses} min-h-[180px] text-3xl font-black text-emerald-400 bg-transparent border-none focus:ring-0 leading-tight text-center`} value={plan.vision} onChange={e => updatePlan({ vision: e.target.value })} placeholder="נסחו משפט עוצמתי אחד..." />
              </div>
              <div>
                <label className={labelClasses}>אתוס (ערכי העבודה)</label>
                <input className={inputClasses} value={plan.ethos} onChange={e => updatePlan({ ethos: e.target.value })} placeholder="למשל: מקצועיות, שקיפות, זמינות..." />
              </div>
            </div>
          </StageWrapper>
        );

      case WorkshopStage.REALITY_CHECK:
        return (
          <StageWrapper title="שלב 3: עוגני מציאות" subtitle="מיפוי אילוצים ומענים" icon={<Search size={28} />}>
            <div className="space-y-6 pb-32">
              <div className="overflow-x-auto rounded-3xl border border-white/10 shadow-2xl">
                <table className="w-full text-right border-collapse bg-slate-900/30">
                  <thead className="bg-slate-800/80">
                    <tr>
                      <th className="p-5 text-xs font-black text-slate-400 uppercase tracking-widest">אילוץ / קושי</th>
                      <th className="p-5 text-xs font-black text-slate-400 uppercase tracking-widest">פירוט</th>
                      <th className="p-5 text-xs font-black text-slate-400 uppercase tracking-widest">חוזק לשימוש</th>
                      <th className="p-5 w-14"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {plan.realityConstraints.map(c => (
                      <tr key={c.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="p-3"><input className="w-full bg-transparent border-none text-white focus:ring-0 text-sm font-bold" value={c.category} onChange={e => updatePlan({ realityConstraints: plan.realityConstraints.map(rc => rc.id === c.id ? {...rc, category: e.target.value} : rc) })} placeholder="סוג האילוץ" /></td>
                        <td className="p-3"><input className="w-full bg-transparent border-none text-slate-300 focus:ring-0 text-sm" value={c.detail} onChange={e => updatePlan({ realityConstraints: plan.realityConstraints.map(rc => rc.id === c.id ? {...rc, detail: e.target.value} : rc) })} placeholder="פירוט האילוץ..." /></td>
                        <td className="p-3"><input className="w-full bg-transparent border-none text-emerald-400 focus:ring-0 text-sm font-bold" value={c.resourceToLeverage} onChange={e => updatePlan({ realityConstraints: plan.realityConstraints.map(rc => rc.id === c.id ? {...rc, resourceToLeverage: e.target.value} : rc) })} placeholder="המענה מהמערכת" /></td>
                        <td className="p-3 text-center"><button onClick={() => updatePlan({ realityConstraints: plan.realityConstraints.filter(rc => rc.id !== c.id) })} className="text-slate-600 hover:text-red-400 transition-colors"><Trash2 size={18}/></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button onClick={() => updatePlan({ realityConstraints: [...plan.realityConstraints, { id: Date.now().toString(), category: '', detail: '', resourceToLeverage: '' }] })} className="w-full py-5 border-2 border-dashed border-white/10 rounded-2xl flex items-center justify-center gap-3 text-emerald-400 font-black hover:bg-emerald-500/10 hover:border-emerald-500/50 transition-all mt-4"><Plus size={24} /> הוספת אילוץ חדש</button>
            </div>
          </StageWrapper>
        );

      case WorkshopStage.STRATEGIC_OBJECTIVES:
        return (
          <StageWrapper title="שלב 4: מטרות על" subtitle="הגדרת הכיוונים האסטרטגיים" icon={<Target size={28} />}>
            <div className="space-y-6 pb-32">
              <div className="flex justify-between items-center mb-6">
                <p className="text-slate-400 text-sm italic font-light">המטרות שנגזרות מהחזון ומהמיקודים שהגדרנו.</p>
                <button 
                  onClick={() => handleAiDraft('objectives')} 
                  disabled={isAiDrafting === 'objectives'} 
                  className="bg-emerald-600/30 text-emerald-300 px-6 py-3 rounded-2xl text-xs font-black flex items-center gap-2 hover:bg-emerald-600/50 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] border border-emerald-500/20 active:scale-95 disabled:opacity-50"
                >
                  {isAiDrafting === 'objectives' ? <RefreshCw className="animate-spin" size={16}/> : <Wand2 size={16} />} 
                  ייצר מטרות חכמות בעזרת AI
                </button>
              </div>
              <div className="space-y-5">
                {plan.objectives.map(obj => (
                  <div key={obj.id} className="flex gap-5 items-center bg-slate-900/80 p-5 rounded-2xl border border-white/10 group shadow-lg">
                    <div className="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 shrink-0">
                      <Target size={24} />
                    </div>
                    <input className="w-full bg-transparent border-none text-white text-xl font-bold focus:ring-0 placeholder:text-slate-700" value={obj.title} onChange={e => updatePlan({ objectives: plan.objectives.map(o => o.id === obj.id ? { ...o, title: e.target.value } : o) })} placeholder="נסחו מטרת על אסטרטגית..." />
                    <button onClick={() => updatePlan({ objectives: plan.objectives.filter(o => o.id !== obj.id) })} className="text-slate-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={20} /></button>
                  </div>
                ))}
                <button onClick={() => updatePlan({ objectives: [...plan.objectives, { id: Date.now().toString(), title: '' }] })} className="w-full py-5 border-2 border-dashed border-white/10 rounded-2xl text-emerald-400 font-black flex items-center justify-center gap-3 hover:bg-white/5 transition-all"><Plus size={24} /> הוספת מטרה נוספת</button>
              </div>
            </div>
          </StageWrapper>
        );

      case WorkshopStage.OPERATIONAL_GOALS:
        return (
          <StageWrapper title="שלב 5: יעדים אופרטיביים" subtitle="גזירת יעדים מדידים" icon={<Layers size={28} />}>
            <div className="space-y-12 pb-32">
              {plan.objectives.map(obj => (
                <div key={obj.id} className="bg-slate-900/60 p-8 rounded-[32px] border border-white/10 space-y-6 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-2 h-full bg-emerald-500/40"></div>
                  <div className="flex justify-between items-center border-b border-white/5 pb-4">
                    <h3 className="text-emerald-400 text-xl font-black flex items-center gap-3"><Target size={24}/> {obj.title || "מטרה ללא כותרת"}</h3>
                    <button 
                      onClick={() => handleAiDraft('goals', obj.id)} 
                      disabled={isAiDrafting === `goals-${obj.id}`} 
                      className="text-xs font-black bg-emerald-500/10 text-emerald-300 px-5 py-2.5 rounded-xl hover:bg-emerald-500/20 transition-all border border-emerald-500/20 active:scale-95 disabled:opacity-50"
                    >
                      {isAiDrafting === `goals-${obj.id}` ? <RefreshCw className="animate-spin" size={14}/> : <Sparkles size={14}/>}
                      הצעת AI ליעדים
                    </button>
                  </div>
                  <div className="space-y-4">
                    {plan.goals.filter(g => g.parentObjectiveId === obj.id).map(goal => (
                      <div key={goal.id} className="flex gap-4 items-center bg-black/40 p-4 rounded-2xl border border-white/5 group shadow-inner">
                        <input className="w-full bg-transparent border-none text-white font-bold focus:ring-0 text-lg placeholder:text-slate-800" value={goal.title} onChange={e => updatePlan({ goals: plan.goals.map(g => g.id === goal.id ? { ...g, title: e.target.value } : g) })} placeholder="הגדר יעד אופרטיבי (SMART)..." />
                        <button onClick={() => updatePlan({ goals: plan.goals.filter(g => g.id !== goal.id) })} className="text-slate-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={18} /></button>
                      </div>
                    ))}
                    <button onClick={() => updatePlan({ goals: [...plan.goals, { id: Date.now().toString(), parentObjectiveId: obj.id, title: '', tasks: [] }] })} className="text-emerald-400/70 text-sm font-black flex items-center gap-2 hover:text-emerald-400 transition-colors p-2 rounded-lg bg-emerald-500/5 w-fit"><Plus size={18} /> הוספת יעד אופרטיבי</button>
                  </div>
                </div>
              ))}
            </div>
          </StageWrapper>
        );

      case WorkshopStage.DETAILED_TASKS:
        return (
          <StageWrapper title="שלב 6: משימות ולו״ז" subtitle="יורדים לרמת הביצוע" icon={<ClipboardList size={28} />}>
            <div className="space-y-12 pb-32">
              {plan.goals.length === 0 ? (
                <div className="bg-slate-900/50 p-12 rounded-[40px] border border-white/10 text-center space-y-6">
                  <div className="p-6 bg-amber-500/10 text-amber-500 rounded-full w-fit mx-auto border border-amber-500/20">
                    <AlertTriangle size={48} />
                  </div>
                  <h3 className="text-3xl font-black text-white">לא הוגדרו יעדים אופרטיביים</h3>
                  <p className="text-slate-400 max-w-md mx-auto text-xl">כדי להגדיר משימות, עלינו קודם כל לגזור יעדים מהמטרות האסטרטגיות בשלב הקודם.</p>
                  <button onClick={() => setStage(WorkshopStage.OPERATIONAL_GOALS)} className="bg-emerald-600 text-white px-10 py-4 rounded-2xl font-black flex items-center gap-3 mx-auto hover:bg-emerald-500 transition-all shadow-xl">
                    <ArrowRight className="rotate-180" size={24} /> חזור להגדרת יעדים
                  </button>
                </div>
              ) : (
                plan.goals.map(goal => (
                  <div key={goal.id} className="bg-slate-900/70 p-8 rounded-[36px] border-r-8 border-emerald-500 space-y-6 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] border border-white/5 relative">
                    <div className="flex justify-between items-center border-b border-white/5 pb-4">
                      <h3 className="text-white font-black text-2xl tracking-tight">יעד: {goal.title || "יעד ללא כותרת"}</h3>
                      <button 
                        onClick={() => handleAiDraft('tasks', goal.id)} 
                        disabled={isAiDrafting === `tasks-${goal.id}`} 
                        className="text-xs font-black bg-emerald-500/10 text-emerald-300 px-6 py-3 rounded-2xl hover:bg-emerald-500/20 transition-all border border-emerald-500/20 active:scale-95 disabled:opacity-50"
                      >
                        {isAiDrafting === `tasks-${goal.id}` ? <RefreshCw className="animate-spin" size={16}/> : <Zap size={16}/>}
                        ייצר משימות AI
                      </button>
                    </div>
                    <div className="space-y-4">
                      {goal.tasks.map(task => (
                        <div key={task.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-black/40 p-5 rounded-[24px] border border-white/5 group shadow-inner">
                          <div className="md:col-span-6">
                            <input className="w-full bg-transparent border-none text-slate-100 text-lg focus:ring-0 font-bold placeholder:text-slate-800" value={task.description} onChange={e => updatePlan({ goals: plan.goals.map(g => g.id === goal.id ? { ...g, tasks: g.tasks.map(t => t.id === task.id ? { ...t, description: e.target.value } : t) } : g) })} placeholder="פירוט המשימה..." />
                          </div>
                          <div className="md:col-span-3">
                            <input className="w-full bg-slate-800/80 rounded-xl p-3 text-sm text-white border border-white/5 focus:border-emerald-500/50 outline-none" value={task.owner} onChange={e => updatePlan({ goals: plan.goals.map(g => g.id === goal.id ? { ...g, tasks: g.tasks.map(t => t.id === task.id ? { ...t, owner: e.target.value } : t) } : g) })} placeholder="גורם אחראי" />
                          </div>
                          <div className="md:col-span-2">
                            <input className="w-full bg-slate-800/80 rounded-xl p-3 text-sm text-emerald-400 font-black border border-white/5 focus:border-emerald-500/50 outline-none text-center" value={task.deadline} onChange={e => updatePlan({ goals: plan.goals.map(g => g.id === goal.id ? { ...g, tasks: g.tasks.map(t => t.id === task.id ? { ...t, deadline: e.target.value } : t) } : g) })} placeholder="מועד יעד" />
                          </div>
                          <div className="md:col-span-1 flex justify-end">
                            <button onClick={() => updatePlan({ goals: plan.goals.map(g => g.id === goal.id ? { ...g, tasks: g.tasks.filter(t => t.id !== task.id) } : g) })} className="text-slate-700 hover:text-red-400 transition-all p-2 rounded-full hover:bg-white/5"><Trash2 size={20}/></button>
                          </div>
                        </div>
                      ))}
                      <button onClick={() => updatePlan({ goals: plan.goals.map(g => g.id === goal.id ? { ...g, tasks: [...g.tasks, { id: Date.now().toString(), description: '', owner: '', deadline: '2025', priority: 'חשוב' }] } : g) })} className="text-emerald-400 text-sm font-black flex items-center gap-2 mt-4 hover:text-emerald-300 transition-all bg-emerald-500/5 p-3 rounded-2xl w-full justify-center border border-dashed border-emerald-500/20"><Plus size={20}/> הוספת משימה לביצוע</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </StageWrapper>
        );

      case WorkshopStage.FINAL_DASHBOARD:
        return (
          <div className="space-y-12 animate-fadeIn pb-40" dir="rtl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-8 border-b border-white/10 print:hidden">
              <div className="space-y-2">
                <h2 className="text-5xl font-black text-white tracking-tight">תוצר סופי: תוכנית עבודה</h2>
                <p className="text-slate-400 text-xl font-light italic">מצפן אסטרטגי משולב AI | 2025</p>
              </div>
              <div className="flex gap-4 w-full md:w-auto">
                <button 
                  onClick={runFullIntegration} 
                  disabled={isIntegrating}
                  className="flex-1 md:flex-none bg-emerald-600 text-white px-10 py-5 rounded-[24px] font-black flex items-center justify-center gap-3 hover:bg-emerald-500 shadow-[0_20px_40px_rgba(16,185,129,0.4)] transition-all disabled:opacity-50 active:scale-95"
                >
                  {isIntegrating ? <RefreshCw className="animate-spin" size={28} /> : <BrainCircuit size={28} />}
                  אינטגרציה אסטרטגית סופית
                </button>
                <button onClick={() => window.print()} className="bg-slate-800 text-white px-8 py-5 rounded-[24px] font-bold flex items-center justify-center gap-3 hover:bg-slate-700 transition-colors shadow-xl">
                  <Printer size={24} /> הדפסה
                </button>
              </div>
            </div>

            {plan.expertAnalysis && (
              <div className="bg-emerald-500/10 border-2 border-emerald-500/30 p-10 rounded-[48px] shadow-3xl relative overflow-hidden print:bg-white print:border-black print:rounded-none">
                <div className="absolute top-0 right-0 p-6 opacity-10"><Sparkles size={120} className="text-emerald-400" /></div>
                <div className="flex items-center gap-4 text-emerald-400 font-black text-xs uppercase mb-6 print:text-black tracking-[0.2em]">
                  <Sparkles size={24} className="animate-pulse" /> ניתוח מומחה אסטרטגי משולב AI
                </div>
                <p className="text-white text-3xl leading-relaxed font-bold italic print:text-black relative z-10 select-none">"{plan.expertAnalysis}"</p>
              </div>
            )}

            <div className="bg-white overflow-hidden rounded-[40px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border-4 border-black print:border-2 print:shadow-none">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-slate-900 border-b-4 border-black print:bg-slate-100">
                    <th className="p-8 border border-slate-700 text-sm font-black w-[20%] uppercase text-white tracking-widest print:text-black">מטרה אסטרטגית</th>
                    <th className="p-8 border border-slate-700 text-sm font-black w-[22%] uppercase text-white tracking-widest print:text-black">יעד אופרטיבי</th>
                    <th className="p-8 border border-slate-700 text-sm font-black w-[38%] uppercase text-white tracking-widest print:text-black">משימות מפורטות</th>
                    <th className="p-8 border border-slate-700 text-sm font-black w-[10%] text-center uppercase text-white tracking-widest print:text-black">אחראי</th>
                    <th className="p-8 border border-slate-700 text-sm font-black w-[10%] text-center uppercase text-white tracking-widest print:text-black">לו"ז</th>
                  </tr>
                </thead>
                <tbody className="text-black">
                  {plan.objectives.map(obj => {
                    const objGoals = plan.goals.filter(g => g.parentObjectiveId === obj.id);
                    if (objGoals.length === 0) return (
                      <tr key={obj.id} className="border-b-2 border-slate-300">
                        <td className="p-8 border border-slate-300 font-black bg-slate-100 text-black text-2xl align-top leading-tight">{obj.title}</td>
                        <td colSpan={4} className="border border-slate-300 italic text-slate-500 p-8 font-bold text-center text-xl">טרם הוגדרו יעדים למטרה זו</td>
                      </tr>
                    );
                    
                    return objGoals.map((goal, gIdx) => (
                      <React.Fragment key={goal.id}>
                        {goal.tasks.length === 0 ? (
                           <tr className="border-b-2 border-slate-300">
                            {gIdx === 0 && (
                              <td rowSpan={objGoals.length} className="p-8 border border-slate-300 font-black align-top bg-slate-100 text-black text-2xl leading-tight border-l-2">
                                {obj.title}
                                {obj.aiRefinement && <div className="text-[12px] text-emerald-800 mt-6 p-4 bg-emerald-100 rounded-2xl border-2 border-emerald-400 font-black print:hidden shadow-sm">💡 אסטרטגיה: {obj.aiRefinement}</div>}
                              </td>
                            )}
                            <td className="p-8 border border-slate-300 font-black bg-white text-black text-xl leading-snug border-l-2">{goal.title}</td>
                            <td colSpan={3} className="p-8 border border-slate-300 italic text-slate-400 text-center font-black">אין משימות מוגדרות</td>
                          </tr>
                        ) : goal.tasks.map((task, tIdx) => (
                          <tr key={task.id} className={`border-b-2 border-slate-300 hover:bg-slate-50 transition-colors ${task.isAiSuggested ? 'bg-emerald-50/70' : 'bg-white'}`}>
                            {gIdx === 0 && tIdx === 0 && (
                              <td rowSpan={objGoals.reduce((sum, g) => sum + Math.max(1, g.tasks.length), 0)} className="p-8 border border-slate-300 font-black align-top bg-slate-100 text-black text-2xl leading-tight border-l-4 border-l-slate-900">
                                {obj.title}
                                {obj.aiRefinement && <div className="text-[12px] text-emerald-900 mt-6 p-5 bg-emerald-200 rounded-[24px] border-2 border-emerald-500 font-black shadow-md print:hidden">💡 חידוד AI: {obj.aiRefinement}</div>}
                              </td>
                            )}
                            {tIdx === 0 && (
                              <td rowSpan={goal.tasks.length} className="p-8 border border-slate-300 font-black align-top bg-white text-black text-xl leading-snug border-l-2">
                                {goal.title}
                                {goal.aiInsight && <div className="mt-5 p-5 bg-blue-100 rounded-[20px] border-2 border-blue-400 text-[11px] text-blue-950 font-black leading-tight shadow-md print:hidden">🔍 תובנה: {goal.aiInsight}</div>}
                              </td>
                            )}
                            <td className={`p-8 border border-slate-300 text-xl font-bold text-black leading-relaxed ${task.isAiSuggested ? 'border-r-8 border-r-emerald-600' : ''}`}>
                              {task.description}
                              {task.isAiSuggested && <span className="block mt-3 text-[10px] bg-emerald-700 text-white px-4 py-1.5 rounded-full w-fit font-black uppercase tracking-widest shadow-lg print:hidden">הצעה מומחה AI</span>}
                            </td>
                            <td className="p-8 border border-slate-300 text-base text-center font-black text-slate-800 bg-slate-50/40">{task.owner}</td>
                            <td className="p-8 border border-slate-300 text-base text-center font-black text-slate-950 bg-slate-50/40">{task.deadline}</td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ));
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#050a18] text-slate-200 selection:bg-emerald-500 print:bg-white print:text-black relative">
      {renderWorkshopActivity()}
      
      <header className="glass-panel py-5 px-8 sticky top-0 z-[60] border-b border-white/10 print:hidden shadow-2xl">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-5 cursor-pointer" onClick={() => setStage(WorkshopStage.INTRO)}>
            <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white font-black shadow-[0_0_30px_rgba(16,185,129,0.5)] text-xl">ש</div>
            <h1 className="text-xl font-black text-white italic tracking-tight">מצפן ניהול שפ"ח</h1>
          </div>
          <div className="flex gap-3">
            {stagesSequence.map((s, idx) => (
              <button 
                key={s} 
                onClick={() => setStage(s)}
                className={`w-3.5 h-3.5 rounded-full transition-all duration-500 hover:scale-150 ${stage === s ? 'bg-emerald-500 scale-150 shadow-[0_0_20px_rgba(16,185,129,0.8)]' : 'bg-slate-700'}`} 
              />
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 sm:p-10 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className={`lg:col-span-${stage === WorkshopStage.INTRO || stage === WorkshopStage.FINAL_DASHBOARD ? '12' : '8'}`}>
            {renderStage()}
          </div>

          {stage !== WorkshopStage.INTRO && stage !== WorkshopStage.FINAL_DASHBOARD && (
            <div className="lg:col-span-4 lg:sticky lg:top-32 print:hidden space-y-8">
              <AIMentor advice={aiAdvice} loading={isAdviceLoading} />
              
              <div className="bg-slate-900/50 rounded-3xl p-6 border border-white/5 space-y-5 shadow-2xl">
                 <div className="flex items-center gap-3 text-emerald-400 font-black text-[11px] uppercase tracking-[0.2em] border-b border-white/5 pb-3">
                    <BrainCircuit size={16}/> כלים אסטרטגיים
                 </div>
                 <button 
                  onClick={() => handleAiDraft(stage === WorkshopStage.STRATEGIC_OBJECTIVES ? 'objectives' : (stage === WorkshopStage.OPERATIONAL_GOALS ? 'goals' : 'tasks'))}
                  disabled={isAiDrafting !== null}
                  className="w-full bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 py-4 rounded-2xl text-xs font-black border border-emerald-500/20 flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50"
                 >
                    {isAiDrafting !== null ? <RefreshCw className="animate-spin" size={16}/> : <Sparkles size={16}/>}
                    ייצר רעיונות AI לשלב זה
                 </button>
              </div>

              {PROFESSIONAL_GUIDANCE[stage] && (
                <div className="bg-slate-900/90 rounded-3xl p-8 shadow-2xl border border-white/10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-1 h-full bg-emerald-500/30"></div>
                  <div className="flex items-center gap-3 text-emerald-400 font-black text-[11px] uppercase tracking-[0.2em] mb-4 border-b border-white/5 pb-3"><Info size={16} /> הנחייה מקצועית</div>
                  <p className="text-white text-lg italic leading-relaxed font-medium">"{PROFESSIONAL_GUIDANCE[stage].insight}"</p>
                  <div className="bg-emerald-500/5 p-5 rounded-2xl border border-emerald-500/10 mt-6 shadow-inner">
                    <h4 className="text-[10px] font-black text-emerald-400 mb-2 tracking-widest uppercase">דוגמה לניסוח:</h4>
                    <p className="text-slate-300 text-sm italic leading-relaxed">{PROFESSIONAL_GUIDANCE[stage].example}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Fixed Bottom Navigation - הסרגל התחתון הקבוע */}
      {stage !== WorkshopStage.INTRO && (
        <nav className="fixed bottom-0 left-0 right-0 bg-[#050a18]/95 backdrop-blur-3xl border-t border-white/10 p-6 z-[80] shadow-[0_-20px_60px_rgba(0,0,0,0.9)] print:hidden">
          <div className="max-w-7xl mx-auto flex justify-between items-center px-6">
            <button 
              onClick={() => {
                setStage(stagesSequence[stagesSequence.indexOf(stage) - 1]);
              }} 
              disabled={stagesSequence.indexOf(stage) === 0}
              className="flex items-center gap-3 text-slate-400 font-black hover:text-emerald-400 transition-all active:scale-95 disabled:opacity-0 py-3 px-6 text-lg"
            >
              <ChevronRight size={32}/> חזרה
            </button>
            
            <div className="hidden sm:flex gap-2">
              {stagesSequence.map((s, idx) => (
                <div key={idx} className={`h-2 w-10 rounded-full transition-all duration-700 ${stagesSequence.indexOf(stage) >= idx ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.6)]' : 'bg-slate-800'}`} />
              ))}
            </div>

            {stage !== WorkshopStage.FINAL_DASHBOARD ? (
              <button 
                onClick={() => {
                  setStage(stagesSequence[stagesSequence.indexOf(stage) + 1]);
                }} 
                className="bg-emerald-600 text-white px-16 py-5 rounded-[24px] font-black flex items-center gap-4 hover:bg-emerald-500 shadow-[0_15px_40px_rgba(16,185,129,0.4)] active:scale-95 transition-all text-2xl"
              >
                המשך לשלב הבא <ChevronLeft size={32}/>
              </button>
            ) : (
              <button 
                onClick={() => window.print()} 
                className="bg-white text-slate-900 px-16 py-5 rounded-[24px] font-black flex items-center gap-4 hover:bg-emerald-500 hover:text-white shadow-[0_20px_40px_rgba(255,255,255,0.1)] active:scale-95 transition-all text-2xl"
              >
                סיום והדפסה <Printer size={32}/>
              </button>
            )}
          </div>
        </nav>
      )}

      <footer className="py-10 pb-44 text-center text-slate-800 text-[11px] uppercase tracking-[0.8em] border-t border-white/5 print:hidden select-none">
        Public Sector Compass 2025 | AI Engine
      </footer>
    </div>
  );
}

export default App;
