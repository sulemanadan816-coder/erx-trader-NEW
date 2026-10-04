import React from 'react';
import { ExternalLink } from 'lucide-react';
import { DEFAULT_FEATURES } from '../../config/siteConfig';
import { PageRoute, SiteSettings } from '../../types';
import { ContactSupportSection } from '../sections/ContactSupportSection';

interface AboutPageProps {
  settings: SiteSettings;
  onNavigate: (page: PageRoute) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ settings, onNavigate }) => {
  return (
    <div className="bg-[#080c14] text-slate-100 min-h-screen">
      <section className="py-14 sm:py-20 bg-[#0b101d] border-b border-[#cba352]/20 relative overflow-hidden">
        <div className="tz-stage-blob-1" aria-hidden="true" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#cba352]/15 border border-[#cba352]/30 text-[#f8e7a1] text-xs font-semibold uppercase tracking-wider mb-3">
              <span>About Us · NexaPay Technology</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              About {settings.brandName}
            </h1>
            <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed">
              {settings.brandName} is a premier online investment platform offering transparent, high-yield digital portfolios with 20% guaranteed daily returns for 90 days, direct Easypaisa payment verification, and dedicated 24/7 client support.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#0e1424] border border-[#cba352]/25 rounded-2xl p-6 shadow-xl">
              <div className="text-xs font-mono text-[#cba352] mb-2 font-bold">01 · Transparency</div>
              <h2 className="text-lg font-bold text-white">Guaranteed Daily Schedules</h2>
              <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                Every plan comes with a transparent daily profit calculation credited every 24 hours directly into your portal balance for 90 continuous days.
              </p>
            </div>

            <div className="bg-[#0e1424] border border-[#cba352]/25 rounded-2xl p-6 shadow-xl">
              <div className="text-xs font-mono text-[#cba352] mb-2 font-bold">02 · Security</div>
              <h2 className="text-lg font-bold text-white">Protected Capital &amp; Payouts</h2>
              <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                Your investment capital and earnings are safeguarded by our multi-layered ledger system, ensuring swift withdrawal requests and zero hidden fees.
              </p>
            </div>

            <div className="bg-[#0e1424] border border-[#cba352]/25 rounded-2xl p-6 shadow-xl">
              <div className="text-xs font-mono text-[#cba352] mb-2 font-bold">03 · Verified</div>
              <h2 className="text-lg font-bold text-white">Manual Payment Review</h2>
              <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                Every Easypaisa deposit submitted through our portal is tracked and manually verified by our authorized administrator panel before activation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Principles */}
      <section className="py-16 bg-[#080c14]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Platform Core Architecture</h2>
            <p className="mt-2 text-sm text-slate-300">
              How {settings.brandName} delivers smart automated earnings and swift withdrawal execution.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {DEFAULT_FEATURES.map((feat) => (
              <div key={feat.id} className="bg-[#0e1424] border border-slate-800 rounded-2xl p-6">
                <div className="text-xs text-[#cba352] mb-1.5 font-mono">
                  <span className="font-bold">{feat.number}</span>
                  <span aria-hidden="true"> · </span>
                  <span>{feat.outcome}</span>
                </div>
                <h3 className="text-base font-bold text-white">{feat.title}</h3>
                <p className="mt-2 text-sm text-slate-300 leading-relaxed">{feat.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => onNavigate('plans')}
              className="btn-gold py-3 px-6 text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              View Investment Plans
            </button>
            <a
              href={settings.telegramSupportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gold-ghost py-3 px-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
            >
              <span>Message Telegram Support</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </section>

      <ContactSupportSection settings={settings} showInquiryForm={false} />
    </div>
  );
};
