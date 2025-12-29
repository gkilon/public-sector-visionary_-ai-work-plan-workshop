
import React from 'react';
import { Sparkles, Link, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { AIAdvice } from '../types';

interface AIMentorProps {
  advice: AIAdvice | null;
  loading: boolean;
  error?: string | null;
  onRetry?: () => void;
}

const AIMentor: React.FC<AIMentorProps> = ({ advice, loading, error, onRetry }) => {
  if (loading) {
    return (
      <div className="bg-slate-900/40 border border-emerald-500/20 rounded-2xl p-5 animate-pulse space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={14} className="text-emerald-500 animate-spin" />
          <div className="h-2 bg-emerald-500/10 rounded w-1/3"></div>
        </div>
        <div className="h-2 bg-slate-800 rounded w-full"></div>
        <div className="h-2 bg-slate-800 rounded w-2/3"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel rounded-2xl p-5 shadow-xl space-y-3 border border-red-500/20 text-right">
        <div className="flex items-center gap-2 text-red-400 font-bold text-xs border-b border-white/5 pb-2 uppercase tracking-widest">
          <AlertCircle size={14} />
          <span>ה-AI זמנית לא זמין</span>
        </div>
        <p className="text-slate-400 text-xs leading-relaxed">
          נראה שהגענו למכסת השימוש הרגעית. ניתן להמשיך עם ההנחיות המובנות למטה או לנסות שוב.
        </p>
        {onRetry && (
          <button 
            onClick={onRetry}
            className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 text-[11px] font-bold transition-colors"
          >
            <RefreshCw size={12} />
            <span>נסה שוב לעדכן ייעוץ AI</span>
          </button>
        )}
      </div>
    );
  }

  if (!advice) return null;

  return (
    <div className="glass-panel rounded-2xl p-5 shadow-xl space-y-5 border border-white/5 text-right">
      <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs border-b border-white/5 pb-2 uppercase tracking-widest">
        <Sparkles size={14} className="animate-pulse" />
        <span>מצפן AI למנהלים</span>
      </div>
      
      <div className="space-y-4">
        <p className="text-slate-200 leading-snug text-sm italic font-medium">
          "{advice.philosophicalInsight}"
        </p>

        {advice.example && (
          <div className="bg-emerald-500/5 border border-emerald-500/20 p-3 rounded-xl">
            <h4 className="text-[10px] font-bold text-emerald-400 mb-1 flex items-center gap-1">
              <CheckCircle size={10} /> דוגמה לניסוח נכון:
            </h4>
            <p className="text-slate-300 text-xs italic leading-relaxed">
              {advice.example}
            </p>
          </div>
        )}

        <div className="space-y-1">
          <p className="text-slate-300 text-xs leading-relaxed">
            {advice.content}
          </p>
        </div>

        {advice.nextStepConnection && (
          <div className="flex gap-2 items-start border-t border-white/5 pt-3">
            <Link size={12} className="text-amber-400 mt-0.5 shrink-0" />
            <p className="text-amber-200/70 text-[11px] leading-tight font-light">
              <span className="font-bold">הקשר לשלב הבא:</span> {advice.nextStepConnection}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIMentor;
