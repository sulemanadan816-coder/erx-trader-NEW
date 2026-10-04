import React from 'react';
import { ExternalLink } from 'lucide-react';
import { DEFAULT_HOW_IT_WORKS } from '../../config/siteConfig';
import { PageRoute, SiteSettings } from '../../types';
import { ContactSupportSection } from '../sections/ContactSupportSection';

interface HowItWorksPageProps {
  settings: SiteSettings;
  onNavigate: (page: PageRoute) => void;
}

export const HowItWorksPage: React.FC<HowItWorksPageProps> = ({ settings, onNavigate }) => {
  const handleStepAction = (index: number) => {
    if (index === 0) onNavigate('plans');
    else if (index === 1) window.open(settings.telegramSupportUrl, '_blank', 'noopener,noreferrer');
    else onNavigate('dashboard');
  };

  return (
    <div className="bg-[#080c14] text-slate-100 min-h-screen">
      <section className="py-14 sm:py-20 bg-[#0b101d] border-b border-[#cba352]/20 relative overflow-hidden">
        <div className="tz-stage-blob-1" aria-hidden="true" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#cba352]/15 border border-[#cba352]/30 text-[#f8e7a1] text-xs font-semibold uppercase tracking-wider mb-3">
              <span>Process Guide · Getting Started</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              How {settings.brandName} Works
            </h1>
            <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed">
              We keep our onboarding and account verification workflow simple and transparent. Follow the
              steps below to select a package, verify your Easypaisa payment, and earn 20% daily returns.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
            {DEFAULT_HOW_IT_WORKS.map((step, idx) => (
              <div
                key={step.stepNumber}
                className="bg-[#0e1424] border border-[#cba352]/25 rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-xl"
              >
                <div>
                  <div className="text-xs text-[#cba352] mb-2 font-mono">
                    <span className="font-bold">
                      Step {step.stepNumber}
                    </span>
                    <span aria-hidden="true"> · </span>
                    <span>Required Stage</span>
                  </div>
                  <h2 className="text-xl font-bold text-white">
                    {step.stepNumber}. {step.title}
                  </h2>
                  <p className="mt-3 text-sm text-slate-300 leading-relaxed">{step.description}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => handleStepAction(idx)}
                    className="btn-gold py-2.5 px-5 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>{step.actionLabel}</span>
                    {idx === 1 ? <ExternalLink className="w-3.5 h-3.5" /> : <span>&rarr;</span>}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ContactSupportSection settings={settings} showInquiryForm={false} />
    </div>
  );
};
