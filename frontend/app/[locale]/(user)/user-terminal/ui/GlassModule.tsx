// app/[locale]/(user)/user-terminal/ui/GlassModule.tsx
import React from 'react';

interface Props {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

export function GlassModule({ children, title, className = "" }: Props) {
  return (
    <div className={`glass-card p-6 flex flex-col relative ${className}`}>
      {title && (
        <div className="flex justify-between items-start mb-6">
          <span className="label-mono opacity-100 text-[#E84142]">{title}</span>
          <div className="w-1.5 h-1.5 bg-[#E84142] rounded-full shadow-[0_0_10px_#E84142] animate-pulse" />
        </div>
      )}
      <div className="relative z-10 h-full flex flex-col">
        {children}
      </div>
    </div>
  );
}