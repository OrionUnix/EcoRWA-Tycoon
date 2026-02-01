'use client';

import { useEffect, useState } from 'react';
import { Wifi, ShieldCheck, Clock } from 'lucide-react';

export function TerminalHeader() {
  const [time, setTime] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setTime(now.toLocaleTimeString('fr-FR', { hour12: false }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="flex justify-between items-center p-4 bg-black/40 border-b border-white/10 backdrop-blur-md mb-4 rounded-t-lg">
      <div className="flex items-center gap-6">
        <div className="flex flex-col">
          <span className="text-[10px] text-emerald-500 font-bold tracking-[0.2em]">SYSTEM_OPERATIONAL</span>
          <h1 className="text-xl font-black italic text-white tracking-tighter">TACTICAL_OS v4.2</h1>
        </div>
        
        <div className="hidden md:flex gap-4 border-l border-white/10 pl-6">
          <div className="flex flex-col">
            <span className="text-[8px] text-slate-500 uppercase">Location</span>
            <span className="text-[10px] text-slate-300">PARIS_SECTOR_01</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] text-slate-500 uppercase">Status</span>
            <span className="text-emerald-500 text-[10px] flex items-center gap-1">
              <ShieldCheck size={10} /> ENCRYPTED
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6 font-mono">
        <div className="text-right flex flex-col">
          <span className="text-[8px] text-slate-500 uppercase flex items-center justify-end gap-1">
            <Clock size={10} /> System Time
          </span>
          <span className="text-slate-200 text-sm font-bold tracking-widest">{time || '00:00:00'}</span>
        </div>
        <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded">
          <Wifi size={18} className="animate-pulse" />
        </div>
      </div>
    </header>
  );
}