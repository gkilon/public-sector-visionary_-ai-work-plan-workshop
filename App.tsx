
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ChevronRight, ChevronLeft, ShieldCheck, Target, Zap, FileText,
  Plus, Trash2, Play, Layers, Link as LinkIcon, Printer, Activity, 
  Users, User, MessageCircle, Download, LayoutGrid, ArrowDownWideNarrow, Search,
  Info, ClipboardList, Sparkles, Wand2, BrainCircuit, RefreshCw
} from 'lucide-react';
import { WorkshopStage, WorkPlan, Objective, Goal, Task, AIAdvice, RealityConstraint } from './types';
import { getMentorAdvice, generateFunnelDraft, integrateFullPlanWithAI } from './services/geminiService';
import { PROFESSIONAL_GUIDANCE, WORKSHOP_ACTIVITIES } from './services/expertData';
import StageWrapper from './components/StageWrapper';
import AIMentor from './components/AIMentor';

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
  const [isAiDrafting, setIsAiDrafting] = useState(false);
  const [isIntegrating, setIsIntegrating] = useState(false);
  
  const adviceCache = useRef<Record<string, AIAdvice>>({});
  const activeRequestRef = useRef<string | null>(null);
  const stagesSequence = Object.values(WorkshopStage);

  const fetchAdvice = useCallback(async (forced: boolean = false) => {
    if (stage === WorkshopStage.INTRO || stage === WorkshopStage.FINAL_DASHBOARD) {
      setAiAdvice(null);
      return;
    }
    if (!forced && adviceCache.current[stage]) {
      setAiAdvice(adviceCache.current[stage]);
      return;
    }
    const requestId = Math.random().toString(36);
    activeRequestRef.current = requestId;
    setIsAdviceLoading(true);
    try {
      const advice = await getMentorAdvice(stage, plan);
      if (activeRequestRef.current === requestId) {
        setAiAdvice(advice);
        adviceCache.current[stage] = advice;
      }
    } catch (e) { console.error(e); } 
    finally { if (activeRequestRef.current === requestId) setIsAdviceLoading(false); }
  }, [stage, plan]);

  useEffect(() => {
    fetchAdvice();
    setShowActivity(!!WORKSHOP_ACTIVITIES[stage]);
  }, [stage]);

  const updatePlan = (updates: Partial<WorkPlan>) => setPlan(prev => ({ ...prev, ...updates }));

  const handleAiDraft = async (funnelType: 'objectives' | 'goals' | 'tasks', parentId?: string) => {
    setIsAiDrafting(true);
    try {
      const draft = await generateFunnelDraft(funnelType, plan);
      if (funnelType === 'objectives') {
        const newObjs = draft.items.map((t: string) => ({ id: `obj-${Math.random()}`, title: t }));
        updatePlan({ objectives: [...plan.objectives, ...newObjs] });
      } else if (funnelType === 'goals' && parentId) {
        const newGoals = draft.items.map((t: string) => ({ id: `goal-${Math.random()}`, parentObjectiveId: parentId, title: t, tasks: [] }));
        updatePlan({ goals: [...plan.goals, ...newGoals] });
      } else if (funnelType === 'tasks' && parentId) {
        const newTasks = draft.items.map((t: string) => ({ id: `task-${Math.random()}`, description: t, owner: 'הצעה', deadline: 'תלוי ביצוע', priority: 'חשוב' }));
        updatePlan({ goals: plan.goals.map(g => g.id === parentId ? { ...g, tasks: [...g.tasks, ...newTasks] } : g) });
      }
    } catch (e) { console.error(e); }
    finally { setIsAiDrafting(false); }
  };

  const runFullIntegration = async () => {
    setIsIntegrating(true);
    try {
      const enhanced = await integrateFullPlanWithAI(plan);
      setPlan(enhanced);
    } catch (e) { console.error(e); }
    finally { setIsIntegrating(false); }
  };

  const renderWorkshopActivity = () => {
    const activity = WORKSHOP_ACTIVITIES[stage];
    if (!showActivity || !activity) return null;

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn print:hidden">
        <div className="bg-[#0f172a] border border-emerald-500/30 rounded-3xl max-w-2xl w-full p-8 shadow-[0_0_50px_rgba(16,185,129,0.2)] space-y-6 text-right" dir="rtl">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
                {activity.type === 'individual' ? <User size={20} /> : activity.type === 'pairs' ? <Users size={20} /> : <MessageCircle size={20} />}
              </div>
              <h3 className="text-2xl font-black text-white">{activity.title}</h3>
            </div>
            <button onClick={() => setShowActivity(false)} className="text-slate-500 hover:text-white transition-colors">
              <Plus size={24} className="rotate-45" />
            </button>
          </div>
          <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-2xl italic text-emerald-100/90">{activity.instruction}</div>
          <div className="space-y-4">
            {activity.questions.map((q, idx) => (
              <div key={idx} className="flex gap-4 items-start bg-slate-800/50 p-4 rounded-xl border border-white/5">
                <span className="bg-emerald-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-1">{idx + 1}</span>
                <p className="text-slate-200 font-medium leading-relaxed">{q}</p>
              </div>
            ))}
          </div>
          <button onClick={() => setShowActivity(false)} className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold hover:bg-emerald-500 transition-all shadow-lg">הבנתי, בואו נתחיל למלא</button>
        </div>
      </div>
    );
  };

  const renderStage = () => {
    const inputClasses = "w-full bg-slate-900 p-4 rounded-xl border border-white/20 focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all placeholder:text-slate-500 text-white font-medium";
    const labelClasses = "block text-xs font-black text-slate-400 uppercase tracking-widest mb-2";

    switch (stage) {
      case WorkshopStage.INTRO:
        return (
          <div className="space-y-12 py-10 text-center animate-fadeIn">
            <div className="space-y-6">
              <div className="inline-flex p-4 bg-emerald-600/10 text-emerald-400 rounded-2xl border border-emerald-500/20 shadow-xl">
                <LayoutGrid size={64} />
              </div>
              <h1 className="text-7xl font-black text-white tracking-tighter">מצפן ניהול שפ"ח</h1>
              <p className="text-2xl text-slate-400 max-w-2xl mx-auto italic">כלי אינטגרטיבי לבניית תוכנית עבודה חכמה מבוססת AI.</p>
            </div>
            <button onClick={() => setStage(WorkshopStage.SWOT_ANALYSIS)} className="bg-emerald-600 text-white px-16 py-6 rounded-2xl font-black text-2xl hover:bg-emerald-500 shadow-2xl active:scale-95 transition-all">התחלת הסדנה</button>
          </div>
        );

      case WorkshopStage.SWOT_ANALYSIS:
        return (
          <StageWrapper title="שלב 1: התבוננות ומיקוד" subtitle="ניתוח SWOT יחידתי ומיקודים שנתיים" icon={<Activity size={28} />}>
            <div className="space-y-8">
              <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/10 shadow-inner">
                <label className={labelClasses}>מהם המיקודים המרכזיים שלנו לתקופה הקרובה?</label>
                <textarea className={`${inputClasses} min-h-[100px] border-emerald-500/30`} value={plan.swot.focalPoints} onChange={e => updatePlan({ swot: { ...plan.swot, focalPoints: e.target.value } })} placeholder="הגדרת זירת הפעולה של השפ״ח השנה..." />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <label className={labelClasses}>חוזקות ארגוניות (פנימי)</label>
                  <textarea className={inputClasses} value={plan.swot.strengths} onChange={e => updatePlan({ swot: { ...plan.swot, strengths: e.target.value } })} placeholder="מה הכוח שלנו כיחידה?" />
                  <label className={labelClasses}>חולשות ארגוניות (פנימי)</label>
                  <textarea className={inputClasses} value={plan.swot.weaknesses} onChange={e => updatePlan({ swot: { ...plan.swot, weaknesses: e.target.value } })} placeholder="איפה אנחנו מתקשים בתפעול?" />
                </div>
                <div className="space-y-4">
                  <label className={labelClasses}>הזדמנויות חיצוניות</label>
                  <textarea className={inputClasses} value={plan.swot.opportunities} onChange={e => updatePlan({ swot: { ...plan.swot, opportunities: e.target.value } })} placeholder="תקציבים, שותפויות..." />
                  <label className={labelClasses}>איומים חיצוניים</label>
                  <textarea className={inputClasses} value={plan.swot.threats} onChange={e => updatePlan({ swot: { ...plan.swot, threats: e.target.value } })} placeholder="שינויי מדיניות, קיצוצים..." />
                </div>
              </div>
            </div>
          </StageWrapper>
        );

      case WorkshopStage.VISION_ETHOS:
        return (
          <StageWrapper title="שלב 2: זהות ומצפן" subtitle="חזון ואתוס מקצועי" icon={<ShieldCheck size={28} />}>
            <div className="space-y-8">
              <div>
                <label className={labelClasses}>חזון היחידה (היעד העליון)</label>
                <textarea className={`${inputClasses} min-h-[150px] text-2xl font-bold text-emerald-400`} value={plan.vision} onChange={e => updatePlan({ vision: e.target.value })} placeholder="נסחו משפט עוצמתי אחד..." />
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
            <div className="space-y-6">
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse bg-slate-900/50 rounded-2xl overflow-hidden border border-white/10">
                  <thead className="bg-slate-800">
                    <tr>
                      <th className="p-4 text-xs font-black text-slate-300 w-1/4">אילוץ / קושי</th>
                      <th className="p-4 text-xs font-black text-slate-300 w-1/3">פירוט</th>
                      <th className="p-4 text-xs font-black text-slate-300 w-1/3">חוזק לשימוש</th>
                      <th className="p-4 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {plan.realityConstraints.map(c => (
                      <tr key={c.id} className="border-b border-white/5">
                        <td className="p-2"><input className="w-full bg-transparent border-none text-white focus:ring-0 text-sm font-bold" value={c.category} onChange={e => updatePlan({ realityConstraints: plan.realityConstraints.map(rc => rc.id === c.id ? {...rc, category: e.target.value} : rc) })} placeholder="סוג האילוץ" /></td>
                        <td className="p-2"><input className="w-full bg-transparent border-none text-slate-300 focus:ring-0 text-sm" value={c.detail} onChange={e => updatePlan({ realityConstraints: plan.realityConstraints.map(rc => rc.id === c.id ? {...rc, detail: e.target.value} : rc) })} placeholder="פירוט..." /></td>
                        <td className="p-2"><input className="w-full bg-transparent border-none text-emerald-400 focus:ring-0 text-sm font-medium" value={c.resourceToLeverage} onChange={e => updatePlan({ realityConstraints: plan.realityConstraints.map(rc => rc.id === c.id ? {...rc, resourceToLeverage: e.target.value} : rc) })} placeholder="המענה" /></td>
                        <td className="p-2"><button onClick={() => updatePlan({ realityConstraints: plan.realityConstraints.filter(rc => rc.id !== c.id) })} className="text-slate-500 hover:text-red-400"><Trash2 size={16}/></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button onClick={() => updatePlan({ realityConstraints: [...plan.realityConstraints, { id: Date.now().toString(), category: '', detail: '', resourceToLeverage: '' }] })} className="w-full py-4 border-2 border-dashed border-white/10 rounded-2xl flex items-center justify-center gap-3 text-emerald-400 font-bold hover:bg-white/5 transition-all mt-4"><Plus size={24} /> הוספת אילוץ</button>
              </div>
            </div>
          </StageWrapper>
        );

      case WorkshopStage.STRATEGIC_OBJECTIVES:
        return (
          <StageWrapper title="שלב 4: מטרות על" subtitle="הגדרת הכיוונים האסטרטגיים הגדולים" icon={<Target size={28} />}>
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-4">
                <p className="text-slate-400 text-sm">המטרות שנגזרות מהחזון ומהמיקודים שהגדרנו.</p>
                <button onClick={() => handleAiDraft('objectives')} disabled={isAiDrafting} className="bg-emerald-600/20 text-emerald-400 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-emerald-600/30 disabled:opacity-50"><Wand2 size={14} /> {isAiDrafting ? 'מייצר...' : 'הצעת AI למטרות'}</button>
              </div>
              <div className="space-y-4">
                {plan.objectives.map(obj => (
                  <div key={obj.id} className="flex gap-4 items-center bg-slate-900 p-4 rounded-xl border border-white/10">
                    <Target className="text-emerald-500 shrink-0" size={20} />
                    <input className="w-full bg-transparent border-none text-white text-lg font-bold focus:ring-0" value={obj.title} onChange={e => updatePlan({ objectives: plan.objectives.map(o => o.id === obj.id ? { ...o, title: e.target.value } : o) })} placeholder="הכנס מטרת על..." />
                    <button onClick={() => updatePlan({ objectives: plan.objectives.filter(o => o.id !== obj.id) })} className="text-slate-600 hover:text-red-400"><Trash2 size={18} /></button>
                  </div>
                ))}
                <button onClick={() => updatePlan({ objectives: [...plan.objectives, { id: Date.now().toString(), title: '' }] })} className="w-full py-4 border-2 border-dashed border-white/10 rounded-xl text-emerald-400 font-bold flex items-center justify-center gap-2 hover:bg-white/5"><Plus size={20} /> הוספת מטרה</button>
              </div>
            </div>
          </StageWrapper>
        );

      case WorkshopStage.OPERATIONAL_GOALS:
        return (
          <StageWrapper title="שלב 5: יעדים אופרטיביים" subtitle="גזירת יעדים מדידים מהמטרות" icon={<Layers size={28} />}>
            <div className="space-y-10">
              {plan.objectives.map(obj => (
                <div key={obj.id} className="bg-slate-900/50 p-6 rounded-2xl border border-white/10 space-y-4 shadow-xl">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <h3 className="text-emerald-400 font-black flex items-center gap-2"><Target size={16}/> {obj.title || "מטרה ללא כותרת"}</h3>
                    <button onClick={() => handleAiDraft('goals', obj.id)} disabled={isAiDrafting} className="text-[10px] bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full hover:bg-emerald-500/20">הצעת AI ליעדים</button>
                  </div>
                  <div className="space-y-3">
                    {plan.goals.filter(g => g.parentObjectiveId === obj.id).map(goal => (
                      <div key={goal.id} className="flex gap-4 items-center bg-black/20 p-3 rounded-lg border border-white/5">
                        <input className="w-full bg-transparent border-none text-white font-medium focus:ring-0" value={goal.title} onChange={e => updatePlan({ goals: plan.goals.map(g => g.id === goal.id ? { ...g, title: e.target.value } : g) })} placeholder="הגדר יעד אופרטיבי..." />
                        <button onClick={() => updatePlan({ goals: plan.goals.filter(g => g.id !== goal.id) })} className="text-slate-600 hover:text-red-400"><Trash2 size={16} /></button>
                      </div>
                    ))}
                    <button onClick={() => updatePlan({ goals: [...plan.goals, { id: Date.now().toString(), parentObjectiveId: obj.id, title: '', tasks: [] }] })} className="text-emerald-400/60 text-xs font-bold flex items-center gap-1 hover:text-emerald-400"><Plus size={14} /> הוספת יעד</button>
                  </div>
                </div>
              ))}
            </div>
          </StageWrapper>
        );

      case WorkshopStage.DETAILED_TASKS:
        return (
          <StageWrapper title="שלב 6: משימות ולו״ז" subtitle="יורדים לרמת הביצוע ביומן" icon={<ClipboardList size={28} />}>
            <div className="space-y-10">
              {plan.goals.map(goal => (
                <div key={goal.id} className="bg-slate-900 p-6 rounded-2xl border-r-4 border-emerald-500 space-y-4 shadow-2xl">
                  <div className="flex justify-between items-center">
                    <h3 className="text-white font-bold text-lg">יעד: {goal.title || "יעד ללא כותרת"}</h3>
                    <button onClick={() => handleAiDraft('tasks', goal.id)} disabled={isAiDrafting} className="text-[10px] bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full hover:bg-emerald-500/20">הצעת AI למשימות</button>
                  </div>
                  <div className="space-y-2">
                    {goal.tasks.map(task => (
                      <div key={task.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center bg-black/30 p-3 rounded-xl border border-white/5">
                        <div className="md:col-span-6"><input className="w-full bg-transparent border-none text-slate-100 text-sm focus:ring-0 font-medium" value={task.description} onChange={e => updatePlan({ goals: plan.goals.map(g => g.id === goal.id ? { ...g, tasks: g.tasks.map(t => t.id === task.id ? { ...t, description: e.target.value } : t) } : g) })} placeholder="מה עושים?" /></div>
                        <div className="md:col-span-3"><input className="w-full bg-slate-800/50 rounded-lg p-2 text-xs text-white" value={task.owner} onChange={e => updatePlan({ goals: plan.goals.map(g => g.id === goal.id ? { ...g, tasks: g.tasks.map(t => t.id === task.id ? { ...t, owner: e.target.value } : t) } : g) })} placeholder="אחראי" /></div>
                        <div className="md:col-span-2"><input className="w-full bg-slate-800/50 rounded-lg p-2 text-xs text-emerald-400 font-mono" value={task.deadline} onChange={e => updatePlan({ goals: plan.goals.map(g => g.id === goal.id ? { ...g, tasks: g.tasks.map(t => t.id === task.id ? { ...t, deadline: e.target.value } : t) } : g) })} placeholder="לו״ז" /></div>
                        <div className="md:col-span-1 flex justify-end"><button onClick={() => updatePlan({ goals: plan.goals.map(g => g.id === goal.id ? { ...g, tasks: g.tasks.filter(t => t.id !== task.id) } : g) })} className="text-slate-600 hover:text-red-400"><Trash2 size={14}/></button></div>
                      </div>
                    ))}
                    <button onClick={() => updatePlan({ goals: plan.goals.map(g => g.id === goal.id ? { ...g, tasks: [...g.tasks, { id: Date.now().toString(), description: '', owner: '', deadline: '', priority: 'חשוב' }] } : g) })} className="text-emerald-400 text-xs font-bold flex items-center gap-1 mt-2"><Plus size={16}/> הוספת משימה</button>
                  </div>
                </div>
              ))}
            </div>
          </StageWrapper>
        );

      case WorkshopStage.FINAL_DASHBOARD:
        return (
          <div className="space-y-10 animate-fadeIn" dir="rtl">
            <div className="flex justify-between items-end pb-6 border-b border-white/10 print:hidden">
              <div>
                <h2 className="text-4xl font-black text-white mb-2 tracking-tight">תוצר סופי: תוכנית עבודה משולבת</h2>
                <p className="text-slate-400 italic">מצפן אסטרטגי לשפ"ח | {plan.vision || "לא הוגדר חזון"}</p>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={runFullIntegration} 
                  disabled={isIntegrating}
                  className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-500 shadow-lg transition-all disabled:opacity-50"
                >
                  {isIntegrating ? <RefreshCw className="animate-spin" size={20} /> : <BrainCircuit size={20} />}
                  אינטגרציה וחידוד אסטרטגי (Expert AI)
                </button>
                <button onClick={() => window.print()} className="bg-slate-800 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-700">
                  <Printer size={20} /> הדפסה ל-PDF
                </button>
              </div>
            </div>

            {plan.expertAnalysis && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 p-6 rounded-3xl print:bg-white print:text-black print:border-slate-300">
                <div className="flex items-center gap-3 text-emerald-400 font-black text-sm uppercase mb-3 print:text-black">
                  <Sparkles size={16}/> ניתוח אסטרטג מומחה:
                </div>
                <p className="text-slate-100 text-lg leading-relaxed print:text-black font-medium italic">"{plan.expertAnalysis}"</p>
              </div>
            )}

            <div className="bg-white overflow-hidden rounded-3xl shadow-2xl border-4 border-slate-900">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-slate-900 border-b-4 border-black">
                    <th className="p-5 border border-slate-700 text-sm font-black w-[20%] uppercase text-white">מטרה אסטרטגית</th>
                    <th className="p-5 border border-slate-700 text-sm font-black w-[20%] uppercase text-white">יעד אופרטיבי</th>
                    <th className="p-5 border border-slate-700 text-sm font-black w-[40%] uppercase text-white">משימות מפורטות</th>
                    <th className="p-5 border border-slate-700 text-sm font-black w-[10%] text-center uppercase text-white">אחראי</th>
                    <th className="p-5 border border-slate-700 text-sm font-black w-[10%] text-center uppercase text-white">לו"ז</th>
                  </tr>
                </thead>
                <tbody className="text-black">
                  {plan.objectives.map(obj => {
                    const objGoals = plan.goals.filter(g => g.parentObjectiveId === obj.id);
                    if (objGoals.length === 0) return (
                      <tr key={obj.id} className="border-b-2 border-slate-400">
                        <td className="p-5 border border-slate-400 font-black bg-slate-100 text-black text-xl leading-tight">{obj.title}</td>
                        <td colSpan={4} className="border border-slate-400 italic text-slate-600 p-5 font-bold">טרם הוגדרו יעדים</td>
                      </tr>
                    );
                    
                    return objGoals.map((goal, gIdx) => (
                      <React.Fragment key={goal.id}>
                        {goal.tasks.length === 0 ? (
                           <tr className="border-b-2 border-slate-400">
                            {gIdx === 0 && (
                              <td rowSpan={objGoals.length} className="p-5 border border-slate-400 font-black align-top bg-slate-100 text-black text-xl leading-tight">
                                {obj.title}
                                {obj.aiRefinement && <p className="text-xs text-emerald-700 mt-4 p-2 bg-emerald-50 rounded-lg border border-emerald-200 font-bold">שיפור AI: {obj.aiRefinement}</p>}
                              </td>
                            )}
                            <td className="p-5 border border-slate-400 font-black bg-white text-black text-lg">{goal.title}</td>
                            <td colSpan={3} className="p-5 border border-slate-400 italic text-slate-500 text-center font-bold">אין משימות ביצוע</td>
                          </tr>
                        ) : goal.tasks.map((task, tIdx) => (
                          <tr key={task.id} className={`border-b-2 border-slate-400 hover:bg-slate-50 ${task.isAiSuggested ? 'bg-emerald-50/50' : 'bg-white'}`}>
                            {gIdx === 0 && tIdx === 0 && (
                              <td rowSpan={objGoals.reduce((sum, g) => sum + Math.max(1, g.tasks.length), 0)} className="p-5 border border-slate-400 font-black align-top bg-slate-100 text-black text-xl leading-tight">
                                {obj.title}
                                {obj.aiRefinement && <div className="text-xs text-emerald-800 mt-4 p-3 bg-emerald-100/50 rounded-xl border-2 border-emerald-300 font-bold shadow-sm">💡 שדרוג אסטרטגי: {obj.aiRefinement}</div>}
                              </td>
                            )}
                            {tIdx === 0 && (
                              <td rowSpan={goal.tasks.length} className="p-5 border border-slate-400 font-black align-top bg-white text-black text-lg leading-snug">
                                {goal.title}
                                {goal.aiInsight && <div className="mt-3 p-3 bg-blue-50 rounded-xl border border-blue-200 text-[11px] text-blue-900 font-black leading-tight">AI INSIGHT: {goal.aiInsight}</div>}
                              </td>
                            )}
                            <td className={`p-5 border border-slate-400 text-md font-bold text-black leading-relaxed ${task.isAiSuggested ? 'border-r-8 border-r-emerald-600' : ''}`}>
                              {task.description}
                              {task.isAiSuggested && <span className="block mt-2 text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full w-fit font-black uppercase tracking-tighter shadow-sm">משימת מומחה AI</span>}
                            </td>
                            <td className="p-5 border border-slate-400 text-sm text-center font-black text-slate-900 bg-slate-50/50">{task.owner}</td>
                            <td className="p-5 border border-slate-400 text-sm text-center font-black text-slate-950 bg-slate-50/50">{task.deadline}</td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ));
                  })}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:mt-12">
              <div className="bg-slate-900 p-8 rounded-3xl border-2 border-white/20 shadow-2xl print:bg-white print:text-black print:border-slate-800">
                 <h4 className="text-sm font-black text-emerald-400 uppercase tracking-[0.2em] mb-6 border-b-2 border-white/10 pb-2 print:text-black print:border-black">ניתוח SWOT ומיקוד אסטרטגי</h4>
                 <div className="grid grid-cols-2 gap-6">
                    <div className="bg-white/5 p-4 rounded-2xl print:bg-slate-50"><p className="text-xs text-slate-400 font-black uppercase mb-1">חוזקות יחידתיות:</p><p className="text-sm text-slate-100 font-bold print:text-black">{plan.swot.strengths || "לא צוין"}</p></div>
                    <div className="bg-white/5 p-4 rounded-2xl print:bg-slate-50"><p className="text-xs text-slate-400 font-black uppercase mb-1">הזדמנויות:</p><p className="text-sm text-slate-100 font-bold print:text-black">{plan.swot.opportunities || "לא צוין"}</p></div>
                    <div className="col-span-2 bg-emerald-500/10 p-5 rounded-2xl border border-emerald-500/30 print:bg-slate-100 print:border-black"><p className="text-xs text-emerald-400 font-black uppercase mb-1 print:text-black">מיקודי השפ"ח לשנה הקרובה:</p><p className="text-lg text-white font-black leading-tight print:text-black">{plan.swot.focalPoints || "לא צוין"}</p></div>
                 </div>
              </div>
              <div className="bg-slate-900 p-8 rounded-3xl border-2 border-white/20 shadow-2xl print:bg-white print:text-black print:border-slate-800">
                 <h4 className="text-sm font-black text-amber-400 uppercase tracking-[0.2em] mb-6 border-b-2 border-white/10 pb-2 print:text-black print:border-black">איומים, אילוצים ומענים</h4>
                 <div className="space-y-4">
                    {plan.realityConstraints.map(c => (
                      <div key={c.id} className="bg-white/5 p-4 rounded-2xl border-r-4 border-amber-500 print:bg-slate-50 print:border-black">
                        <p className="text-slate-100 font-black text-sm mb-1 print:text-black">{c.category}: {c.detail}</p>
                        <p className="text-emerald-400 font-black italic text-xs">מענה מתוכנן: {c.resourceToLeverage}</p>
                      </div>
                    ))}
                    {plan.realityConstraints.length === 0 && <p className="text-slate-500 italic">לא הוגדרו אילוצים במערכת.</p>}
                 </div>
              </div>
            </div>
          </div>
        );
    }
  };

  const updateConstraint = (id: string, updates: Partial<RealityConstraint>) => {
    updatePlan({ realityConstraints: plan.realityConstraints.map(c => c.id === id ? { ...c, ...updates } : c) });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#050a18] text-slate-200 selection:bg-emerald-500 print:bg-white print:text-black">
      {renderWorkshopActivity()}
      <header className="glass-panel py-4 px-8 sticky top-0 z-50 border-b border-white/10 print:hidden">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => setStage(WorkshopStage.INTRO)}>
            <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-black shadow-lg">ש</div>
            <h1 className="text-lg font-black text-white italic tracking-tight">מצפן ניהול שפ"ח</h1>
          </div>
          <div className="flex gap-2">
            {stagesSequence.map(s => <div key={s} className={`w-3 h-3 rounded-full transition-all duration-300 ${stage === s ? 'bg-emerald-500 scale-150 shadow-[0_0_15px_rgba(16,185,129,0.7)]' : 'bg-slate-700'}`} />)}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 sm:p-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className={`lg:col-span-${stage === WorkshopStage.INTRO || stage === WorkshopStage.FINAL_DASHBOARD ? '12' : '8'}`}>
            {renderStage()}
            {stage !== WorkshopStage.INTRO && stage !== WorkshopStage.FINAL_DASHBOARD && (
              <div className="mt-12 py-6 border-t border-white/10 flex justify-between items-center sticky bottom-0 bg-[#050a18]/95 backdrop-blur-xl z-40 print:hidden">
                <button onClick={() => setStage(stagesSequence[stagesSequence.indexOf(stage) - 1])} className="flex items-center gap-2 text-slate-400 font-bold hover:text-emerald-400 transition-all active:scale-95">
                  <ChevronRight size={24}/> חזרה
                </button>
                <button onClick={() => setStage(stagesSequence[stagesSequence.indexOf(stage) + 1])} className="bg-white text-slate-900 px-10 py-4 rounded-xl font-black flex items-center gap-3 hover:bg-emerald-500 hover:text-white transition-all shadow-xl active:scale-95">
                  המשך <ChevronLeft size={24}/>
                </button>
              </div>
            )}
          </div>

          {stage !== WorkshopStage.INTRO && stage !== WorkshopStage.FINAL_DASHBOARD && (
            <div className="lg:col-span-4 lg:sticky lg:top-28 print:hidden space-y-6">
              <AIMentor advice={aiAdvice} loading={isAdviceLoading} />
              {PROFESSIONAL_GUIDANCE[stage] && (
                <div className="bg-slate-900/80 rounded-2xl p-6 shadow-xl border border-white/10">
                  <div className="flex items-center gap-2 text-emerald-400 font-black text-[10px] uppercase tracking-widest mb-3 border-b border-white/5 pb-2"><Info size={14} /> טיפ למנהל</div>
                  <p className="text-white text-sm italic leading-relaxed font-medium">"{PROFESSIONAL_GUIDANCE[stage].insight}"</p>
                  <div className="bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20 mt-4">
                    <h4 className="text-[9px] font-bold text-emerald-400 mb-1">דוגמה קונקרטית:</h4>
                    <p className="text-slate-300 text-[11px] italic leading-relaxed">{PROFESSIONAL_GUIDANCE[stage].example}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <footer className="py-8 text-center text-slate-700 text-[10px] uppercase tracking-[0.5em] border-t border-white/5 print:hidden">Shapah Integration Workshop 2025 | AI-Enhanced Strategy</footer>
    </div>
  );
}

export default App;
