import React, { useState } from 'react';
import { Check, ChevronRight, Copy, CheckCircle2, Zap } from 'lucide-react';
import { PageRoute, ServicePlan, SiteSettings } from '../../types';

interface PlansSectionProps {
  plans: ServicePlan[];
  settings: SiteSettings;
  onSelectPlan: (planId: string) => void;
  onNavigate: (page: PageRoute) => void;
}

export const PlansSection: React.FC<PlansSectionProps> = ({
  plans,
  settings,
  onSelectPlan,
  onNavigate,
}) => {
  const [copiedEasypaisa, setCopiedEasypaisa] = useState(false);

  const handleCopyEasypaisa = async () => {
    try {
      await navigator.clipboard.writeText(settings.easypaisaNumber);
      setCopiedEasypaisa(true);
      setTimeout(() => setCopiedEasypaisa(false), 2500);
    } catch {
      const el = document.createElement('textarea');
      el.value = settings.easypaisaNumber;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopiedEasypaisa(true);
      setTimeout(() => setCopiedEasypaisa(false), 2500);
    }
  };

  return (
    <section className="py-16 sm:py-24 bg-[#080c14] border-t border-[#cba352]/20 relative overflow-hidden" id="plans">
      {/* Subtle stage lighting */}
      <div className="absolute top-10 left-1/3 w-96 h-96 bg-[#cba352]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#7c3aed]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#cba352]/15 border border-[#cba352]/30 text-[#f8e7a1] text-xs font-semibold uppercase tracking-wider mb-3">
            <Zap className="w-3.5 h-3.5 text-[#cba352] fill-[#cba352]" />
            <span>Guaranteed Daily Profit Tiers</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Investment Plan
          </h2>
          <p className="mt-3 text-base sm:text-lg text-slate-300">
            We offer best high yield investment plan for your more profit!
          </p>
        </div>

        {/* 12 Plans Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {plans.map((plan, index) => {
            const dailyReturn = plan.dailyProfit || '—';
            const totalReturn = plan.totalProfit || '—';
            const duration = plan.duration || '90 Day';

            return (
              <article
                key={plan.id}
                className="np-plan-card flex flex-col justify-between overflow-hidden group"
              >
                <div>
                  {/* Top Tab Pill */}
                  <div className="flex items-center justify-between">
                    <span className="np-plan-tab-top">
                      Plan {String(index + 1).padStart(2, '0')}
                    </span>
                    {plan.isPopular && (
                      <span className="mr-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-[#f8e7a1] border border-amber-500/40">
                        Popular
                      </span>
                    )}
                  </div>

                  {/* Price Body */}
                  <div className="p-6 pt-5">
                    <div className="pb-5 border-b border-slate-800">
                      <div className="font-mono text-3xl font-extrabold text-white tracking-tight">
                        {plan.price}
                      </div>
                      <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mt-1">
                        Investment
                      </div>
                    </div>

                    {/* Features list */}
                    <ul className="mt-5 space-y-3.5 text-xs">
                      <li className="flex items-start gap-2.5 text-slate-200">
                        <CheckCircle2 className="w-4 h-4 text-[#cba352] shrink-0 mt-0.5" />
                        <span>Daily Return: <strong className="text-white font-mono">{dailyReturn}</strong></span>
                      </li>
                      <li className="flex items-start gap-2.5 text-slate-200">
                        <CheckCircle2 className="w-4 h-4 text-[#cba352] shrink-0 mt-0.5" />
                        <span>Total Return: <strong className="text-[#f8e7a1] font-mono">{totalReturn}</strong></span>
                      </li>
                      <li className="flex items-start gap-2.5 text-slate-200">
                        <CheckCircle2 className="w-4 h-4 text-[#cba352] shrink-0 mt-0.5" />
                        <span>Duration: <strong className="text-white">{duration}</strong></span>
                      </li>
                      <li className="flex items-start gap-2.5 text-slate-200">
                        <CheckCircle2 className="w-4 h-4 text-[#cba352] shrink-0 mt-0.5" />
                        <span>Refer Commission: <strong className="text-emerald-400 font-mono">L1 13% · L2 2%</strong></span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Card Action */}
                <div className="p-6 pt-2">
                  <button
                    type="button"
                    onClick={() => onSelectPlan(plan.id)}
                    className="w-full btn-gold py-3 px-4 flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider cursor-pointer"
                  >
                    <span>Invest Now</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        {/* Payment Channels & Easypaisa Verification Card */}
        <div className="mt-14 max-w-4xl mx-auto bg-gradient-to-br from-[#0e1628] to-[#090e1a] border border-[#cba352]/30 rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <div className="text-xs font-bold text-[#cba352] uppercase tracking-wider">
                Official Easypaisa Payment Gateway
              </div>
              <h3 className="text-xl font-extrabold text-white mt-1">
                Direct Plan Activation &amp; Manual Administrator Verification
              </h3>
              <p className="mt-1 text-xs text-slate-300 max-w-xl">
                Send your investment tier amount via Easypaisa, then submit your transaction TID in the portal. Upon administrator verification, your funds appear instantly in your dashboard and start generating daily profits!
              </p>
            </div>

            <div className="shrink-0 flex flex-col items-start sm:items-end gap-2">
              <div className="text-[11px] text-slate-400 font-medium">Easypaisa Account Number</div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xl font-bold text-[#f8e7a1] bg-[#080c14] px-3.5 py-1.5 rounded-lg border border-slate-700">
                  {settings.easypaisaNumber}
                </span>
                <button
                  type="button"
                  onClick={handleCopyEasypaisa}
                  className="p-2.5 rounded-lg bg-[#cba352] hover:bg-[#dfb867] text-[#0b0f19] font-bold text-xs transition-colors cursor-pointer"
                  title="Copy Easypaisa Number"
                >
                  {copiedEasypaisa ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="text-slate-400">
              Need assistance? Direct support on Telegram: <strong className="text-white">{settings.telegramHandle}</strong>
            </span>
            <button
              type="button"
              onClick={() => onNavigate('dashboard')}
              className="text-[#cba352] hover:text-[#f8e7a1] font-semibold underline cursor-pointer"
            >
              Go to Client Portal to Submit Payment &rarr;
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
