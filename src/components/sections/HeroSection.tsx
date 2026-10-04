import React from 'react';
import { Star, ShieldCheck, Zap, ArrowRight } from 'lucide-react';
import { PageRoute, SiteSettings, UserAccount } from '../../types';

interface HeroSectionProps {
  settings: SiteSettings;
  user: UserAccount | null;
  onNavigate: (page: PageRoute) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  settings,
  user,
  onNavigate,
}) => {
  return (
    <section className="relative overflow-hidden bg-[#080c14] py-16 sm:py-24 lg:py-32 border-b border-[#cba352]/20">
      {/* Animated Stage Glow Orbs */}
      <div className="tz-stage-blob-1" aria-hidden="true" />
      <div className="tz-stage-blob-2" aria-hidden="true" />
      <div className="tz-stage-blob-3" aria-hidden="true" />

      {/* Floating Coins */}
      <div className="tz-coin tz-coin-1" aria-hidden="true"><span>₨</span></div>
      <div className="tz-coin tz-coin-2" aria-hidden="true"><span>$</span></div>
      <div className="tz-coin tz-coin-3" aria-hidden="true"><span>₨</span></div>
      <div className="tz-coin tz-coin-4" aria-hidden="true"><span>$</span></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Headline, Subheadline & Action Buttons */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#cba352]/15 border border-[#cba352]/30 text-[#f8e7a1] text-xs font-semibold tracking-wide">
              <Zap className="w-3.5 h-3.5 text-[#cba352] fill-[#cba352]" />
              <span>Smart Digital Investment Platform</span>
              <span className="text-[#cba352]">·</span>
              <span className="text-slate-300">Guaranteed Daily Returns</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.12]">
              Invest with clarity. <br className="hidden sm:inline" />
              Grow with <span className="bg-gradient-to-r from-[#f8e7a1] via-[#cba352] to-[#b88d37] bg-clip-text text-transparent">NexaPay.</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
              Open an account in a few clicks. Start investing securely — no complex setup. Earn guaranteed daily returns with instant deposits and transparent withdrawals.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              {user ? (
                <button
                  type="button"
                  onClick={() => onNavigate(user.role === 'admin' ? 'admin' : 'dashboard')}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-bold text-[#0b0f19] bg-gradient-to-r from-[#f8e7a1] via-[#cba352] to-[#b88d37] hover:brightness-110 rounded-xl shadow-lg shadow-amber-500/25 transition-all cursor-pointer"
                >
                  <span>Go to Your Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => onNavigate('register')}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-bold text-[#0b0f19] bg-gradient-to-r from-[#f8e7a1] via-[#cba352] to-[#b88d37] hover:brightness-110 rounded-xl shadow-lg shadow-amber-500/25 transition-all cursor-pointer"
                  >
                    <span>Register</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('login')}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-semibold text-[#cba352] hover:text-white border-2 border-[#cba352]/60 hover:border-[#cba352] bg-[#cba352]/10 hover:bg-[#cba352]/20 rounded-xl transition-all cursor-pointer"
                  >
                    <span>Login</span>
                  </button>
                </>
              )}
            </div>

            {/* Social Proof */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 text-xs text-slate-400">
              <span className="font-medium text-slate-300">Rated 5 stars by investors worldwide</span>
              <div className="flex items-center gap-1 text-[#f8e7a1]" aria-label="5 stars rating">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-[#cba352] text-[#cba352]" />
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: NexaPay Glass Card with Glowing Orbs */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[380px] sm:max-w-[420px]">
              {/* Purple & Yellow Orbs */}
              <div className="absolute -top-10 -left-10 w-44 h-44 rounded-full bg-purple-600/30 blur-2xl pointer-events-none" />
              <div className="absolute -bottom-10 -right-10 w-48 h-48 rounded-full bg-amber-500/30 blur-2xl pointer-events-none" />

              {/* NexaPay Card Frame */}
              <div className="relative bg-gradient-to-br from-[#1b253b] via-[#101728] to-[#0a0f1d] border-2 border-[#cba352]/40 rounded-3xl p-7 sm:p-8 shadow-2xl shadow-amber-500/10 backdrop-blur-xl">
                {/* Header of Card */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#f8e7a1] to-[#cba352] p-0.5 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-[#0b0f19] fill-[#0b0f19]" />
                    </span>
                    <span className="font-extrabold tracking-wider text-white text-lg">
                      TrustZone
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Live Verified
                  </span>
                </div>

                {/* NexaPay Chip SVG */}
                <div className="mt-8 mb-6">
                  <svg className="w-14 h-11" viewBox="0 0 48 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="1" y="1" width="46" height="34" rx="6" fill="url(#chipGrad)" stroke="rgba(255,255,255,.45)" strokeWidth="1"/>
                    <path d="M1 12h46M1 24h46M16 1v34M32 1v34" stroke="rgba(255,255,255,.35)" strokeWidth="1"/>
                    <defs>
                      <linearGradient id="chipGrad" x1="0" y1="0" x2="48" y2="36" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#f8e7a1"/>
                        <stop offset="1" stopColor="#cba352"/>
                      </linearGradient>
                    </defs>
                  </svg>
                </div>

                {/* Card Number / Details */}
                <div className="space-y-1 font-mono">
                  <div className="text-[11px] text-slate-400 uppercase tracking-widest">
                    Guaranteed Portfolio Yield
                  </div>
                  <div className="text-2xl font-bold tracking-widest text-[#f8e7a1]">
                    20% DAILY RETURN
                  </div>
                  <div className="text-xs text-slate-400 pt-1">
                    Duration: 90 Days · Daily Payouts
                  </div>
                </div>

                {/* Footer of Card */}
                <div className="mt-8 pt-4 border-t border-slate-700/60 flex items-center justify-between text-xs">
                  <div>
                    <div className="text-[10px] text-slate-400 font-sans uppercase">Security</div>
                    <div className="font-mono font-bold text-white flex items-center gap-1 mt-0.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>NEXAPAY SECURE</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 font-sans uppercase">Network</div>
                    <div className="font-mono font-bold text-[#cba352]">VERIFIED NETWORK</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
