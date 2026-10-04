import React, { useState } from 'react';
import { Calculator, ArrowRight, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import { ServicePlan } from '../../types';

interface InvestmentCalculatorProps {
  plans: ServicePlan[];
  onSelectPlan: (planId: string) => void;
}

export const InvestmentCalculator: React.FC<InvestmentCalculatorProps> = ({
  plans,
  onSelectPlan,
}) => {
  const [selectedPlanId, setSelectedPlanId] = useState<string>(plans[0]?.id || 'plan-01');

  const selectedPlan = plans.find((p) => p.id === selectedPlanId) || plans[0];

  return (
    <section className="py-16 sm:py-24 bg-[#090d16] border-t border-[#cba352]/20 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-[#cba352]/10 via-[#7c3aed]/10 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#cba352]/15 border border-[#cba352]/30 text-[#f8e7a1] text-xs font-semibold uppercase tracking-wider mb-3">
            <Calculator className="w-3.5 h-3.5 text-[#cba352]" />
            <span>Interactive Profit Estimator</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Investment Returns Calculator
          </h2>
          <p className="mt-3 text-base text-slate-300">
            Easily estimate your potential investment growth over time with our Investment Returns Calculator
          </p>
        </div>

        {/* Calculator Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch max-w-5xl mx-auto">
          {/* Form Column */}
          <div className="lg:col-span-6 bg-[#0e1424]/90 backdrop-blur-md border border-[#cba352]/25 rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-xl">
            <div className="space-y-6">
              <div>
                <label htmlFor="calculator-plan" className="block text-sm font-semibold text-slate-200 mb-2">
                  Choose Plan
                </label>
                <select
                  id="calculator-plan"
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="w-full bg-[#080c14] border border-[#cba352]/40 rounded-xl px-4 py-3.5 text-white font-medium focus:outline-none focus:ring-2 focus:ring-[#cba352] text-sm cursor-pointer"
                >
                  {plans.map((p, idx) => (
                    <option key={p.id} value={p.id} className="bg-[#0e1424] text-white">
                      {p.name} — {p.price} ({p.dailyProfit}/day · {p.duration})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-2">
                  Investment Amount
                </label>
                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    value={selectedPlan?.price || ''}
                    className="w-full bg-[#080c14] border border-slate-700 rounded-xl px-4 py-3.5 text-white font-mono font-bold text-lg focus:outline-none cursor-default"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold px-2 py-1 rounded bg-[#cba352]/20 text-[#f8e7a1]">
                    Fixed Tier
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#080c14]/70 border border-slate-800 space-y-2 text-xs text-slate-300">
                <div className="flex items-center gap-2 text-slate-200 font-semibold">
                  <ShieldCheck className="w-4 h-4 text-[#cba352]" />
                  <span>Guaranteed Schedule Breakdown</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Daily returns are credited every 24 hours directly into your TrustZone wallet balance and are available for fast withdrawal at any time upon administrator processing.
                </p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Return Rate: <strong className="text-[#cba352]">20% Daily</strong></span>
              <span>Duration: <strong className="text-slate-200">90 Days</strong></span>
            </div>
          </div>

          {/* Results Column */}
          <div className="lg:col-span-6 bg-gradient-to-br from-[#121a2e] to-[#0a0f1d] border-2 border-[#cba352]/50 rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#cba352]/15 rounded-full blur-2xl pointer-events-none" />

            <div>
              <div className="flex items-center justify-between pb-5 border-b border-slate-800">
                <div>
                  <span className="text-xs font-bold text-[#cba352] uppercase tracking-wider">Calculation Result</span>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-white mt-0.5">
                    {selectedPlan?.name}
                  </h3>
                </div>
                <div className="p-2.5 rounded-xl bg-[#cba352]/20 text-[#f8e7a1] border border-[#cba352]/40">
                  <Sparkles className="w-5 h-5 text-[#cba352]" />
                </div>
              </div>

              {/* Metrics Table */}
              <div className="py-6 space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-slate-800/80">
                  <span className="text-sm text-slate-400">Payment Interval</span>
                  <span className="text-sm font-semibold text-white">Every 24 Hours (Daily)</span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-slate-800/80">
                  <span className="text-sm text-slate-400">Daily Return</span>
                  <span className="text-base font-mono font-bold text-[#f8e7a1]">
                    {selectedPlan?.dailyProfit}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-slate-800/80">
                  <span className="text-sm text-slate-400">Total Return (90 Days)</span>
                  <span className="text-xl font-mono font-extrabold text-[#cba352]">
                    {selectedPlan?.totalProfit}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-slate-800/80">
                  <span className="text-sm text-slate-400">Capital Back</span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-1 rounded border border-emerald-800/60">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Included in Returns
                  </span>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-sm text-slate-400">Referral Commission</span>
                  <span className="text-xs font-mono font-semibold text-[#f8e7a1]">
                    L1 13% · L2 2%
                  </span>
                </div>
              </div>
            </div>

            {/* Action */}
            <div className="pt-4">
              <button
                type="button"
                onClick={() => onSelectPlan(selectedPlan.id)}
                className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-bold text-sm text-[#0b0f19] bg-gradient-to-r from-[#f8e7a1] via-[#cba352] to-[#b88d37] hover:brightness-110 shadow-lg shadow-amber-500/25 transition-all cursor-pointer"
              >
                <span>Invest in {selectedPlan?.name} Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
