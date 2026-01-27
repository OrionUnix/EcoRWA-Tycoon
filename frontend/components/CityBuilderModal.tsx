// frontend/components/CityBuilderModal.tsx

'use client';
import React, { useState } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { Building2, Coins, Sparkles, X, AlertCircle, Wallet } from 'lucide-react';
// import { useTranslation } from '@/lib/i18n/LanguageContext';

// Mock hook since LanguageContext is missing
const useTranslation = () => ({
  t: {
    cityBuilderModal: {
      title: "Nouvelle Ville",
      subtitle: "Construisez votre empire",
      description: "Créez votre propre ville RWA.",
      reward: "Récompense",
      rewardAmount: "ECOR",
      cost: "Coût",
      walletRequired: "Connexion requise",
      insufficientFunds: "Fonds insuffisants",
      cancelButton: "Annuler",
      createButton: "Créer",
    },
    nav: { connectWallet: "Connecter Wallet" },
    cityBuilder: { wallet: { avax: "AVAX" } },
    common: { success: "Succès", loading: "Chargement" }
  }
});
import { useRouter } from 'next/navigation';

interface CityBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CITY_CREATION_COST_AVAX = 0.1;
const INITIAL_ECOR_REWARD = 1000;

export default function CityBuilderModal({ isOpen, onClose }: CityBuilderModalProps) {
  const { t } = useTranslation();
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);

  const { data: balance } = useBalance({
    address,
  });

  const hasEnoughBalance = balance ? parseFloat(balance.formatted) >= CITY_CREATION_COST_AVAX : false;

  if (!isOpen) return null;

  const handleCreateCity = async () => {
    if (!isConnected) {
      alert(t.cityBuilderModal.walletRequired);
      return;
    }

    if (!hasEnoughBalance) {
      alert(t.cityBuilderModal.insufficientFunds);
      return;
    }

    setIsCreating(true);

    try {
      // Simuler la transaction (à remplacer par l'appel au smart contract)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Rediriger vers le City Builder
      router.push('/city-builder');
      onClose();
    } catch (error) {
      console.error('Error creating city:', error);
      alert('Error creating city');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-gradient-to-br from-purple-900 via-blue-900 to-teal-900 rounded-3xl max-w-2xl w-full border border-white/20 shadow-2xl overflow-hidden animate-scaleIn">
        {/* Header */}
        <div className="relative p-8 pb-6 bg-gradient-to-r from-purple-600/30 to-blue-600/30">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-4 mb-4">
            <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-4 rounded-2xl shadow-lg">
              <Building2 className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white">{t.cityBuilderModal.title}</h2>
              <p className="text-blue-200">{t.cityBuilderModal.subtitle}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          {/* Description */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <p className="text-gray-200 leading-relaxed">
              {t.cityBuilderModal.description}
            </p>
          </div>

          {/* Reward Info */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-2xl p-6 border border-yellow-500/30">
              <div className="flex items-center gap-3 mb-2">
                <Sparkles className="w-6 h-6 text-yellow-400" />
                <h3 className="font-bold text-white">{t.cityBuilderModal.reward}</h3>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-yellow-400">{INITIAL_ECOR_REWARD}</span>
                <span className="text-gray-300">{t.cityBuilderModal.rewardAmount}</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl p-6 border border-blue-500/30">
              <div className="flex items-center gap-3 mb-2">
                <Coins className="w-6 h-6 text-blue-400" />
                <h3 className="font-bold text-white">{t.cityBuilderModal.cost}</h3>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-blue-400">{CITY_CREATION_COST_AVAX}</span>
                <span className="text-gray-300">AVAX</span>
              </div>
            </div>
          </div>

          {/* Wallet Status */}
          {!isConnected ? (
            <div className="bg-orange-500/20 border border-orange-500/30 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-orange-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-orange-300 mb-1">
                  {t.cityBuilderModal.walletRequired}
                </div>
                <div className="text-sm text-gray-300">
                  {t.nav.connectWallet}
                </div>
              </div>
            </div>
          ) : !hasEnoughBalance ? (
            <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-red-300 mb-1">
                  {t.cityBuilderModal.insufficientFunds}
                </div>
                <div className="text-sm text-gray-300">
                  {t.cityBuilder.wallet.avax}: {balance?.formatted || '0'} AVAX
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-4 flex items-start gap-3">
              <Wallet className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-green-300 mb-1">
                  {t.cityBuilder.wallet.avax}: {parseFloat(balance?.formatted || '0').toFixed(4)} AVAX
                </div>
                <div className="text-sm text-gray-300">
                  ✅ {t.common.success}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-4 px-6 rounded-xl transition-all border border-white/20"
            >
              {t.cityBuilderModal.cancelButton}
            </button>
            <button
              onClick={handleCreateCity}
              disabled={!isConnected || !hasEnoughBalance || isCreating}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed shadow-xl flex items-center justify-center gap-2"
            >
              {isCreating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t.common.loading}
                </>
              ) : (
                <>
                  <Building2 className="w-5 h-5" />
                  {t.cityBuilderModal.createButton}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}