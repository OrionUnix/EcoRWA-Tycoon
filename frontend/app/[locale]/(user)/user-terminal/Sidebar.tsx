'use client';
import { useState } from 'react';
import { LayoutDashboard, Building2, Wallet, PieChart, Settings, ChevronRight, Zap } from 'lucide-react';
import { cn } from '@/lib/utils'; // Utilitaire classique pour les classes conditionnelles

export default function TerminalSidebar() {
  const [isExpanded, setIsExpanded] = useState(false);

  const menuItems = [
    { icon: LayoutDashboard, label: 'Terminal', active: true },
    { icon: Building2, label: 'Marketplace', active: false },
    { icon: Wallet, label: 'Portfolio', active: false },
    { icon: PieChart, label: 'Analytics', active: false },
  ];

  return (
    <aside 
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      className={cn(
        "fixed left-0 top-0 h-screen z-50 transition-all duration-500 ease-in-out border-r border-white/10 backdrop-blur-2xl bg-black/20",
        isExpanded ? "w-64" : "w-20"
      )}
    >
      <div className="flex flex-col h-full p-4">
        {/* Logo Area */}
        <div className="flex items-center gap-4 mb-12 px-2">
          <div className="w-10 h-10 bg-[#E84142] rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(232,65,66,0.4)]">
            <Zap size={20} className="fill-white text-white" />
          </div>
          {isExpanded && <span className="title-huge text-lg normal-case not-italic">EcoRWA</span>}
        </div>

        {/* Navigation items */}
        <nav className="space-y-4 flex-grow">
          {menuItems.map((item, idx) => (
            <button
              key={idx}
              className={cn(
                "w-full flex items-center gap-4 p-3 rounded-2xl transition-all group",
                item.active ? "bg-[#E84142]/10 text-[#E84142]" : "text-slate-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon size={24} className={cn("transition-transform", item.active ? "scale-110" : "group-hover:scale-110")} />
              {isExpanded && <span className="font-bold uppercase tracking-widest text-[10px]">{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="mt-auto pt-4 border-t border-white/10">
          <button className="w-full flex items-center gap-4 p-3 text-slate-500 hover:text-white transition-colors">
            <Settings size={24} />
            {isExpanded && <span className="font-bold uppercase tracking-widest text-[10px]">Config</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}