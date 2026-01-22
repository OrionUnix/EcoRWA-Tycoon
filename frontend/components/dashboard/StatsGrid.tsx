'use client';
import { Card } from '@/components/ui/card';

interface StatsGridProps {
  totalParts: number;
  totalInvested: number;
  avgYield: number;
  totalPending: number;
  t: (key: string) => string;
}

export default function StatsGrid({ totalParts, totalInvested, avgYield, totalPending, t }: StatsGridProps) {
  const stats = [
    { label: t('myParts'), val: totalParts, color: 'text-white', icon: '💼' },
    { label: t('totalInvested'), val: `$${totalInvested.toFixed(2)}`, color: 'text-white', icon: '💰' },
    { label: t('annualYield'), val: `${avgYield.toFixed(2)}%`, color: 'text-green-400', icon: '📈' },
    { label: t('yieldsToClaim'), val: `$${totalPending.toFixed(2)}`, color: 'text-yellow-400', icon: '💸' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      {stats.map((s, i) => (
        <Card key={i} className="p-6 bg-slate-900/50 border-slate-800 hover:border-blue-500/50 transition-all">
          <p className="text-slate-400 text-sm mb-1">{s.icon} {s.label}</p>
          <p className={`text-3xl font-bold ${s.color}`}>{s.val}</p>
        </Card>
      ))}
    </div>
  );
}