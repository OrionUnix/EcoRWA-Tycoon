'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/en');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center">
      <div className="text-slate-500 font-mono animate-pulse">Initializing...</div>
    </div>
  );
}