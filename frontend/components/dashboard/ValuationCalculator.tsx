'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useSelectedBuilding } from '@/hooks/useSelectedBuilding';
import { formatUnits } from 'viem';

export default function ValuationCalculator() {
    const selectedBuilding = useSelectedBuilding((state) => state.selectedBuilding);

    const [downPayment, setDownPayment] = React.useState(50); // Percentage
    const [term, setTerm] = React.useState(15); // Years
    const [interestRate, setInterestRate] = React.useState(5); // %

    // Calculs basés sur le bâtiment sélectionné
    const calculations = React.useMemo(() => {
        if (!selectedBuilding) {
            return {
                price: 0,
                downPaymentAmount: 0,
                loanAmount: 0,
                monthlyPayment: 0,
                estimatedYieldPerMonth: 0,
                maintenanceCost: 0,
                netCashFlow: 0
            };
        }

        const price = selectedBuilding.economics.price / 1e6; // USDC
        const downPaymentAmount = (price * downPayment) / 100;
        const loanAmount = price - downPaymentAmount;

        // Mensualité du prêt (formule standard)
        const monthlyRate = interestRate / 100 / 12;
        const numPayments = term * 12;
        const monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
            (Math.pow(1 + monthlyRate, numPayments) - 1);

        // Yield mensuel estimé (APY / 12)
        const annualYield = (price * selectedBuilding.economics.yieldPercentage) / 10000;
        const estimatedYieldPerMonth = annualYield / 12;

        // Maintenance mensuelle
        const maintenanceCost = selectedBuilding.economics.maintenanceCost / 1e6; // USDC per month

        // Cash flow net
        const netCashFlow = estimatedYieldPerMonth - monthlyPayment - maintenanceCost;

        return {
            price,
            downPaymentAmount,
            loanAmount,
            monthlyPayment,
            estimatedYieldPerMonth,
            maintenanceCost,
            netCashFlow
        };
    }, [selectedBuilding, downPayment, term, interestRate]);

    return (
        <motion.div
            whileHover={{ scale: 1.01 }}
            className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-[0_8px_32px_rgba(139,92,246,0.3)]"
        >
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h3 className="text-white/90 text-lg font-semibold uppercase tracking-wider">
                        Valuation Calculator
                    </h3>
                </div>

                {selectedBuilding && (
                    <div className="bg-emerald-500/20 border border-emerald-400/50 rounded-lg px-3 py-1">
                        <p className="text-emerald-400 text-xs font-mono">
                            {selectedBuilding.name.en}
                        </p>
                    </div>
                )}
            </div>

            {!selectedBuilding ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <svg className="w-16 h-16 text-white/20 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <p className="text-white/50 text-sm font-mono">Click on a building in the 3D scene</p>
                    <p className="text-white/30 text-xs font-mono mt-1">to view valuation details</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left: Inputs */}
                    <div className="space-y-4">
                        <div>
                            <label className="flex items-center justify-between text-cyan-400/70 text-xs mb-2 uppercase font-mono">
                                <span>Term</span>
                                <span className="text-white font-bold">{term} years</span>
                            </label>
                            <input
                                type="range"
                                min="5"
                                max="30"
                                step="5"
                                value={term}
                                onChange={(e) => setTerm(Number(e.target.value))}
                                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
                            />
                        </div>

                        <div>
                            <label className="flex items-center justify-between text-cyan-400/70 text-xs mb-2 uppercase font-mono">
                                <span>Mortgage Type</span>
                                <span className="text-white font-bold">Fixed</span>
                            </label>
                            <select className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white text-sm">
                                <option>Fixed</option>
                                <option>Variable</option>
                            </select>
                        </div>

                        <div>
                            <label className="flex items-center justify-between text-cyan-400/70 text-xs mb-2 uppercase font-mono">
                                <span>Interest Rate</span>
                                <span className="text-white font-bold">{interestRate}%</span>
                            </label>
                            <input
                                type="range"
                                min="1"
                                max="10"
                                step="0.5"
                                value={interestRate}
                                onChange={(e) => setInterestRate(Number(e.target.value))}
                                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
                            />
                        </div>

                        <div>
                            <label className="flex items-center justify-between text-cyan-400/70 text-xs mb-2 uppercase font-mono">
                                <span>Down Payment</span>
                                <span className="text-white font-bold">{downPayment}%</span>
                            </label>
                            <input
                                type="range"
                                min="10"
                                max="100"
                                step="5"
                                value={downPayment}
                                onChange={(e) => setDownPayment(Number(e.target.value))}
                                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
                            />
                            <div className="mt-2 text-right">
                                <span className="text-white text-lg font-bold">
                                    ${calculations.downPaymentAmount.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Results */}
                    <div className="space-y-4">
                        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                            <p className="text-cyan-400/70 text-xs mb-1 uppercase font-mono">Estimated pr. month</p>
                            <p className="text-emerald-400 text-3xl font-bold">
                                ${calculations.estimatedYieldPerMonth.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </p>
                            <p className="text-white/50 text-xs mt-1">Yield Income</p>
                        </div>

                        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                            <p className="text-cyan-400/70 text-xs mb-1 uppercase font-mono">Monthly Payment</p>
                            <p className="text-white text-2xl font-bold">
                                ${calculations.monthlyPayment.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </p>
                            <p className="text-white/50 text-xs mt-1">Loan + Maintenance</p>
                        </div>

                        <div className={`rounded-lg p-4 border ${calculations.netCashFlow >= 0 ? 'bg-emerald-500/10 border-emerald-400/50' : 'bg-red-500/10 border-red-400/50'}`}>
                            <p className="text-cyan-400/70 text-xs mb-1 uppercase font-mono">Net Cash Flow</p>
                            <p className={`text-3xl font-bold ${calculations.netCashFlow >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {calculations.netCashFlow >= 0 ? '+' : ''}${calculations.netCashFlow.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </p>
                            <p className="text-white/50 text-xs mt-1">Per Month</p>
                        </div>

                        {/* CTA Buttons */}
                        <div className="grid grid-cols-2 gap-2 mt-4">
                            <button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 text-sm">
                                Request Tour
                            </button>
                            <button className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 text-sm">
                                Contact Agent
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer Info */}
            {selectedBuilding && (
                <div className="mt-6 pt-4 border-t border-white/10 text-xs text-white/50 font-mono">
                    <p>🏠 Price: ${calculations.price.toLocaleString()} USDC | 📈 APY: {selectedBuilding.economics.yieldPercentage / 100}% | 🔧 Maintenance: ${calculations.maintenanceCost.toLocaleString()}/mo</p>
                </div>
            )}
        </motion.div>
    );
}
