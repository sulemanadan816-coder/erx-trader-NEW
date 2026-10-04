import React, { useState } from 'react';
import { Users, Copy, Check, Gift, Sparkles, TrendingUp } from 'lucide-react';
import { REFERRAL_LEVELS } from '../../config/siteConfig';
import { UserAccount } from '../../types';

interface ReferralSectionProps {
  user: UserAccount | null;
  onNavigateLogin: () => void;
}

export const ReferralSection: React.FC<ReferralSectionProps> = ({
  user,
  onNavigateLogin,
}) => {
  const [copied, setCopied] = useState(false);

  const referralCode = user?.referralCode || (user ? `TZ-${user.id.slice(-6).toUpperCase()}` : 'TRUSTZONE-VIP');
  const referralLink = `${window.location.origin}/?ref=${referralCode}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const el = document.createElement('textarea');
      el.value = referralLink;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <section className="py-16 sm:py-24 bg-[#080c14] border-t border-[#cba352]/20 relative overflow-hidden">
      {/* Background radial gradient blobs */}
      <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-[#cba352]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-10 -right-20 w-96 h-96 bg-[#7c3aed]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#cba352]/15 border border-[#cba352]/30 text-[#f8e7a1] text-xs font-semibold uppercase tracking-wider mb-3">
            <Gift className="w-3.5 h-3.5 text-[#cba352]" />
            <span>Affiliate &amp; Commission Program</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Earn More with Referrals
          </h2>
          <p className="mt-3 text-base text-slate-300">
            Invite your network and earn attractive commissions on every successful referral!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-5xl mx-auto">
          {/* Left: Referral levels breakdown */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-[#0e1424]/90 border border-[#cba352]/25 rounded-2xl p-6 sm:p-7 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#f8e7a1] via-[#cba352] to-[#8c6a25] p-0.5 shadow-md">
                  <div className="w-full h-full bg-[#080c14] rounded-[10px] flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-[#cba352]" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Multi-Tier Rewards</h3>
                  <p className="text-xs text-slate-400">Instant payout upon partner deposit approval</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {REFERRAL_LEVELS.slice(0, 2).map((level, idx) => (
                  <div
                    key={level.level}
                    className="p-4 rounded-xl bg-[#080c14] border border-slate-800 flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-300">{level.level}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#cba352]/20 text-[#f8e7a1]">
                        {idx === 0 ? 'Direct' : 'Indirect'}
                      </span>
                    </div>
                    <div className="mt-3">
                      <div className="font-mono text-3xl font-extrabold text-[#cba352]">
                        {level.commission}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1 leading-snug">
                        {level.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 p-4 rounded-xl bg-[#080c14]/60 border border-slate-800/80 text-xs text-slate-400 leading-relaxed">
                Commissions are calculated automatically upon deposit verification by administrators and deposited into your available balance immediately.
              </div>
            </div>
          </div>

          {/* Right: Share & Earn Card */}
          <div className="lg:col-span-6 bg-gradient-to-br from-[#131b2e] to-[#0c1220] border-2 border-[#cba352]/40 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-[#cba352] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#cba352]" />
                  Share &amp; Earn
                </span>
                <Users className="w-5 h-5 text-slate-400" />
              </div>

              <h3 className="text-2xl font-extrabold text-white">
                Grow your team. Unlock rewards.
              </h3>
              <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                Share your unique TrustZone referral invitation link with friends and colleagues across WhatsApp, Telegram, and social networks to earn passive bonuses on their investments.
              </p>

              {/* Referral Link Box */}
              <div className="mt-6">
                <label className="block text-xs font-medium text-slate-300 mb-2">
                  Your Referral Link
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    readOnly
                    value={referralLink}
                    className="w-full bg-[#080c14] border border-slate-700 rounded-xl pl-4 pr-24 py-3 text-xs sm:text-sm text-slate-200 font-mono focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={user ? handleCopy : onNavigateLogin}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3.5 py-2 rounded-lg text-xs font-bold bg-[#cba352] hover:bg-[#dfb867] text-[#0b0f19] flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>{user ? 'Copy' : 'Login'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Code: <strong className="font-mono text-[#f8e7a1]">{referralCode}</strong></span>
              <span className="text-emerald-400 font-medium">Instant Multi-Tier Commission</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
