
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ChevronRight, ChevronLeft, ShieldCheck, Target, Zap, 
  Plus, Trash2, Layers, Printer, Activity, Key,
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
  const [isAiDrafting, setIsAiDrafting] = useState<string | null>(null);
  const [isIntegrating, setIsIntegrating] = useState(false);
  
  const adviceCache = useRef<Record<string, AIAdvice>>({});
  const lastStageRef = useRef<WorkshopStage | null>(null);
  const stagesSequence = Object.values(WorkshopStage);

  const fetchAdvice = useCallback(async (targetStage: WorkshopStage) => {
    if (targetStage === WorkshopStage.INTRO || targetStage === WorkshopStage.FINAL_DASHBOARD) {
      setAiAdvice(null);
      return;
    }
    if (adviceCache.current[targetStage]) {
      setAiAdvice(adviceCache.current[targetStage]);
      return;
    }
    setIsAdviceLoading(true);
    try {
      const advice = await getMentorAdvice(targetStage, plan);
      if (advice) {
        setAiAdvice(advice);
        adviceCache.current[targetStage] = advice;
      }
    } catch (e) { 
      console.error("Advice fetch failed:", e); 
    } finally { 
      setIsAdviceLoading(false); 
    }
  }, [plan]);

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
          const newObjs = draft.items.map((t: string) => ({ id: `obj-${Math.random().toString(36).substr(2, 9)}`, title: t }));
          updatePlan({ objectives: [...plan.objectives.filter(o => o.title.trim()), ...newObjs] });
        } else if (funnelType === 'goals' && parentId) {
          const newGoals = draft.items.map((t: string) => ({ id: `goal-${Math.random().toString(36).substr(2, 9)}`, parentObjectiveId: parentId, title: t, tasks: [] }));
          updatePlan({ goals: [...plan.goals, ...newGoals] });
        } else if (funnelType === 'tasks' && parentId) {
          const newTasks = draft.items.map((t: string) => ({ id: `task-${Math.random().toString(36).substr(2, 9)}`, description: t, owner: 'הצעת AI', deadline: '2025', priority: 'חשוב' }));
          updatePlan({ goals: plan.goals.map(g => g.id === parentId ? { ...g, tasks: [...g.tasks, ...newTasks] } : g) });
        }
      }
    } catch (e) { 
      console.error("Drafting failed:", e);
    } finally { 
      setIsAiDrafting(null); 
    }
  };

  const runFullIntegration = async () => {
    if (isIntegrating) return;
    setIsIntegrating(true);
    try {
      const enhanced = await integrateFullPlanWithAI(plan);
      if (enhanced) {
        setPlan(enhanced);
      }
    } catch (e) {
      console.error("Integration failed:", e);
      alert("האינטגרציה נכשלה. וודא שקיים חיבור תקין לשרת ה-AI.");
    } finally { 
      setIsIntegrating(false); 
    }
  };

  const renderWorkshopActivity = () => {
    if (!showActivity || !WORKSHOP_ACTIVITIES[stage]) return null;
    const activity = WORKSHOP_ACTIVITIES[stage];
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#050a18]/90 backdrop-blur-xl animate-fadeIn" dir="rtl">
        <div className="bg-slate-900 border-2 border-emerald-500/30 rounded-[40px] p-10 max-w-2xl w-full shadow-[0_0_80px_rgba(16,185,129,0.3)] relative overflow-hidden text-right">
          <button onClick={() => setShowActivity(false)} className="absolute top-6 left-6 text-slate-500 hover:text-white transition-colors bg-white/5 p-2 rounded-full"><Plus size={24} className="rotate-45" /></button>
          <div className="flex items-center gap-3 text-emerald-400 font-black text-xs uppercase tracking-widest mb-6 border-b border-white/5 pb-4"><Activity size={16} /> {activity.title}</div>
          <h3 className="text-4xl font-black text-white mb-6 leading-tight">{activity.instruction}</h3>
          <div className="space-y-6">
            {activity.questions.map((q, idx) => (
              <div key={idx} className="bg-white/5 border border-white/10 p-6 rounded-3xl flex gap-4 items-start shadow-inner">
                <div className="bg-emerald-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shrink-0 mt-1">{idx+1}</div>
                <p className="text-white text-xl font-bold leading-relaxed">{q}</p>
              </div>
            ))}
          </div>
          <button onClick={() => setShowActivity(false)} className="w-full mt-10 bg-emerald-600 text-white py-6 rounded-3xl font-black text-2xl hover:bg-emerald-500 shadow-[0_10px_40px_rgba(16,185,129,0.4)] transition-all active:scale-95">הבנתי, בואו נתחיל</button>
        </div>
      </div>
    );
  };

  const renderStage = () => {
    const inputClasses = "w-full bg-slate-900/80 p-5 rounded-2xl border border-white/10 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 outline-none transition-all placeholder:text-slate-700 text-white font-medium text-lg shadow-inner";
    const labelClasses = "block text-xs font-black text-slate-500 uppercase tracking-widest mb-3";

    switch (stage) {
      case WorkshopStage.INTRO:
        return (
          <div className="space-y-12 py-16 text-center animate-fadeIn">
            <div className="space-y-6">
              <div className="inline-flex p-8 bg-emerald-600/10 text-emerald-400 rounded-[40px] border border-emerald-500/20 shadow-[0_0_60px_rgba(16,185,129,0.2)] mb-4 animate-pulse"><BrainCircuit size={100} /></div>
              <h1 className="text-9xl font-black text-white tracking-tighter leading-none">מצפן<br/><span className="text-emerald-500 italic">שפ"ח</span></h1>
              <p className="text-3xl text-slate-400 max-w-2xl mx-auto italic font-light leading-relaxed">הדור הבא של תכנון אסטרטגי לשירותים פסיכולוגיים ציבוריים.</p>
            </div>
            <button onClick={() => setStage(WorkshopStage.SWOT_ANALYSIS)} className="bg-emerald-600 text-white px-24 py-8 rounded-[36px] font-black text-4xl hover:bg-emerald-500 shadow-[0_30px_60px_rgba(16,185,129,0.4)] active:scale-95 transition-all mt-8">התחל סדנה</button>
          </div>
        );

      case WorkshopStage.SWOT_ANALYSIS:
        return (
          <StageWrapper title="שלב 1: התבוננות ומיקוד" subtitle="ניתוח SWOT ומיקודים שנתיים" icon={<Activity size={32} />}>
            <div className="space-y-8 pb-40">
              <div className="bg-slate-900/40 p-8 rounded-[32px] border border-white/5 shadow-2xl">
                <label className={labelClasses}>מהם המיקודים המרכזיים שלנו השנה?</label>
                <textarea className={`${inputClasses} min-h-[140px] border-emerald-500/20`} value={plan.swot.focalPoints} onChange={e => updatePlan({ swot: { ...plan.swot, focalPoints: e.target.value } })} placeholder="רשמו כאן את זירות הפעולה העיקריות שמעסיקות אתכם..." />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div><label className={labelClasses}>חוזקות ארגוניות (מה עובד מצוין?)</label><textarea className={inputClasses} value={plan.swot.strengths} onChange={e => updatePlan({ swot: { ...plan.swot, strengths: e.target.value } })} /></div>
                  <div><label className={labelClasses}>חולשות ארגוניות (איפה חסר מענה?)</label><textarea className={inputClasses} value={plan.swot.weaknesses} onChange={e => updatePlan({ swot: { ...plan.swot, weaknesses: e.target.value } })} /></div>
                </div>
                <div className="space-y-6">
                  <div><label className={labelClasses}>הזדנויות (תקציבים, שותפים, טכנולוגיה)</label><textarea className={inputClasses} value={plan.swot.opportunities} onChange={e => updatePlan({ swot: { ...plan.swot, opportunities: e.target.value } })} /></div>
                  <div><label className={labelClasses}>איומים (קיצוצים, עומס, שינויי מדיניות)</label><textarea className={inputClasses} value={plan.swot.threats} onChange={e => updatePlan({ swot: { ...plan.swot, threats: e.target.value } })} /></div>
                </div>
              </div>
            </div>
          </StageWrapper>
        );

      case WorkshopStage.VISION_ETHOS:
        return (
          <StageWrapper title="שלב 2: זהות ומצפן" subtitle="חזון ואתוס מקצועי" icon={<ShieldCheck size={32} />}>
            <div className="space-y-8 pb-40">
              <div className="bg-slate-900/60 p-12 rounded-[48px] border-2 border-emerald-500/20 shadow-[0_20px_100px_rgba(0,0,0,0.5)]">
                <label className={labelClasses}>חזון היחידה (ה'למה' שלנו)</label>
                <textarea className={`${inputClasses} min-h-[220px] text-4xl font-black text-emerald-400 bg-transparent border-none focus:ring-0 leading-tight text-center placeholder:text-slate-800`} value={plan.vision} onChange={e => updatePlan({ vision: e.target.value })} placeholder="נסחו משפט עוצמתי אחד שמגדיר את השאיפה שלכם..." />
              </div>
              <div>
                <label className={labelClasses}>אתוס (ערכי הליבה המנחים את העבודה)</label>
                <input className={inputClasses} value={plan.ethos} onChange={e => updatePlan({ ethos: e.target.value })} placeholder="למשל: מקצועיות ללא פשרות, שקיפות, חמלה..." />
              </div>
            </div>
          </StageWrapper>
        );

      case WorkshopStage.REALITY_CHECK:
        return (
          <StageWrapper title="שלב 3: עוגני מציאות" subtitle="מיפוי אילוצים ומענים" icon={<Search size={32} />}>
            <div className="space-y-6 pb-40">
              <div className="overflow-hidden rounded-[32px] border border-white/10 shadow-3xl bg-slate-900/30">
                <table className="w-full text-right border-collapse">
                  <thead className="bg-slate-800/80">
                    <tr><th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">סוג האילוץ</th><th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">פירוט האילוץ</th><th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">חוזק/משאב לניצול</th><th className="p-6 w-16"></th></tr>
                  </thead>
                  <tbody>
                    {plan.realityConstraints.map(c => (
                      <tr key={c.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="p-4"><input className="w-full bg-transparent border-none text-white focus:ring-0 text-lg font-bold" value={c.category} onChange={e => updatePlan({ realityConstraints: plan.realityConstraints.map(rc => rc.id === c.id ? {...rc, category: e.target.value} : rc) })} placeholder="למשל: תקציבי..." /></td>
                        <td className="p-4"><input className="w-full bg-transparent border-none text-slate-300 focus:ring-0 text-base" value={c.detail} onChange={e => updatePlan({ realityConstraints: plan.realityConstraints.map(rc => rc.id === c.id ? {...rc, detail: e.target.value} : rc) })} placeholder="תיאור הקושי..." /></td>
                        <td className="p-4"><input className="w-full bg-transparent border-none text-emerald-400 focus:ring-0 text-lg font-black" value={c.resourceToLeverage} onChange={e => updatePlan({ realityConstraints: plan.realityConstraints.map(rc => rc.id === c.id ? {...rc, resourceToLeverage: e.target.value} : rc) })} placeholder="מענה קיים..." /></td>
                        <td className="p-4 text-center"><button onClick={() => updatePlan({ realityConstraints: plan.realityConstraints.filter(rc => rc.id !== c.id) })} className="text-slate-700 hover:text-red-500 transition-colors"><Trash2 size={24}/></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button onClick={() => updatePlan({ realityConstraints: [...plan.realityConstraints, { id: Date.now().toString(), category: '', detail: '', resourceToLeverage: '' }] })} className="w-full py-6 border-2 border-dashed border-emerald-500/20 rounded-[28px] flex items-center justify-center gap-3 text-emerald-400 font-black hover:bg-emerald-500/10 hover:border-emerald-500/50 transition-all mt-4"><Plus size={32} /> הוספת אילוץ חדש</button>
            </div>
          </StageWrapper>
        );

      case WorkshopStage.STRATEGIC_OBJECTIVES:
        return (
          <StageWrapper title="שלב 4: מטרות על" subtitle="הכיוונים האסטרטגיים" icon={<Target size={32} />}>
            <div className="space-y-6 pb-40">
              <div className="flex justify-between items-center mb-8">
                <p className="text-slate-400 text-lg italic font-light">המטרות שנגזרות מהחזון ומהמיקודים שהגדרתם.</p>
                <button 
                  onClick={() => handleAiDraft('objectives')} 
                  disabled={isAiDrafting !== null} 
                  className="bg-emerald-600/30 text-emerald-300 px-8 py-4 rounded-2xl text-sm font-black flex items-center gap-3 hover:bg-emerald-600/50 shadow-lg border border-emerald-500/20 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isAiDrafting === 'objectives' ? <RefreshCw className="animate-spin" size={20}/> : <Wand2 size={20} />} ייצר מטרות AI
                </button>
              </div>
              <div className="space-y-6">
                {plan.objectives.map(obj => (
                  <div key={obj.id} className="flex gap-6 items-center bg-slate-900/80 p-6 rounded-3xl border border-white/10 group shadow-2xl">
                    <div className="p-4 bg-emerald-500/10 rounded-2xl text-emerald-500"><Target size={32} /></div>
                    <input className="w-full bg-transparent border-none text-white text-2xl font-black focus:ring-0 placeholder:text-slate-800" value={obj.title} onChange={e => updatePlan({ objectives: plan.objectives.map(o => o.id === obj.id ? { ...o, title: e.target.value } : o) })} placeholder="נסחו מטרת על אסטרטגית..." />
                    <button onClick={() => updatePlan({ objectives: plan.objectives.filter(o => o.id !== obj.id) })} className="text-slate-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={28} /></button>
                  </div>
                ))}
                <button onClick={() => updatePlan({ objectives: [...plan.objectives, { id: Date.now().toString(), title: '' }] })} className="w-full py-6 border-2 border-dashed border-white/10 rounded-[28px] text-emerald-400 font-black text-xl flex items-center justify-center gap-3 hover:bg-white/5 transition-all"><Plus size={32} /> הוספת מטרה</button>
              </div>
            </div>
          </StageWrapper>
        );

      case WorkshopStage.OPERATIONAL_GOALS:
        return (
          <StageWrapper title="שלב 5: יעדים אופרטיביים" subtitle="גזירת יעדים מדידים" icon={<Layers size={32} />}>
            <div className="space-y-12 pb-40">
              {plan.objectives.map(obj => (
                <div key={obj.id} className="bg-slate-900/60 p-10 rounded-[40px] border border-white/10 space-y-8 shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5)] relative">
                  <div className="flex justify-between items-center border-b border-white/5 pb-6">
                    <h3 className="text-emerald-400 text-2xl font-black flex items-center gap-4"><Target size={32}/> {obj.title || "מטרה ללא כותרת"}</h3>
                    <button 
                      onClick={() => handleAiDraft('goals', obj.id)} 
                      disabled={isAiDrafting !== null} 
                      className="text-sm font-black bg-emerald-500/10 text-emerald-300 px-6 py-3 rounded-2xl hover:bg-emerald-500/20 border border-emerald-500/20 transition-all active:scale-95 disabled:opacity-50"
                    >
                      {isAiDrafting === `goals-${obj.id}` ? <RefreshCw className="animate-spin" size={18}/> : <Sparkles size={18}/>} הצעת AI ליעדים
                    </button>
                  </div>
                  <div className="space-y-5">
                    {plan.goals.filter(g => g.parentObjectiveId === obj.id).map(goal => (
                      <div key={goal.id} className="flex gap-5 items-center bg-black/40 p-5 rounded-[24px] border border-white/5 group shadow-inner">
                        <input className="w-full bg-transparent border-none text-white font-bold focus:ring-0 text-xl placeholder:text-slate-800" value={goal.title} onChange={e => updatePlan({ goals: plan.goals.map(g => g.id === goal.id ? { ...g, title: e.target.value } : g) })} placeholder="הגדר יעד מדיד וספציפי..." />
                        <button onClick={() => updatePlan({ goals: plan.goals.filter(g => g.id !== goal.id) })} className="text-slate-800 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={24} /></button>
                      </div>
                    ))}
                    <button onClick={() => updatePlan({ goals: [...plan.goals, { id: Date.now().toString(), parentObjectiveId: obj.id, title: '', tasks: [] }] })} className="text-emerald-400/70 text-base font-black flex items-center gap-3 hover:text-emerald-400 bg-emerald-500/5 px-6 py-3 rounded-2xl transition-all w-fit"><Plus size={24} /> הוספת יעד אופרטיבי</button>
                  </div>
                </div>
              ))}
            </div>
          </StageWrapper>
        );

      case WorkshopStage.DETAILED_TASKS:
        return (
          <StageWrapper title="שלב 6: משימות ולו״ז" subtitle="יורדים לרמת הביצוע" icon={<ClipboardList size={32} />}>
            <div className="space-y-12 pb-40">
              {plan.goals.length === 0 ? (
                <div className="bg-slate-900/50 p-16 rounded-[48px] text-center space-y-8 shadow-3xl">
                  <div className="w-24 h-24 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-500 mx-auto border border-amber-500/20"><AlertTriangle size={48} /></div>
                  <h3 className="text-4xl font-black text-white">לא הוגדרו יעדים</h3>
                  <button onClick={() => setStage(WorkshopStage.OPERATIONAL_GOALS)} className="bg-emerald-600 text-white px-12 py-5 rounded-[28px] font-black text-xl flex items-center gap-4 mx-auto shadow-2xl hover:bg-emerald-500 transition-all active:scale-95"><ArrowRight className="rotate-180" size={28} /> חזור ליעדים</button>
                </div>
              ) : (
                plan.goals.map(goal => (
                  <div key={goal.id} className="bg-slate-900/70 p-10 rounded-[44px] border-r-8 border-emerald-500 space-y-8 shadow-3xl border border-white/5">
                    <div className="flex justify-between items-center border-b border-white/5 pb-6">
                      <h3 className="text-white font-black text-3xl">יעד: {goal.title || "יעד ללא כותרת"}</h3>
                      <button 
                        onClick={() => handleAiDraft('tasks', goal.id)} 
                        disabled={isAiDrafting !== null} 
                        className="text-sm font-black bg-emerald-500/10 text-emerald-300 px-8 py-4 rounded-2xl hover:bg-emerald-500/20 border border-emerald-500/20 transition-all active:scale-95"
                      >
                        {isAiDrafting === `tasks-${goal.id}` ? <RefreshCw className="animate-spin" size={20}/> : <Zap size={20}/>} משימות AI
                      </button>
                    </div>
                    <div className="space-y-5">
                      {goal.tasks.map(task => (
                        <div key={task.id} className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center bg-black/40 p-6 rounded-[28px] border border-white/5 group shadow-inner">
                          <div className="md:col-span-6"><input className="w-full bg-transparent border-none text-slate-100 text-xl focus:ring-0 font-bold placeholder:text-slate-800" value={task.description} onChange={e => updatePlan({ goals: plan.goals.map(g => g.id === goal.id ? { ...g, tasks: g.tasks.map(t => t.id === task.id ? { ...t, description: e.target.value } : t) } : g) })} placeholder="תיאור המשימה..." /></div>
                          <div className="md:col-span-3"><input className="w-full bg-slate-800/80 rounded-2xl p-4 text-base text-white border border-white/5" value={task.owner} onChange={e => updatePlan({ goals: plan.goals.map(g => g.id === goal.id ? { ...g, tasks: g.tasks.map(t => t.id === task.id ? { ...t, owner: e.target.value } : t) } : g) })} placeholder="גורם אחראי" /></div>
                          <div className="md:col-span-2"><input className="w-full bg-slate-800/80 rounded-2xl p-4 text-base text-emerald-400 font-black text-center border border-white/5" value={task.deadline} onChange={e => updatePlan({ goals: plan.goals.map(g => g.id === goal.id ? { ...g, tasks: g.tasks.map(t => t.id === task.id ? { ...t, deadline: e.target.value } : t) } : g) })} placeholder="לו״ז" /></div>
                          <div className="md:col-span-1 flex justify-end"><button onClick={() => updatePlan({ goals: plan.goals.map(g => g.id === goal.id ? { ...g, tasks: g.tasks.filter(t => t.id !== task.id) } : g) })} className="text-slate-800 hover:text-red-500 transition-colors"><Trash2 size={24}/></button></div>
                        </div>
                      ))}
                      <button onClick={() => updatePlan({ goals: plan.goals.map(g => g.id === goal.id ? { ...g, tasks: [...g.tasks, { id: Date.now().toString(), description: '', owner: '', deadline: '2025', priority: 'חשוב' }] } : g) })} className="text-emerald-400 text-base font-black flex items-center gap-3 mt-4 hover:text-emerald-300 transition-all bg-emerald-500/5 p-4 rounded-3xl w-full justify-center border border-dashed border-emerald-500/20"><Plus size={24}/> הוספת משימה לביצוע</button>
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
              <div className="space-y-4"><h2 className="text-7xl font-black text-white tracking-tight leading-none">תוצר סופי:<br/><span className="text-emerald-500">תוכנית עבודה</span></h2><p className="text-slate-400 text-2xl italic font-light">מצפן אסטרטגי משולב AI | 2025</p></div>
              <div className="flex gap-4 w-full md:w-auto">
                <button 
                  onClick={runFullIntegration} 
                  disabled={isIntegrating}
                  className={`flex-1 md:flex-none px-12 py-6 rounded-[32px] font-black text-xl flex items-center justify-center gap-4 shadow-[0_20px_50px_rgba(16,185,129,0.3)] transition-all active:scale-95 ${isIntegrating ? 'bg-slate-700 text-slate-400 cursor-wait' : 'bg-emerald-600 text-white hover:bg-emerald-500'}`}
                >
                  {isIntegrating ? <RefreshCw className="animate-spin" size={32} /> : <BrainCircuit size={32} />} אינטגרציה אסטרטגית סופית
                </button>
                <button onClick={() => window.print()} className="bg-slate-800 text-white px-10 py-6 rounded-[32px] font-bold text-xl flex items-center justify-center gap-4 hover:bg-slate-700 shadow-2xl transition-all"><Printer size={28} /> הדפסה</button>
              </div>
            </div>
            {plan.expertAnalysis && (
              <div className="bg-emerald-500/10 border-4 border-emerald-500/30 p-12 rounded-[56px] shadow-3xl relative overflow-hidden print:bg-white print:border-black">
                <div className="absolute top-0 right-0 p-8 opacity-10 animate-pulse"><Sparkles size={160} className="text-emerald-400" /></div>
                <div className="flex items-center gap-4 text-emerald-400 font-black text-sm uppercase mb-8 print:text-black tracking-[0.3em]"><Sparkles size={32} className="animate-pulse" /> ניתוח מומחה אסטרטגי משולב AI</div>
                <p className="text-white text-4xl leading-relaxed font-bold italic print:text-black relative z-10 select-none">"{plan.expertAnalysis}"</p>
              </div>
            )}
            <div className="bg-white overflow-hidden rounded-[56px] shadow-[0_60px_120px_-20px_rgba(0,0,0,0.8)] border-8 border-black print:border-2 print:shadow-none">
              <table className="w-full text-right border-collapse">
                <thead className="bg-slate-900 border-b-8 border-black print:bg-slate-100"><tr className="text-white print:text-black font-black text-lg uppercase tracking-widest"><th className="p-10 border border-slate-700 w-[20%]">מטרה אסטרטגית</th><th className="p-10 border border-slate-700 w-[22%]">יעד אופרטיבי</th><th className="p-10 border border-slate-700 w-[38%]">משימות לביצוע</th><th className="p-10 border border-slate-700 w-[10%] text-center">אחראי</th><th className="p-10 border border-slate-700 w-[10%] text-center">לו"ז</th></tr></thead>
                <tbody className="text-black">
                  {plan.objectives.map(obj => {
                    const objGoals = plan.goals.filter(g => g.parentObjectiveId === obj.id);
                    if (objGoals.length === 0) return (<tr key={obj.id} className="border-b-4 border-slate-300"><td className="p-10 border border-slate-300 font-black bg-slate-100 text-3xl align-top leading-tight">{obj.title}</td><td colSpan={4} className="border border-slate-300 italic text-slate-500 p-10 text-center text-2xl font-black">טרם הוגדרו יעדים למטרה זו</td></tr>);
                    return objGoals.map((goal, gIdx) => (
                      <React.Fragment key={goal.id}>
                        {goal.tasks.length === 0 ? (
                           <tr className="border-b-4 border-slate-300">
                            {gIdx === 0 && <td rowSpan={objGoals.length} className="p-10 border border-slate-300 font-black align-top bg-slate-100 text-3xl border-l-4 leading-tight">{obj.title}{obj.aiRefinement && <div className="text-[14px] text-emerald-800 mt-8 p-6 bg-emerald-100 rounded-[28px] border-2 border-emerald-400 font-black print:hidden shadow-lg leading-snug">💡 אסטרטגיה: {obj.aiRefinement}</div>}</td>}
                            <td className="p-10 border border-slate-300 font-black bg-white text-2xl border-l-2 leading-tight">{goal.title}</td><td colSpan={3} className="p-10 border border-slate-300 italic text-slate-400 text-center font-black text-xl">אין משימות מוגדרות</td>
                          </tr>
                        ) : goal.tasks.map((task, tIdx) => (
                          <tr key={task.id} className={`border-b-4 border-slate-300 hover:bg-slate-50 transition-colors ${task.isAiSuggested ? 'bg-emerald-50/70' : 'bg-white'}`}>
                            {gIdx === 0 && tIdx === 0 && <td rowSpan={objGoals.reduce((sum, g) => sum + Math.max(1, g.tasks.length), 0)} className="p-10 border border-slate-300 font-black align-top bg-slate-100 text-3xl border-l-8 border-l-slate-900 leading-tight">{obj.title}{obj.aiRefinement && <div className="text-[14px] text-emerald-900 mt-8 p-8 bg-emerald-200 rounded-[32px] border-4 border-emerald-500 font-black shadow-xl print:hidden leading-snug">💡 חידוד AI: {obj.aiRefinement}</div>}</td>}
                            {tIdx === 0 && <td rowSpan={goal.tasks.length} className="p-10 border border-slate-300 font-black align-top bg-white text-2xl border-l-4 leading-tight">{goal.title}{goal.aiInsight && <div className="mt-6 p-6 bg-blue-100 rounded-[24px] border-2 border-blue-400 text-[12px] text-blue-950 font-black shadow-lg print:hidden leading-snug">🔍 תובנה: {goal.aiInsight}</div>}</td>}
                            <td className={`p-10 border border-slate-300 text-2xl font-bold leading-relaxed ${task.isAiSuggested ? 'border-r-8 border-r-emerald-600' : ''}`}>{task.description}{task.isAiSuggested && <span className="block mt-4 text-[11px] bg-emerald-700 text-white px-5 py-2 rounded-full w-fit font-black shadow-xl print:hidden uppercase tracking-widest">הצעה מומחה AI</span>}</td>
                            <td className="p-10 border border-slate-300 text-lg text-center font-black text-slate-800 bg-slate-50/40">{task.owner}</td><td className="p-10 border border-slate-300 text-lg text-center font-black text-slate-950 bg-slate-50/40">{task.deadline}</td>
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
      <header className="glass-panel py-6 px-10 sticky top-0 z-[60] border-b border-white/10 print:hidden shadow-3xl">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6 cursor-pointer" onClick={() => setStage(WorkshopStage.INTRO)}><div className="w-14 h-14 bg-emerald-600 rounded-[20px] flex items-center justify-center text-white font-black shadow-[0_0_40px_rgba(16,185,129,0.5)] text-2xl">ש</div><h1 className="text-2xl font-black text-white italic tracking-tight">מצפן ניהול שפ"ח</h1></div>
          <div className="flex gap-4">{stagesSequence.map((s) => (<button key={s} onClick={() => setStage(s)} className={`w-4 h-4 rounded-full transition-all duration-700 ${stage === s ? 'bg-emerald-500 scale-150 shadow-[0_0_30px_rgba(16,185,129,0.9)]' : 'bg-slate-700'}`} />))}</div>
        </div>
      </header>
      <main className="flex-1 max-w-7xl mx-auto w-full p-6 sm:p-10 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          <div className={`lg:col-span-${stage === WorkshopStage.INTRO || stage === WorkshopStage.FINAL_DASHBOARD ? '12' : '8'}`}>{renderStage()}</div>
          {stage !== WorkshopStage.INTRO && stage !== WorkshopStage.FINAL_DASHBOARD && (
            <div className="lg:col-span-4 lg:sticky lg:top-36 print:hidden space-y-10">
              <AIMentor advice={aiAdvice} loading={isAdviceLoading} onRetry={() => fetchAdvice(stage)} />
              <div className="bg-slate-900/60 rounded-[40px] p-8 border border-white/5 space-y-6 shadow-3xl">
                 <div className="flex items-center gap-4 text-emerald-400 font-black text-[12px] uppercase tracking-[0.3em] border-b border-white/5 pb-5"><BrainCircuit size={20}/> מנוע AI אסטרטגי</div>
                 <button 
                  onClick={() => handleAiDraft(stage === WorkshopStage.STRATEGIC_OBJECTIVES ? 'objectives' : (stage === WorkshopStage.OPERATIONAL_GOALS ? 'goals' : 'tasks'))}
                  disabled={isAiDrafting !== null}
                  className="w-full bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 py-6 rounded-3xl text-sm font-black border border-emerald-500/20 flex items-center justify-center gap-4 transition-all active:scale-95 disabled:opacity-50"
                 >
                    {isAiDrafting !== null ? <RefreshCw className="animate-spin" size={24}/> : <Sparkles size={24}/>} הצע רעיונות לשלב זה
                 </button>
              </div>
              {PROFESSIONAL_GUIDANCE[stage] && (
                <div className="bg-slate-900/95 rounded-[40px] p-10 shadow-3xl border border-white/10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-1.5 h-full bg-emerald-500/40"></div>
                  <div className="flex items-center gap-4 text-emerald-400 font-black text-[12px] uppercase tracking-[0.3em] mb-6 border-b border-white/5 pb-4"><Info size={20} /> הנחייה מקצועית</div>
                  <p className="text-white text-xl italic leading-relaxed font-medium">"{PROFESSIONAL_GUIDANCE[stage].insight}"</p>
                  <div className="bg-emerald-500/5 p-6 rounded-3xl border border-emerald-500/10 mt-8 shadow-inner"><h4 className="text-[11px] font-black text-emerald-400 mb-3 uppercase tracking-widest">דוגמה לניסוח:</h4><p className="text-slate-300 text-base italic leading-relaxed">{PROFESSIONAL_GUIDANCE[stage].example}</p></div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      {stage !== WorkshopStage.INTRO && (
        <nav className="fixed bottom-0 left-0 right-0 bg-[#050a18]/95 backdrop-blur-3xl border-t border-white/10 p-8 z-[80] shadow-[0_-30px_80px_rgba(0,0,0,0.9)] print:hidden">
          <div className="max-w-7xl mx-auto flex justify-between items-center px-8">
            <button onClick={() => setStage(stagesSequence[stagesSequence.indexOf(stage) - 1])} disabled={stagesSequence.indexOf(stage) === 0} className="flex items-center gap-4 text-slate-400 font-black hover:text-emerald-400 transition-all active:scale-95 disabled:opacity-0 py-4 px-8 text-xl"><ChevronRight size={36}/> חזרה</button>
            <div className="hidden sm:flex gap-3">{stagesSequence.map((s, idx) => (<div key={idx} className={`h-2.5 w-12 rounded-full transition-all duration-700 ${stagesSequence.indexOf(stage) >= idx ? 'bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.7)]' : 'bg-slate-800'}`} />))}</div>
            {stage !== WorkshopStage.FINAL_DASHBOARD ? (
              <button onClick={() => setStage(stagesSequence[stagesSequence.indexOf(stage) + 1])} className="bg-emerald-600 text-white px-20 py-6 rounded-[32px] font-black flex items-center gap-5 hover:bg-emerald-500 shadow-[0_20px_50px_rgba(16,185,129,0.4)] active:scale-95 transition-all text-2xl">המשך לשלב הבא <ChevronLeft size={36}/></button>
            ) : (
              <button onClick={() => window.print()} className="bg-white text-slate-900 px-20 py-6 rounded-[32px] font-black flex items-center gap-5 hover:bg-emerald-500 hover:text-white shadow-3xl active:scale-95 transition-all text-2xl">סיום והדפסה <Printer size={36}/></button>
            )}
          </div>
        </nav>
      )}
      <footer className="py-12 pb-48 text-center text-slate-800 text-[12px] uppercase tracking-[1em] border-t border-white/5 print:hidden select-none">Public Sector Catalyst 2025 | Powered by Gemini AI</footer>
    </div>
  );
}

export default App;
