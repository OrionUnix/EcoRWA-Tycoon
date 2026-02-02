import { GlassModule } from "../ui/GlassModule";

export function PerformanceGauge({ value = 7.5 }: { value?: number }) {
  // Calcul de la rotation pour l'aiguille
  const rotation = (value / 10) * 180 - 90;

  return (
    <GlassModule title="MARKET_TENSION_INDEX">
      <div className="relative h-40 w-full flex items-center justify-center overflow-hidden">
        {/* L'arc SVG */}
        <svg className="w-48 h-48 transform -rotate-[225deg]">
          <circle
            cx="96"
            cy="96"
            r="70"
            fill="none"
            stroke="#1e293b"
            strokeWidth="12"
            strokeDasharray="330 440"
            strokeLinecap="round"
          />
          <circle
            cx="96"
            cy="96"
            r="70"
            fill="none"
            stroke="url(#gauge-gradient)"
            strokeWidth="12"
            strokeDasharray={`${(value / 10) * 330} 440`}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
          <defs>
            <linearGradient id="gauge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
          </defs>
        </svg>

        {/* Le score au centre */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-4">
          <span className="text-5xl font-black italic tracking-tighter text-white">
            {value.toFixed(1)}
          </span>
          <p className="label-mono text-[9px] text-slate-500 uppercase">Score_Unit</p>
        </div>
      </div>

      {/* Légende sans 'cn' */}
      <div className="grid grid-cols-4 gap-2 mt-4">
        {['Low', 'Mid', 'High', 'Crit'].map((label, i) => {
          const colors = [
            "bg-emerald-500", 
            "bg-amber-500", 
            "bg-orange-600", 
            "bg-red-600 opacity-40"
          ];
          
          return (
            <div key={label} className="flex flex-col gap-1.5">
              <div className={`h-1 w-full rounded-full ${colors[i]}`} />
              <span className="text-[8px] font-bold uppercase text-slate-500 text-center">
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </GlassModule>
  );
}