import React, { useState } from 'react';
import { Check, Copy, ExternalLink, Zap } from 'lucide-react';
import { PageRoute, ServicePlan, SiteSettings } from '../../types';
import { PlansSection } from '../sections/PlansSection';
import { InvestmentCalculator } from '../sections/InvestmentCalculator';
import { ReferralSection } from '../sections/ReferralSection';

interface PlansPageProps {
  settings: SiteSettings;
  plans: ServicePlan[];
  onSelectPlan: (planId: string) => void;
  onNavigate: (page: PageRoute) => void;
}

export const PlansPage: React.FC<PlansPageProps> = ({
  settings,
  plans,
  onSelectPlan,
  onNavigate,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyEasypaisa = async () => {
    try {
      await navigator.clipboard.writeText(settings.easypaisaNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const el = document.createElement('textarea');
      el.value = settings.easypaisaNumber;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="bg-[#080c14] text-slate-100 min-h-screen">
      {/* Plans Page Header */}
      <section className="py-14 sm:py-20 bg-[#0b101d] border-b border-[#cba352]/20 relative overflow-hidden">
        <div className="tz-stage-blob-1" aria-hidden="true" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#cba352]/15 border border-[#cba352]/30 text-[#f8e7a1] text-xs font-semibold uppercase tracking-wider mb-3">
              <Zap className="w-3.5 h-3.5 text-[#cba352]" />
              <span>Investment Packages</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              High-Yield Daily Investment Plans
            </h1>
            <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed">
              Explore TrustZone's 12 structured investment packages with 20% guaranteed daily returns for 90 days. Select any plan to activate it via Easypaisa in the Client Portal.
            </p>
          </div>
        </div>
      </section>

      {/* 12 Plans Grid */}
      <PlansSection
        plans={plans}
        settings={settings}
        onSelectPlan={onSelectPlan}
        onNavigate={onNavigate}
      />

      {/* Interactive Calculator */}
      <InvestmentCalculator plans={plans} onSelectPlan={onSelectPlan} />

      {/* Multi-Tier Referral Program */}
      <ReferralSection user={null} onNavigateLogin={() => onNavigate('login')} />

      {/* Payment & Verification Information Banner */}
      <section className="py-16 bg-[#090d16] border-t border-[#cba352]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#0e1424] border border-[#cba352]/30 rounded-2xl p-6 sm:p-8 shadow-xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-3">
                <div className="text-xs font-bold text-[#cba352] uppercase tracking-wider">
                  Payment Instructions · Manual Approval Policy
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">
                  Official Easypaisa Payment Procedure
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed">
                  1. Select your desired package from the 12 investment tiers above.
                  <br />
                  2. Transfer the exact plan amount to the official TrustZone Easypaisa account:{' '}
                  <strong className="font-mono text-[#f8e7a1]">
                    {settings.easypaisaNumber}
                  </strong>
                  .<br />
                  3. Log in to the Client Portal and submit your Transaction ID (TID). Once our administrator approves the payment, your wallet is credited and you can also request withdrawals!
                </p>
              </div>

              <div className="lg:col-span-5 flex flex-col gap-3">
                <div className="p-4 bg-[#080c14] border border-slate-800 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-400">Official Easypaisa Number</div>
                    <div className="font-mono text-lg font-bold text-[#f8e7a1]">
                      {settings.easypaisaNumber}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyEasypaisa}
                    className="btn-gold px-3.5 py-1.5 text-xs font-bold cursor-pointer"
                  >
                    {copied ? 'Copied!' : 'Copy Number'}
                  </button>
                </div>

                <a
                  href={settings.telegramSupportUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-[#080c14] border border-slate-800 hover:border-[#cba352]/50 rounded-xl flex items-center justify-between text-xs text-slate-300 hover:text-white transition-colors"
                >
                  <span>Telegram Support ({settings.telegramHandle})</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
