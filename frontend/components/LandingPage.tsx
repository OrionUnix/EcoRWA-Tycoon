'use client';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Globe, ShieldCheck, Cpu, TrendingUp, Languages, Building2, Wallet, LineChart } from 'lucide-react';
import React from 'react';
import { Building2, Zap, TrendingUp, Users, ArrowRight, Sparkles } from 'lucide-react';
const LOGO_PATH = "/logo.svg";

interface LandingPageProps {
  onGetStarted: () => void;
  locale?: 'fr' | 'en';
}

// Composant pour la ville SVG animée
function AnimatedCitySVG() {
  const svgRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isNight, setIsNight] = useState(false);

  useEffect(() => {
    const loadAndAnimateSVG = async () => {
      try {
        const response = await fetch('/assets/isometric_city.svg');
        const svgText = await response.text();
        
        if (svgRef.current) {
          svgRef.current.innerHTML = svgText;
          setIsLoaded(true);
          
          setTimeout(() => {
            startDayNightCycle();
          }, 100);
        }
      } catch (error) {
        console.error('Erreur SVG:', error);
      }
    };

    loadAndAnimateSVG();
  }, []);

  const startDayNightCycle = () => {
    // Cycle jour/nuit toutes les 10 secondes
    setInterval(() => {
      setIsNight(prev => !prev);
      
      const newIsNight = !isNight;
      
      // 1. ANIMATION DES LAMPADAIRES
      const streetlightGroups = [
        'streetlight_group_02',
        'streetlight_group_1'
      ];

      streetlightGroups.forEach((groupId, index) => {
        const group = document.getElementById(groupId);
        if (!group) return;

        let aura = group.querySelector('.streetlight-aura') as SVGElement;
        
        if (!aura && newIsNight) {
          aura = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          aura.classList.add('streetlight-aura');
          aura.setAttribute('r', '80');
          aura.setAttribute('fill', 'url(#streetlight-gradient-' + index + ')');
          aura.setAttribute('opacity', '0');
          
          const bbox = group.getBBox();
          aura.setAttribute('cx', (bbox.x + bbox.width / 2).toString());
          aura.setAttribute('cy', (bbox.y + bbox.height / 2).toString());
          
          const defs = document.querySelector('defs') || document.createElementNS('http://www.w3.org/2000/svg', 'defs');
          if (!document.querySelector('defs')) {
            svgRef.current?.querySelector('svg')?.appendChild(defs);
          }
          
          const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient');
          gradient.id = 'streetlight-gradient-' + index;
          gradient.innerHTML = `
            <stop offset="0%" style="stop-color:#ffb347;stop-opacity:0.8" />
            <stop offset="30%" style="stop-color:#ffa500;stop-opacity:0.5" />
            <stop offset="60%" style="stop-color:#ff8c00;stop-opacity:0.2" />
            <stop offset="100%" style="stop-color:#ff6b00;stop-opacity:0" />
          `;
          defs.appendChild(gradient);
          
          group.insertBefore(aura, group.firstChild);
        }

        const lights = group.querySelectorAll('path, polygon, circle:not(.streetlight-aura)');
        
        if (newIsNight) {
          setTimeout(() => {
            if (aura) {
              aura.style.transition = 'opacity 2s ease-in-out';
              aura.setAttribute('opacity', '0.7');
            }
            
            lights.forEach((light: Element) => {
              const svgLight = light as SVGElement;
              svgLight.style.transition = 'all 2s ease-in-out';
              svgLight.style.filter = 'drop-shadow(0 0 25px #ffb347) drop-shadow(0 0 40px #ffa500) brightness(3)';
              svgLight.style.opacity = '1';
            });
          }, index * 400);
        } else {
          setTimeout(() => {
            if (aura) {
              aura.style.transition = 'opacity 2s ease-in-out';
              aura.setAttribute('opacity', '0');
            }
            
            lights.forEach((light: Element) => {
              const svgLight = light as SVGElement;
              svgLight.style.transition = 'all 2s ease-in-out';
              svgLight.style.filter = 'none';
              svgLight.style.opacity = '1';
            });
          }, index * 400);
        }
      });

      // 2. ANIMATION DES FENÊTRES DES BÂTIMENTS
      const buildingGroups = [
        'house_02'
        
            ];

      buildingGroups.forEach((buildingId, buildingIndex) => {
        const building = document.getElementById(buildingId);
        if (!building) return;

        // Sélectionner les fenêtres (polygons et rectangles qui ressemblent à des fenêtres)
        const windows = building.querySelectorAll('polygon[class*="st"], rect[class*="st"]');
        
        if (newIsNight) {
          // NUIT : Allumer aléatoirement 30-50% des fenêtres
          setTimeout(() => {
            windows.forEach((window: Element, windowIndex: number) => {
              const svgWindow = window as SVGElement;
              
              // Allumer aléatoirement environ 40% des fenêtres
              if (Math.random() < 0.4) {
                const delay = Math.random() * 3000; // Délai aléatoire jusqu'à 3 secondes
                
                setTimeout(() => {
                  svgWindow.style.transition = 'all 1.5s ease-in-out';
                  svgWindow.style.fill = '#fff3b0'; // Couleur jaune chaud pour la lumière
                  svgWindow.style.filter = 'drop-shadow(0 0 8px #fff3b0) brightness(1.5)';
                  svgWindow.style.opacity = '0.9';
                }, delay);
              }
            });
          }, buildingIndex * 500);
        } else {
          // JOUR : Éteindre toutes les fenêtres
          setTimeout(() => {
            windows.forEach((window: Element) => {
              const svgWindow = window as SVGElement;
              svgWindow.style.transition = 'all 2s ease-in-out';
              svgWindow.style.fill = ''; // Retour à la couleur d'origine
              svgWindow.style.filter = 'none';
              svgWindow.style.opacity = '1';
            });
          }, buildingIndex * 500);
        }
      });
    }, 10000); // 10 secondes par cycle
  };

  return (
    <div 
      ref={svgRef}
      className="w-full h-full drop-shadow-2xl transition-all duration-2000"
      style={{
        animation: isLoaded ? 'float 6s ease-in-out infinite' : 'none',
        filter: isNight ? 'brightness(60%) hue-rotate(200deg)' : 'brightness(110%)'
      }}
    />
  );
}

// Particules avec positions fixes (pas de Math.random)
function FloatingParticles() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  const particles = [
    { left: 4.68, top: 15.26, duration: 5.39, delay: 1.06 },
    { left: 17.98, top: 92.28, duration: 5.68, delay: 0.24 },
    { left: 0.18, top: 50.50, duration: 3.12, delay: 0.49 },
    { left: 97.69, top: 20.34, duration: 4.14, delay: 0.88 },
    { left: 13.14, top: 41.72, duration: 3.70, delay: 1.19 },
    { left: 49.57, top: 12.03, duration: 5.90, delay: 0.33 },
    { left: 42.30, top: 79.82, duration: 5.39, delay: 0.62 },
    { left: 50.87, top: 58.57, duration: 3.59, delay: 1.76 },
    { left: 39.20, top: 45.42, duration: 4.78, delay: 1.57 },
    { left: 97.34, top: 62.07, duration: 3.42, delay: 0.24 }
  ];

  return (
    <div className="absolute inset-0 pointer-events-none">
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 bg-blue-400 rounded-full opacity-30"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            animation: `particle ${p.duration}s ease-in-out infinite`,
            animationDelay: `${p.delay}s`
          }}
        />
      ))}
    </div>
  );
}

export default function LandingPage({ onGetStarted, locale: initialLocale = 'fr' }: LandingPageProps) {
  const [locale, setLocale] = useState<'fr' | 'en'>(initialLocale);
  const [scrollY, setScrollY] = useState(0);
  const [activeSection, setActiveSection] = useState('hero');
  const cityRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
      
      const sections = ['hero', 'stats', 'how-it-works', 'buildings', 'cta'];
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 100 && rect.bottom >= 100) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const translations = {
    fr: {
      tag: "L'immobilier 3.0 sur Avalanche",
      title: "INVESTISSEZ DANS",
      subtitle: "L'AVENIR RWA.",
      desc: "EcoRWA transforme les actifs immobiliers en tokens fractionnés. Gérez votre portefeuille via notre interface 3D immersive.",
      cta: "Lancer l'App",
      stats: ["Valeur Totale", "Rendement", "Immeubles", "Réseau"],
      howItWorks: "Comment ça marche",
      step1Title: "Connectez votre Wallet",
      step1Desc: "Connectez votre wallet Metamask à Avalanche Fuji Testnet",
      step2Title: "Choisissez un Immeuble",
      step2Desc: "Parcourez notre carte 3D et sélectionnez l'immeuble qui vous intéresse",
      step3Title: "Investissez en Tokens",
      step3Desc: "Achetez des parts fractionnées et percevez des revenus locatifs automatiques",
      featuredBuildings: "Immeubles Disponibles",
      ctaTitle: "Prêt à investir dans le futur ?",
      ctaDesc: "Rejoignez la révolution RWA et commencez à percevoir des revenus passifs dès aujourd'hui.",
      navStats: "Stats",
      navHow: "Comment",
      navBuildings: "Immeubles"
    },
    en: {
      tag: "Real Estate 3.0 on Avalanche",
      title: "INVEST IN THE",
      subtitle: "RWA FUTURE.",
      desc: "EcoRWA transforms real estate assets into fractional tokens. Manage your portfolio through our immersive 3D interface.",
      cta: "Launch App",
      stats: ["Total Value", "Avg Yield", "Buildings", "Network"],
      howItWorks: "How It Works",
      step1Title: "Connect Your Wallet",
      step1Desc: "Connect your Metamask wallet to Avalanche Fuji Testnet",
      step2Title: "Choose a Building",
      step2Desc: "Browse our 3D map and select the building that interests you",
      step3Title: "Invest in Tokens",
      step3Desc: "Buy fractional shares and receive automatic rental income",
      featuredBuildings: "Available Buildings",
      ctaTitle: "Ready to invest in the future?",
      ctaDesc: "Join the RWA revolution and start earning passive income today.",
      navStats: "Stats",
      navHow: "How",
      navBuildings: "Buildings"
    }
  };

  const t = translations[locale];

  const buildings = [
    { name: "Loft Saint-Germain", img: "/assets/buildings/Loft_Saint-Germain.svg", yield: "7.2%", price: "$250K" },
    { name: "Bistro", img: "/assets/buildings/bistro.svg", yield: "6.8%", price: "$180K" },
    { name: "EcoTower 2030", img: "/assets/buildings/EcoTower_2030.svg", yield: "8.1%", price: "$420K" }
  ];

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white overflow-hidden">
      {/* Animated Background Pattern */}
      <div className="fixed inset-0 opacity-20 pointer-events-none">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, rgb(59, 130, 246) 1px, transparent 0)',
            backgroundSize: '50px 50px',
            transform: `translateY(${scrollY * 0.1}px)`
          }}
        />
      </div>

interface LandingCitySectionProps {
  onGetStarted: () => void;
}

export default function LandingCitySection({ onGetStarted }: LandingCitySectionProps) {
  return (
    <section className="relative py-20 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-purple-900/20 to-slate-900" />
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-green-500/20 border border-green-500/30 rounded-full px-6 py-2 mb-6">
            <Sparkles className="w-5 h-5 text-green-400" />
            <span className="text-green-300 font-semibold">Nouvelle Fonctionnalité</span>
          </div>
          
          <h2 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
              Créez Votre Empire
            </span>
          </h2>
          
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Pas assez de fonds pour investir dans l'immobilier ? Commencez par créer votre ville, 
            extrayez des ressources précieuses, et construisez votre capital pour ensuite investir dans 
            des <span className="text-purple-400 font-semibold">Real World Assets tokenisés</span>.
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
          {/* Left: Features */}
          <div className="space-y-8">
            <div className="flex gap-6 group">
              <div className="flex-shrink-0">
                <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Building2 className="w-7 h-7 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Génération Procédurale
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  Chaque ville est <span className="text-yellow-400 font-semibold">unique</span> avec une 
                  carte générée aléatoirement. Découvrez des gisements d'or, diamant, pétrole, 
                  eau, argent et charbon cachés dans votre territoire.
                </p>
              </div>
            </div>

            <div className="flex gap-6 group">
              <div className="flex-shrink-0">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Zap className="w-7 h-7 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Extraction & Production
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  Construisez des <span className="text-blue-400 font-semibold">mines et raffineries</span> pour 
                  extraire automatiquement les ressources. Plus vous explorez, plus vous découvrez 
                  de richesses enfouies dans votre territoire.
                </p>
              </div>
            </div>

            <div className="flex gap-6 group">
              <div className="flex-shrink-0">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-7 h-7 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Marketplace P2P
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  Vendez vos ressources à d'autres joueurs sur le <span className="text-purple-400 font-semibold">marketplace décentralisé</span>. 
                  Échangez vos tokens $ECOR contre MockUSDC pour investir dans l'immobilier tokenisé.
                </p>
              </div>
            </div>

            <div className="flex gap-6 group">
              <div className="flex-shrink-0">
                <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users className="w-7 h-7 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Économie Connectée
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  Votre ville n'est pas isolée ! Connectée à l'écosystème EcoRWA, elle vous permet de 
                  <span className="text-green-400 font-semibold"> générer du capital</span> pour acheter des 
                  parts de biens immobiliers réels et recevoir des revenus locatifs.
                </p>
              </div>
            </div>
          </div>

          {/* Right: Visual Demo / Stats */}
          <div className="space-y-6">
            {/* Main Card */}
            <div className="bg-gradient-to-br from-green-900/60 to-emerald-900/60 backdrop-blur-xl rounded-3xl p-8 border-2 border-green-500/30 shadow-2xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-4 rounded-2xl">
                  <Building2 className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h4 className="text-2xl font-bold text-white">Créer une Ville</h4>
                  <p className="text-green-300">Votre premier pas vers l'empire</p>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="bg-black/30 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-300">Coût de création</span>
                    <span className="text-2xl font-bold text-white">0.1 AVAX</span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 w-full" />
                  </div>
                </div>

                <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-green-300">Récompense initiale</span>
                    <span className="text-2xl font-bold text-green-400">1000 $ECOR</span>
                  </div>
                  <p className="text-sm text-gray-300">
                    + Ressources aléatoires d'une valeur estimée entre 500-5000 $ECOR
                  </p>
                </div>
              </div>

              <button
                onClick={onGetStarted}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-5 px-8 rounded-xl transition-all transform hover:scale-105 shadow-lg shadow-green-500/30 flex items-center justify-center gap-3 group"
              >
                <span className="text-lg">Commencer Maintenant</span>
                <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
              </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-5 border border-white/20">
                <div className="text-3xl font-bold text-white mb-1">156</div>
                <div className="text-gray-300 text-sm">Villes créées</div>
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-5 border border-white/20">
                <div className="text-3xl font-bold text-white mb-1">12.4K</div>
                <div className="text-gray-300 text-sm">$ECOR générés/jour</div>
              </div>
            </div>
          </div>
        </div>

        {/* Flow Diagram */}
        <div className="bg-white/5 backdrop-blur-lg rounded-3xl p-8 border border-white/10">
          <h3 className="text-2xl font-bold text-white text-center mb-8">
            🔄 De la Ville aux Parts Immobilières
          </h3>
          
          <div className="flex flex-wrap items-center justify-center gap-4">
            <div className="flex flex-col items-center gap-2">
              <div className="bg-green-500/20 border border-green-500/30 rounded-xl px-6 py-4">
                <Building2 className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <div className="text-white font-semibold">Créer Ville</div>
                <div className="text-green-300 text-sm">0.1 AVAX</div>
              </div>
            </div>

            <ArrowRight className="w-8 h-8 text-gray-500 hidden sm:block" />

            <div className="flex flex-col items-center gap-2">
              <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-xl px-6 py-4">
                <Zap className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                <div className="text-white font-semibold">Extraire</div>
                <div className="text-yellow-300 text-sm">Ressources</div>
              </div>
            </div>

            <ArrowRight className="w-8 h-8 text-gray-500 hidden sm:block" />

            <div className="flex flex-col items-center gap-2">
              <div className="bg-purple-500/20 border border-purple-500/30 rounded-xl px-6 py-4">
                <TrendingUp className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                <div className="text-white font-semibold">Vendre</div>
                <div className="text-purple-300 text-sm">Marketplace</div>
              </div>
            </div>

            <ArrowRight className="w-8 h-8 text-gray-500 hidden sm:block" />

            <div className="flex flex-col items-center gap-2">
              <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl px-6 py-4">
                <Building2 className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <div className="text-white font-semibold">Investir</div>
                <div className="text-blue-300 text-sm">Parts RWA</div>
              </div>
            </div>
          </div>

          <p className="text-center text-gray-400 mt-6 text-sm">
            Ou utilisez vos ressources directement pour construire plus et augmenter votre production !
          </p>
        </div>
      </div>
    </section>
  );
}

      {/* Navbar Sticky */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-white/10 transition-all">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 relative flex items-center justify-center bg-white/10 rounded-lg backdrop-blur-md border border-white/20">
              <img 
                src={LOGO_PATH} 
                alt="EcoRWA Logo" 
                className="w-6 h-6 object-contain brightness-0 invert" 
              />
            </div>
            <div className="text-2xl font-black tracking-tighter">
              Eco<span className="text-blue-400">RWA</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <button 
              onClick={() => scrollToSection('stats')}
              className={`text-sm font-medium transition-colors ${activeSection === 'stats' ? 'text-blue-400' : 'text-slate-400 hover:text-white'}`}
            >
              {t.navStats}
            </button>
            <button 
              onClick={() => scrollToSection('how-it-works')}
              className={`text-sm font-medium transition-colors ${activeSection === 'how-it-works' ? 'text-blue-400' : 'text-slate-400 hover:text-white'}`}
            >
              {t.navHow}
            </button>
            <button 
              onClick={() => scrollToSection('buildings')}
              className={`text-sm font-medium transition-colors ${activeSection === 'buildings' ? 'text-blue-400' : 'text-slate-400 hover:text-white'}`}
            >
              {t.navBuildings}
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setLocale(locale === 'fr' ? 'en' : 'fr')}
              className="gap-2 border border-white/20 bg-white/5 backdrop-blur-md text-white hover:bg-white/10 rounded-full px-4"
            >
              <Languages className="w-4 h-4" />
              {locale.toUpperCase()}
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="hero" className="relative min-h-screen flex items-center pt-20">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div 
              className="flex flex-col items-start text-left space-y-8"
              style={{
                transform: `translateY(${scrollY * 0.1}px)`,
                opacity: Math.max(0, 1 - scrollY / 500)
              }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-400/30 text-blue-400 text-xs font-bold tracking-widest uppercase backdrop-blur-md">
                <Cpu className="w-3 h-3" /> {t.tag}
              </div>
              
              {/* Bandeau Testnet */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-400/30 text-orange-400 text-xs font-bold">
                <ShieldCheck className="w-3 h-3" />
                Avalanche Fuji Testnet
              </div>
              
              <h1 className="text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.9]">
                {t.title} <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                  {t.subtitle}
                </span>
              </h1>

              <p className="text-xl text-slate-300 max-w-xl leading-relaxed">
                {t.desc}
              </p>

              <div className="flex gap-4 pt-4">
                <Button 
                  size="lg" 
                  onClick={onGetStarted}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold px-10 h-16 rounded-full shadow-2xl shadow-blue-500/30 transition-all hover:scale-105 hover:shadow-blue-500/50"
                >
                  {t.cta} <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Image Ville Isométrique avec Lampadaires Animés */}
            <div 
              ref={cityRef}
              className="relative"
              style={{
                transform: `translateY(${scrollY * -0.15}px) rotateX(${Math.min(scrollY * 0.02, 15)}deg)`,
                perspective: '1000px'
              }}
            >
              <div className="relative w-full h-[600px] flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400/20 to-transparent animate-shimmer" />
                
                <AnimatedCitySVG />

                <FloatingParticles />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Cards */}
      <section 
        id="stats" 
        className="relative py-32 px-6"
        style={{
          transform: `translateY(${(scrollY - 500) * -0.1}px)`
        }}
      >
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: t.stats[0], val: '$24.5M', icon: <Globe className="w-6 h-6" />, color: "from-blue-500 to-cyan-500" },
              { label: t.stats[1], val: '7.2%', icon: <TrendingUp className="w-6 h-6" />, color: "from-green-500 to-emerald-500" },
              { label: t.stats[2], val: '12', icon: <Building2 className="w-6 h-6" />, color: "from-purple-500 to-pink-500" },
              { label: t.stats[3], val: 'AVAX', icon: <Cpu className="w-6 h-6" />, color: "from-orange-500 to-red-500" },
            ].map((s, i) => (
              <div 
                key={i} 
                className="relative bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-2xl group hover:bg-white/10 transition-all cursor-default overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${s.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
                <div className="relative">
                  <div className="text-blue-400 mb-4 opacity-70 group-hover:opacity-100 transition-opacity">
                    {s.icon}
                  </div>
                  <div className="text-3xl font-bold mb-1">{s.val}</div>
                  <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section 
        id="how-it-works" 
        className="relative py-32 px-6"
        style={{
          transform: `translateY(${(scrollY - 1000) * -0.05}px)`
        }}
      >
        <div className="container mx-auto max-w-7xl">
          <h2 className="text-5xl font-black text-center mb-20 tracking-tight">
            {t.howItWorks}
          </h2>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              { icon: <Wallet className="w-12 h-12" />, title: t.step1Title, desc: t.step1Desc, num: "01" },
              { icon: <Building2 className="w-12 h-12" />, title: t.step2Title, desc: t.step2Desc, num: "02" },
              { icon: <LineChart className="w-12 h-12" />, title: t.step3Title, desc: t.step3Desc, num: "03" }
            ].map((step, i) => (
              <div key={i} className="relative group">
                <div className="absolute -top-6 -left-6 text-8xl font-black text-white/5 group-hover:text-white/10 transition-colors">
                  {step.num}
                </div>
                <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-all">
                  <div className="text-blue-400 mb-6">
                    {step.icon}
                  </div>
                  <h3 className="text-2xl font-bold mb-4">{step.title}</h3>
                  <p className="text-slate-400 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Buildings Section */}
      <section 
        id="buildings" 
        className="relative py-32 px-6"
        style={{
          transform: `translateY(${(scrollY - 1500) * -0.05}px)`
        }}
      >
        <div className="container mx-auto max-w-7xl">
          <h2 className="text-5xl font-black text-center mb-20 tracking-tight">
            {t.featuredBuildings}
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {buildings.map((building, i) => (
              <div 
                key={i}
                className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20"
              >
                <div className="h-64 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center p-8">
                  <img 
                    src={building.img} 
                    alt={building.name}
                    className="w-full h-full object-contain opacity-80 group-hover:opacity-100 transition-opacity group-hover:scale-110 transform transition-transform duration-500"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-3">{building.name}</h3>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm text-slate-400">Rendement</div>
                      <div className="text-2xl font-bold text-green-400">{building.yield}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-slate-400">Valeur</div>
                      <div className="text-2xl font-bold">{building.price}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section id="cta" className="relative py-32 px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-xl border border-white/10 rounded-3xl p-16">
            <h2 className="text-5xl font-black mb-6">
              {t.ctaTitle}
            </h2>
            <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
              {t.ctaDesc}
            </p>
            <Button 
              size="lg" 
              onClick={onGetStarted}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold px-12 h-16 rounded-full shadow-2xl shadow-blue-500/30 transition-all hover:scale-105"
            >
              {t.cta} <ArrowRight className="ml-2 w-6 h-6" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-slate-950 border-t border-white/10">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-950/20 to-purple-950/20 pointer-events-none" />
        
        <div className="relative container mx-auto px-6 py-16 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            {/* Logo et Description */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 relative flex items-center justify-center bg-blue-500/10 rounded-lg border border-blue-400/30">
                  <img 
                    src={LOGO_PATH}
                    alt="EcoRWA Logo" 
                    className="w-6 h-6 object-contain brightness-0 invert" 
                  />
                </div>
                <div className="text-2xl font-black tracking-tighter">
                  Eco<span className="text-blue-400">RWA</span>
                </div>
              </div>
              <p className="text-slate-400 leading-relaxed mb-6 max-w-md">
                {locale === 'fr' 
                  ? "Plateforme de tokenisation immobilière sur Avalanche Fuji Testnet"
                  : "Real Estate Tokenization Platform on Avalanche Fuji Testnet"}
              </p>
              
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-400/30 text-orange-400 text-xs font-bold">
                <ShieldCheck className="w-3 h-3" />
                {locale === 'fr' ? 'Testnet Uniquement' : 'Testnet Only'}
              </div>
            </div>

            {/* Projet */}
            <div>
              <h3 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">
                {locale === 'fr' ? 'Projet' : 'Project'}
              </h3>
              <ul className="space-y-3">
                <li>
                  <a
                    href="https://github.com/OrionUnix/EcoRWA-Tycoon"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-slate-400 hover:text-blue-400 transition-colors group"
                  >
                    <Globe className="w-5 h-5" />
                    <span className="group-hover:translate-x-1 transition-transform">
                      {locale === 'fr' ? 'Code Source' : 'Source Code'}
                    </span>
                  </a>
                </li>
                <li>
                  <a
                    href="https://build.avax.network/build-games"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-slate-400 hover:text-blue-400 transition-colors group"
                  >
                    <ArrowRight className="w-5 h-5" />
                    <span className="group-hover:translate-x-1 transition-transform">
                      {locale === 'fr' ? 'Hackathon Avalanche' : 'Avalanche Hackathon'}
                    </span>
                  </a>
                </li>
              </ul>
            </div>

            {/* Réseaux Sociaux */}
            <div>
              <h3 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">
                {locale === 'fr' ? 'Réseaux Sociaux' : 'Social Media'}
              </h3>
              <ul className="space-y-3">
                <li>
                  <a
                    href="https://x.com/OrionDeimos"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-slate-400 hover:text-blue-400 transition-colors group"
                  >
                    <Languages className="w-5 h-5" />
                    <span className="group-hover:translate-x-1 transition-transform">
                      X (Twitter)
                    </span>
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/OrionUnix"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-slate-400 hover:text-blue-400 transition-colors group"
                  >
                    <Globe className="w-5 h-5" />
                    <span className="group-hover:translate-x-1 transition-transform">
                      GitHub
                    </span>
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Informations légales */}
          <div className="pt-8 border-t border-white/10">
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-400" />
                  {locale === 'fr' ? 'Testnet Uniquement' : 'Testnet Only'}
                </h4>
                <p className="text-slate-400 text-sm">
                  {locale === 'fr'
                    ? "Ce projet est déployé sur Avalanche Fuji Testnet à des fins de démonstration"
                    : "This project is deployed on Avalanche Fuji Testnet for demonstration purposes"}
                </p>
              </div>
              
              <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-purple-400" />
                  {locale === 'fr' ? 'Hackathon Avalanche' : 'Avalanche Hackathon'}
                </h4>
                <p className="text-slate-400 text-sm">
                  {locale === 'fr'
                    ? "Projet développé pour le Build Games Hackathon d'Avalanche"
                    : "Project developed for Avalanche Build Games Hackathon"}
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
              <div className="text-slate-400">
                © 2025 EcoRWA. {locale === 'fr' ? 'Tous droits réservés' : 'All rights reserved'}
              </div>
              
              <div className="flex items-center gap-6">
                <span className="text-slate-400">
                  {locale === 'fr' ? 'Licence Gratuite' : 'Free License'}
                </span>
                <span className="text-slate-600">•</span>
                <a 
                  href="#terms" 
                  className="text-slate-400 hover:text-blue-400 transition-colors"
                >
                  {locale === 'fr' ? "Conditions d'utilisation" : 'Terms of Use'}
                </a>
                <span className="text-slate-600">•</span>
                <div className="text-slate-400">
                  {locale === 'fr' ? 'Fait avec' : 'Made with'} <span className="text-red-400">❤️</span> {locale === 'fr' ? 'par OrionUnix' : 'by OrionUnix'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotateY(0deg); }
          50% { transform: translateY(-20px) rotateY(5deg); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes particle {
          0%, 100% { transform: translateY(0px) scale(1); opacity: 0.3; }
          50% { transform: translateY(-30px) scale(1.5); opacity: 0.6; }
        }
        .animate-shimmer {
          animation: shimmer 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}