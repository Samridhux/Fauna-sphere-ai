
import React from 'react';

interface InfoSectionProps {
  title: string;
  children: React.ReactNode;
  icon?: string | React.ReactNode;
}

const InfoSection: React.FC<InfoSectionProps> = ({ title, children, icon }) => {
  return (
    <div className="group">
      <div className="flex items-center gap-4 mb-5">
        <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-2xl shadow-sm border border-slate-100 group-hover:bg-emerald-50 group-hover:border-emerald-100 transition-all duration-500">
          {icon}
        </div>
        <h3 className="text-2xl font-bold text-slate-800 tracking-tight">{title}</h3>
      </div>
      <div className="text-slate-600 leading-relaxed text-lg pl-16">
        {children}
      </div>
    </div>
  );
};

export default InfoSection;
