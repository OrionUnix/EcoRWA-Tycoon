// Composant à ajouter dans votre dashboard existant
// frontend/components/DashboardChoiceCard.tsx

'use client';
import React, { useState } from 'react';
import { Building2, TrendingUp, MapPin, Sparkles, ArrowRight } from 'lucide-react';

interface DashboardChoiceCardProps {
  onCreateCity: () => void;
  onViewProperties: () => void;
  onViewCity: () => void;
  hasCity: boolean;
  hasProperties: boolean;
}

export default function DashboardChoiceCard({
  onCreateCity,
  onViewProperties,
  onViewCity,
  hasCity,
  hasProperties
}: DashboardChoiceCardProps) {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent mb-2">
          Bienvenue dans EcoRWA Tycoon
        </h1>
        <p className="text-gray-300 text-lg">
          Choisissez votre stratégie d'investissement
        </p>
      </div>

      {/* Choice Cards */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Créer une Ville */}
        <div
          onMouseEnter={() => setHoveredCard('city')}
          onMouseLeave={() => setHoveredCard(null)}
          className={`relative bg-gradient-to-br from-green-900/40 to-emerald-900/40 backdrop-blur-lg rounded-3xl p-8 border-2 transition-all duration-300 ${
            hoveredCard === 'city' 
              ? 'border-green-400 shadow-2xl shadow-green-500/50 scale-105' 
              : 'border-green-900/50 hover:border-green-700'
          }`}
        >
          {!hasCity && (
            <div className="absolute top-4 right-4">
              <span className="bg-yellow-500 text-black text-xs font-bold px-3 py-1 rounded-full">
                NOUVEAU
              </span>
            </div>
          )}

          <div className="flex items-center gap-4 mb-6">
            <div className="bg-gradient-to-br from-green-400 to-emerald-500 p-4 rounded-2xl">
              <Building2 className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                {hasCity ? 'Ma Ville' : 'Créer une Ville'}
              </h2>
              <p className="text-green-300 text-sm">Mode SimCity</p>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-yellow-400 mt-1 flex-shrink-0" />
              <div>
                <div className="text-white font-semibold">Génération procédurale</div>
                <div className="text-gray-300 text-sm">
                  Chaque ville est unique avec des ressources aléatoires
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
              <div>
                <div className="text-white font-semibold">Ressources à extraire</div>
                <div className="text-gray-300 text-sm">
                  Or, Diamant, Pétrole, Eau, Argent, Charbon
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-purple-400 mt-1 flex-shrink-0" />
              <div>
                <div className="text-white font-semibold">Marketplace intégré</div>
                <div className="text-gray-300 text-sm">
                  Vendez vos ressources à d'autres joueurs
                </div>
              </div>
            </div>
          </div>

          {!hasCity ? (
            <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-4 mb-6">
              <div className="text-green-300 text-sm mb-2">Coût de création</div>
              <div className="text-2xl font-bold text-white">0.1 AVAX</div>
              <div className="text-green-400 text-sm mt-1">+ 1000 $ECOR offerts</div>
            </div>
          ) : (
            <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-4 mb-6">
              <div className="text-green-300 text-sm mb-2">Votre ville</div>
              <div className="text-white font-semibold">Actif • En production</div>
            </div>
          )}

          <button
            onClick={hasCity ? onViewCity : onCreateCity}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2 group"
          >
            {hasCity ? 'Gérer ma Ville' : 'Créer ma Ville'}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Acheter Parts RWA */}
        <div
          onMouseEnter={() => setHoveredCard('rwa')}
          onMouseLeave={() => setHoveredCard(null)}
          className={`relative bg-gradient-to-br from-blue-900/40 to-purple-900/40 backdrop-blur-lg rounded-3xl p-8 border-2 transition-all duration-300 ${
            hoveredCard === 'rwa' 
              ? 'border-blue-400 shadow-2xl shadow-blue-500/50 scale-105' 
              : 'border-blue-900/50 hover:border-blue-700'
          }`}
        >
          {hasProperties && (
            <div className="absolute top-4 right-4">
              <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                ACTIF
              </span>
            </div>
          )}

          <div className="flex items-center gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-400 to-purple-500 p-4 rounded-2xl">
              <TrendingUp className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                {hasProperties ? 'Mes Propriétés' : 'Investir RWA'}
              </h2>
              <p className="text-blue-300 text-sm">Real World Assets</p>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 bg-yellow-400 rounded-full mt-1 flex-shrink-0" />
              <div>
                <div className="text-white font-semibold">Biens immobiliers tokenisés</div>
                <div className="text-gray-300 text-sm">
                  Investissez dans des parts de propriétés réelles
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-5 h-5 bg-green-400 rounded-full mt-1 flex-shrink-0" />
              <div>
                <div className="text-white font-semibold">Revenus passifs</div>
                <div className="text-gray-300 text-sm">
                  Recevez des loyers en MockUSDC
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-5 h-5 bg-purple-400 rounded-full mt-1 flex-shrink-0" />
              <div>
                <div className="text-white font-semibold">Analyse IA</div>
                <div className="text-gray-300 text-sm">
                  Conseils basés sur les données PLU
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-4 mb-6">
            <div className="text-blue-300 text-sm mb-2">Investissement minimum</div>
            <div className="text-2xl font-bold text-white">50 MockUSDC</div>
            <div className="text-blue-400 text-sm mt-1">~10 parts disponibles</div>
          </div>

          <button
            onClick={onViewProperties}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2 group"
          >
            {hasProperties ? 'Gérer mon Portfolio' : 'Explorer les Propriétés'}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Info Box - Les deux ne sont pas incompatibles */}
      <div className="bg-gradient-to-r from-purple-900/40 to-pink-900/40 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/30">
        <div className="flex items-start gap-4">
          <div className="bg-purple-500/20 p-3 rounded-xl">
            <Sparkles className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg mb-2">
              💡 Conseil Pro
            </h3>
            <p className="text-gray-300 mb-3">
              Les deux stratégies sont <span className="text-purple-400 font-semibold">totalement compatibles</span> ! 
              Vous pouvez créer votre ville ET investir dans des parts RWA.
            </p>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                Ville → Extrayez des ressources → Vendez sur le Marketplace
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                Marketplace → Échangez $ECOR contre MockUSDC
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
                MockUSDC → Achetez des parts RWA tokenisées
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Stats rapides si l'utilisateur a déjà des actifs */}
      {(hasCity || hasProperties) && (
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
            <div className="text-gray-400 text-sm mb-1">Valeur Ville</div>
            <div className="text-2xl font-bold text-green-400">
              {hasCity ? '2,345 $ECOR' : '—'}
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
            <div className="text-gray-400 text-sm mb-1">Parts RWA</div>
            <div className="text-2xl font-bold text-blue-400">
              {hasProperties ? '850 MockUSDC' : '—'}
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
            <div className="text-gray-400 text-sm mb-1">Total Portfolio</div>
            <div className="text-2xl font-bold text-purple-400">
              {(hasCity || hasProperties) ? '3,195 USD' : '—'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}