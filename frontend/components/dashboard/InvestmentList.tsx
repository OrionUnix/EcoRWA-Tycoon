'use client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

export default function InvestmentList({ buildings, isClaiming, onClaim, t }: any) {
  return (
    <Card className="p-6 bg-slate-900/50 border-slate-800 mb-8">
      <h2 className="text-xl font-bold text-white mb-4">📊 {t('myInvestments')}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {buildings.map(({ building, stats, id }: any) => (
          stats?.balance > 0 && (
            <Card key={id} className="p-4 bg-slate-800/50 border-slate-700">
              <h3 className="font-semibold text-white mb-3 flex justify-between">
                {building?.name} <Badge>{stats.balance} {t('parts')}</Badge>
              </h3>
              <div className="space-y-2 text-sm text-slate-400">
                <div className="flex justify-between"><span>{t('invested')}</span><span className="text-white">${stats.investedAmount.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Yield</span><span className="text-green-400">${stats.annualYield.toFixed(2)}/an</span></div>
              </div>
              {stats.pendingYield > 0.01 && (
                <Button size="sm" className="w-full mt-4 bg-yellow-600" onClick={() => onClaim(id)} disabled={isClaiming}>
                  {isClaiming ? <Loader2 className="animate-spin" /> : `Claim $${stats.pendingYield.toFixed(4)}`}
                </Button>
              )}
            </Card>
          )
        ))}
      </div>
    </Card>
  );
}