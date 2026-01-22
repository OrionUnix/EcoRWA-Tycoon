'use client';
import { useState } from 'react';
import Image from 'next/image';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Coins, Droplets, Loader2, LayoutDashboard, Building2, Map, TrendingUp, Menu, X } from 'lucide-react';
import logo from './logo.svg';

interface NavbarProps {
  address?: string;
  usdcBalance: string;
  isFaucetLoading: boolean;
  onClaimUSDC: () => void;
  currentView: 'city' | 'dashboard' | 'properties' | 'analytics';
  onNavigate: (view: 'city' | 'dashboard' | 'properties' | 'analytics') => void;
  t: (key: string) => string;
}

export default function Navbar({ 
  address, 
  usdcBalance, 
  isFaucetLoading, 
  onClaimUSDC, 
  currentView,
  onNavigate,
  t 
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'city' as const, label: 'City View', icon: Map },
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'properties' as const, label: 'Properties', icon: Building2 },
    { id: 'analytics' as const, label: 'Analytics', icon: TrendingUp },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Glassmorphism background */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-slate-800/70 to-slate-900/80 backdrop-blur-xl border-b border-white/10" />
      
      <div className="relative container mx-auto px-4 py-2">
        <div className="flex justify-between items-center">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 group">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-lg blur opacity-50 group-hover:opacity-75 transition-opacity" />
              <div className="relative w-10 h-10 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Image 
                  src={logo} 
                  alt="EcoRWA Logo" 
                  width={24}
                  height={24}
                  className="brightness-0 invert"
                />
              </div>
            </div>
            <div className="hidden md:block">
              <h1 className="text-lg font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
                EcoRWA
              </h1>
              <p className="text-[10px] text-slate-400">Gamifying Real Estate</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`
                    relative px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-300
                    ${isActive 
                      ? 'text-white' 
                      : 'text-slate-400 hover:text-white'
                    }
                  `}
                >
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-lg border border-emerald-500/30 backdrop-blur-sm" />
                  )}
                  <div className="relative flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                </button>
              );
            })}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            {/* USDC Balance */}
            {address && (
              <div className="hidden md:block relative group">
                <Card className="relative px-3 py-1.5 bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-md">
                      <Coins className="h-3 w-3 text-white" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400">Balance</p>
                      <p className="text-sm font-bold text-white">{usdcBalance} USDC</p>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Faucet Button */}
            {address && (
              <Button 
                onClick={onClaimUSDC} 
                disabled={isFaucetLoading}
                size="sm"
                className="hidden md:flex relative overflow-hidden bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 border-0 shadow-lg shadow-blue-500/25 transition-all duration-300"
              >
                {isFaucetLoading ? (
                  <Loader2 className="animate-spin h-3 w-3" />
                ) : (
                  <>
                    <Droplets className="mr-1.5 h-3 w-3" />
                    Faucet
                  </>
                )}
              </Button>
            )}

            {/* Language Switcher */}
            <div className="hidden md:block">
              <LanguageSwitcher />
            </div>

            {/* Connect Button */}
            <div className="relative">
              <ConnectButton />
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-3 pb-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300
                    ${isActive 
                      ? 'bg-gradient-to-r from-emerald-500/20 to-blue-500/20 border border-emerald-500/30 text-white' 
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
            
            {address && (
              <>
                <div className="pt-3 border-t border-white/10">
                  <div className="px-3 py-2 bg-slate-800/50 rounded-lg">
                    <p className="text-xs text-slate-400 mb-1">USDC Balance</p>
                    <p className="text-lg font-bold text-white">{usdcBalance}</p>
                  </div>
                </div>
                <Button 
                  onClick={onClaimUSDC} 
                  disabled={isFaucetLoading}
                  size="sm"
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700"
                >
                  {isFaucetLoading ? (
                    <Loader2 className="animate-spin h-4 w-4" />
                  ) : (
                    <>
                      <Droplets className="mr-2 h-4 w-4" />
                      Claim Faucet
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}