'use client';
import { useTranslations } from 'next-intl';
import { Github, Twitter, Instagram, Linkedin, Heart } from 'lucide-react';

export default function Footer() {

  const t = useTranslations('footer');

  return (
    <footer className="bg-[#020617] px-6 pb-12">
      <div className="max-w-7xl mx-auto">
        
  
        <div className="relative rounded-[3rem] border border-white/5 bg-white/[0.02] backdrop-blur-md p-8 md:p-12 overflow-hidden transition-all duration-500 hover:border-[#E84142]/20">
          
          <div className="flex flex-col md:flex-row justify-between items-center gap-12 relative z-10">
            

            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <div className="flex items-center gap-4 mb-4">
                <img src="/logo.svg" alt="Logo" className="w-10 h-10 brightness-0 invert" />
                <h2 className="text-3xl font-black text-white tracking-tighter italic uppercase">
                  Eco<span className="text-[#E84142]">RWA</span>
                </h2>
              </div>
        
              <p className="text-slate-400 text-lg font-medium leading-tight max-w-sm">
                {t('tagline')} 
              
              </p>
            </div>


            <div className="flex gap-4">
              {[ 
                { icon: <Twitter size={20} />, url: "https://x.com/OrionDeimos" },
                { icon: <Github size={20} />, url: "https://github.com/OrionUnix" },

              ].map((social, i) => (
                <a 
                  key={i} 
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-14 h-14 flex items-center justify-center rounded-[1.5rem] bg-white/[0.03] border border-white/5 text-white/40 hover:text-[#E84142] hover:border-[#E84142]/40 hover:bg-white/[0.05] transition-all duration-300 group shadow-lg"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/10 to-transparent my-10" />

          {/* Bottom Bar */}
          <div className="relative flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] font-bold uppercase tracking-[0.2em]">
            
       
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-slate-500">
                <div className="w-2 h-2 rounded-full bg-[#E84142] animate-pulse shadow-[0_0_8px_#E84142]" />
                © 2025 EcoRWA. {t('rights')}
              </div>
              <div className="hidden md:flex gap-6">
                <a href="#" className="text-slate-500 hover:text-white transition-colors">{t('privacy')}</a>
                <a href="#" className="text-slate-500 hover:text-white transition-colors">{t('terms')}</a>
              </div>
            </div>
            
           
            <a 
              href="https://github.com/OrionUnix" 
              target="_blank" 
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/5 text-slate-400 hover:border-[#E84142]/30 hover:text-white transition-all duration-300"
            >
              <span>{t('madeWith')}</span>
              <Heart size={12} className="text-[#E84142] fill-[#E84142] animate-pulse" />
              <span>{t('by')} OrionDeimos</span>
            </a>

          </div>

        
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-[#E84142]/5 blur-[100px] rounded-full pointer-events-none" />
        </div>
      </div>
    </footer>
  );
}