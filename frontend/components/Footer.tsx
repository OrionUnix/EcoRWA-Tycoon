import { Github, Twitter, ExternalLink, Shield, Code } from 'lucide-react';

interface FooterProps {
  locale?: 'fr' | 'en';
}

export default function Footer({ locale = 'fr' }: FooterProps) {
  const t = {
    fr: {
      description: "Plateforme de tokenisation immobilière sur Avalanche Fuji Testnet",
      project: "Projet",
      github: "Code Source",
      hackathon: "Hackathon Avalanche",
      social: "Réseaux Sociaux",
      developer: "Développeur",
      legal: "Légal",
      terms: "Conditions d'utilisation",
      license: "Licence Gratuite",
      testnet: "Testnet Uniquement",
      testnetDesc: "Ce projet est déployé sur Avalanche Fuji Testnet à des fins de démonstration",
      hackathonDesc: "Projet développé pour le Build Games Hackathon d'Avalanche",
      madeWith: "Fait avec",
      rights: "Tous droits réservés"
    },
    en: {
      description: "Real Estate Tokenization Platform on Avalanche Fuji Testnet",
      project: "Project",
      github: "Source Code",
      hackathon: "Avalanche Hackathon",
      social: "Social Media",
      developer: "Developer",
      legal: "Legal",
      terms: "Terms of Use",
      license: "Free License",
      testnet: "Testnet Only",
      testnetDesc: "This project is deployed on Avalanche Fuji Testnet for demonstration purposes",
      hackathonDesc: "Project developed for Avalanche Build Games Hackathon",
      madeWith: "Made with",
      rights: "All rights reserved"
    }
  }[locale];

  const socialLinks = [
    {
      name: 'X (Twitter)',
      url: 'https://x.com/OrionDeimos',
      icon: <Twitter className="w-5 h-5" />
    },
    {
      name: 'GitHub Profile',
      url: 'https://github.com/OrionUnix',
      icon: <Github className="w-5 h-5" />
    }
  ];

  const projectLinks = [
    {
      name: t.github,
      url: 'https://github.com/OrionUnix/EcoRWA-Tycoon',
      icon: <Code className="w-5 h-5" />
    },
    {
      name: t.hackathon,
      url: 'https://build.avax.network/build-games',
      icon: <ExternalLink className="w-5 h-5" />
    }
  ];

  return (
    <footer className="relative bg-slate-950 border-t border-white/10">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-950/20 to-purple-950/20 pointer-events-none" />
      
      <div className="relative container mx-auto px-6 py-16 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Logo et Description */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 relative flex items-center justify-center bg-blue-500/10 rounded-lg border border-blue-400/30">
                <img 
                  src="/logo.svg" 
                  alt="EcoRWA Logo" 
                  className="w-6 h-6 object-contain brightness-0 invert" 
                />
              </div>
              <div className="text-2xl font-black tracking-tighter">
                Eco<span className="text-blue-400">RWA</span>
              </div>
            </div>
            <p className="text-slate-400 leading-relaxed mb-6 max-w-md">
              {t.description}
            </p>
            
            {/* Testnet Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-400/30 text-orange-400 text-xs font-bold">
              <Shield className="w-3 h-3" />
              {t.testnet}
            </div>
          </div>

          {/* Projet */}
          <div>
            <h3 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">
              {t.project}
            </h3>
            <ul className="space-y-3">
              {projectLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-slate-400 hover:text-blue-400 transition-colors group"
                  >
                    {link.icon}
                    <span className="group-hover:translate-x-1 transition-transform">
                      {link.name}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Réseaux Sociaux */}
          <div>
            <h3 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">
              {t.social}
            </h3>
            <ul className="space-y-3">
              {socialLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-slate-400 hover:text-blue-400 transition-colors group"
                  >
                    {link.icon}
                    <span className="group-hover:translate-x-1 transition-transform">
                      {link.name}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Informations légales */}
        <div className="pt-8 border-t border-white/10">
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
              <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-400" />
                {t.testnet}
              </h4>
              <p className="text-slate-400 text-sm">
                {t.testnetDesc}
              </p>
            </div>
            
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
              <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-purple-400" />
                {t.hackathon}
              </h4>
              <p className="text-slate-400 text-sm">
                {t.hackathonDesc}
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
            <div className="text-slate-400">
              © 2025 EcoRWA. {t.rights}
            </div>
            
            <div className="flex items-center gap-6">
              <span className="text-slate-400">{t.license}</span>
              <span className="text-slate-600">•</span>
              <a 
                href="#terms" 
                className="text-slate-400 hover:text-blue-400 transition-colors"
              >
                {t.terms}
              </a>
              <span className="text-slate-600">•</span>
              <div className="text-slate-400">
                {t.madeWith} <span className="text-red-400">❤️</span> {t.developer}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}