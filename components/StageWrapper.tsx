
import React from 'react';

interface StageWrapperProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  icon: React.ReactNode;
}

const StageWrapper: React.FC<StageWrapperProps> = ({ title, subtitle, children, icon }) => {
  return (
    <div className="flex flex-col h-full animate-fadeIn">
      <div className="flex items-center gap-5 mb-10">
        <div className="p-4 bg-emerald-600/20 text-emerald-400 rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.2)] border border-emerald-500/30">
          {icon}
        </div>
        <div>
          <h2 className="text-4xl font-extrabold text-white tracking-tight leading-tight">{title}</h2>
          <p className="text-emerald-400/80 text-xl mt-1 font-light italic">{subtitle}</p>
        </div>
      </div>
      <div className="flex-1 space-y-8">
        {children}
      </div>
    </div>
  );
};

export default StageWrapper;
