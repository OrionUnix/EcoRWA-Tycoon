'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirection automatique après 2 secondes pour profiter du loader
    const timer = setTimeout(() => {
      router.replace('/en');
    }, 2000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="fixed inset-0 bg-[#020617] flex flex-col items-center justify-center">
      <style jsx>{`
        .loader-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2rem;
        }

        .loader {
          width: 60px;
          aspect-ratio: .5;
          display: grid;
        }

        .loader:before {
          content: "";
          width: 30%;
          aspect-ratio: 1;
          border-radius: 50%;
          margin: auto auto 0;
          background: #FFFFFF;
          box-shadow: 0 0 15px rgba(255, 255, 255, 0.5);
          animation: l9-0 .5s cubic-bezier(0,800,1,800) infinite;
        }

        .loader:after {
          content: "";
          width: 100%;
          aspect-ratio: 1/cos(30deg);
          margin: 0 auto auto;
          clip-path: polygon(50% -50%,100% 50%,50% 150%,0 50%);
          background: #E84142; /* Rouge Avalanche */
          box-shadow: 0 0 20px rgba(232, 65, 66, 0.4);
          animation: l9-1 .5s linear infinite;
        }

        @keyframes l9-0 {
          0%,2%  {translate: 0   0%}
          98%,to {translate: 0 -.2%}
        }

        @keyframes l9-1 {
          0%,5%  {rotate:  0deg}
          95%,to {rotate:-60deg}
        }
      `}</style>

      <div className="loader-container">
        <div className="loader"></div>
        <div className="text-center">
          <div className="text-[#E84142] font-bold tracking-[0.3em] text-sm mb-1 uppercase">
            ECO RWA TYCOON
          </div>
          <div className="text-slate-500 font-mono text-xs animate-pulse">
            Loading ecosystem...
          </div>
        </div>
      </div>
    </div>
  );
}