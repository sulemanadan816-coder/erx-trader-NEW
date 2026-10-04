import React, { useState, useMemo } from 'react';
import {
  Users,
  Copy,
  Check,
  Share2,
  Gift,
  TrendingUp,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Award,
  Layers,
  Calculator,
  RefreshCw,
} from 'lucide-react';
import {
  ReferralCommissionLog,
  ReferralMember,
  ReferralStatsResponse,
  ServicePlan,
  SiteSettings,
  UserAccount,
} from '../../types';
import { parseNumericPkr } from '../../server/ledgerUtilsClient';

interface ClientReferralsTabProps {
  user: UserAccount;
  token: string;
  settings: SiteSettings;
  plans: ServicePlan[];
  stats: ReferralStatsResponse | null;
  onRefresh: () => void;
}

export const ClientReferralsTab: React.FC<ClientReferralsTabProps> = ({
  user,
  settings,
  plans,
  stats,
  onRefresh,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [teamTab, setTeamTab] = useState<'ALL' | 1 | 2>('ALL');

  // Calculator state
  const [calcL1Count, setCalcL1Count] = useState(5);
  const [calcPlanIndex, setCalcPlanIndex] = useState(3); // default plan 04
  const [calcL2CountPerL1, setCalcL2CountPerL1] = useState(3);

  const referralCode =
    stats?.referralCode ||
    user.referralCode ||
    `TZ-${user.id.slice(-6).toUpperCase()}`;

  const referralLink =
    typeof window !== 'undefined'
      ? `${window.location.origin}/?ref=${referralCode}`
      : `/?ref=${referralCode}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      const el = document.createElement('textarea');
      el.value = referralLink;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    } catch {
      const el = document.createElement('textarea');
      el.value = referralCode;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    }
  };

  const shareText = encodeURIComponent(
    `Join ${settings.brandName} with me and start earning guaranteed daily passive returns! Use my invitation referral link to register:\n${referralLink}\nReferral Code: ${referralCode}`
  );
  const whatsappUrl = `https://api.whatsapp.com/send?text=${shareText}`;
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(
    referralLink
  )}&text=${encodeURIComponent(
    `Join ${settings.brandName} and earn guaranteed daily yield! Code: ${referralCode}`
  )}`;

  // Filtered team members
  const teamMembers = stats?.teamMembers || [];
  const filteredTeam = useMemo(() => {
    if (teamTab === 'ALL') return teamMembers;
    return teamMembers.filter((m) => m.level === teamTab);
  }, [teamMembers, teamTab]);

  const commissionLogs = stats?.commissionLogs || [];

  // Calculator math
  const selectedCalcPlan = plans[calcPlanIndex] || plans[0];
  const planPriceNum = selectedCalcPlan ? parseNumericPkr(selectedCalcPlan.price) : 2445;
  const calcL1Earnings = Math.round(calcL1Count * planPriceNum * 0.13);
  const calcTotalL2Members = calcL1Count * calcL2CountPerL1;
  const calcL2Earnings = Math.round(calcTotalL2Members * planPriceNum * 0.02);
  const calcTotalEarnings = calcL1Earnings + calcL2Earnings;

  const totalEarnings = stats?.totalEarnings || user.totalReferralEarnings || 0;
  const totalReferrals = stats?.totalReferrals || user.referralCount || 0;
  const level1Count = stats?.level1Count || 0;
  const level2Count = stats?.level2Count || 0;
  const level1Earnings = stats?.level1Earnings || 0;
  const level2Earnings = stats?.level2Earnings || 0;

  return (
    <div className="space-y-6">
      {/* 1. Header Hero Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0d1424] via-[#161f36] to-[#0d1424] border border-[#cba352]/30 p-6 sm:p-8 shadow-xl">
        <div className="tz-stage-blob-1" aria-hidden="true" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#cba352]/20 border border-[#cba352]/40 text-[#f8e7a1] text-xs font-semibold uppercase tracking-wider mb-3">
              <Gift className="w-3.5 h-3.5 text-[#cba352]" />
              <span>Multi-Tier Affiliate Program</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Earn Attractive Referral Commissions
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Earn <span className="text-[#f8e7a1] font-bold">13% Direct Commission (Level 1)</span> on all your direct friends' plan investments plus an additional <span className="text-[#f8e7a1] font-bold">2% Indirect Team Commission (Level 2)</span>. All earnings are credited straight to your available balance and ready for instant withdrawal!
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-[#f8e7a1] via-[#cba352] to-[#b88d37] hover:brightness-110 text-[#0b0f19] flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer transition-all"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-900" /> : <Copy className="w-4 h-4" />}
              <span>{copiedLink ? 'Link Copied!' : 'Copy Invite Link'}</span>
            </button>
            <button
              type="button"
              onClick={onRefresh}
              title="Refresh referral data"
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 cursor-pointer transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Earnings */}
        <div className="bg-[#0e1424] border border-[#cba352]/30 rounded-xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Commission Earned</span>
            <Sparkles className="w-4 h-4 text-[#cba352]" />
          </div>
          <div className="mt-2 font-mono text-2xl sm:text-3xl font-bold text-[#f8e7a1]">
            Rs. {totalEarnings.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-emerald-400 font-medium flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Credited to Available Balance</span>
          </div>
        </div>

        {/* Total Network Size */}
        <div className="bg-[#0e1424] border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Team Members</span>
            <Users className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-2 font-mono text-2xl sm:text-3xl font-bold text-white">
            {totalReferrals}{' '}
            <span className="text-sm font-normal text-slate-400">members</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Across 2 Commission Tiers
          </div>
        </div>

        {/* Level 1 Direct */}
        <div className="bg-[#0e1424] border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Level 1 (Direct · 13%)</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#cba352]/20 text-[#f8e7a1]">
              13% Rate
            </span>
          </div>
          <div className="mt-2 font-mono text-2xl sm:text-3xl font-bold text-white">
            {level1Count}{' '}
            <span className="text-sm font-normal text-slate-400">users</span>
          </div>
          <div className="mt-1 text-[11px] text-[#f8e7a1] font-mono">
            Rs. {level1Earnings.toLocaleString()} earned
          </div>
        </div>

        {/* Level 2 Indirect */}
        <div className="bg-[#0e1424] border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Level 2 (Team · 2%)</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-300">
              2% Rate
            </span>
          </div>
          <div className="mt-2 font-mono text-2xl sm:text-3xl font-bold text-white">
            {level2Count}{' '}
            <span className="text-sm font-normal text-slate-400">users</span>
          </div>
          <div className="mt-1 text-[11px] text-sky-300 font-mono">
            Rs. {level2Earnings.toLocaleString()} earned
          </div>
        </div>
      </div>

      {/* 3. Link & Code Share Card */}
      <div className="bg-[#0e1424] border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Share2 className="w-4 h-4 text-[#cba352]" />
            <span>Your Exclusive Invitation Links</span>
          </h3>
          <span className="text-[11px] text-slate-400">
            Share on social networks or chat
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Referral Link Box */}
          <div className="lg:col-span-8 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Invitation Referral URL
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
                  onClick={handleCopyLink}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#cba352] hover:bg-[#dfb867] text-[#0b0f19] flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-900" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Share Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs text-slate-400 mr-1">One-Click Share:</span>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 hover:text-white hover:bg-emerald-900/80 text-xs font-medium transition-colors"
              >
                <span>WhatsApp</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href={telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-950/80 border border-sky-700/60 text-sky-300 hover:text-white hover:bg-sky-900/80 text-xs font-medium transition-colors"
              >
                <span>Telegram</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Referral Code Box */}
          <div className="lg:col-span-4 bg-[#080c14] border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="text-xs text-slate-400">Your Referral Code</div>
              <div className="mt-1 font-mono text-xl font-extrabold text-[#f8e7a1] tracking-wider">
                {referralCode}
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                New users can also manually enter this code during registration.
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopyCode}
              className="mt-3 w-full py-1.5 px-3 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Code Copied' : 'Copy Code'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Multi-Tier Commission Rates & Rules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Level 1 Card */}
        <div className="bg-[#0e1424] border border-[#cba352]/30 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#cba352]/20 text-[#f8e7a1]">
                Tier 1 Commission
              </span>
              <Award className="w-5 h-5 text-[#cba352]" />
            </div>
            <h4 className="text-lg font-bold text-white">Level 1 Direct Referrals</h4>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-mono text-4xl font-extrabold text-[#cba352]">13%</span>
              <span className="text-xs text-slate-300">Instant Cash Commission</span>
            </div>
            <p className="mt-3 text-xs text-slate-300 leading-relaxed">
              Earn an immediate 13% commission every time a user who registered using your referral link purchases or activates an investment package.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Example: Rs. 10,000 plan</span>
            <span className="font-mono font-bold text-[#f8e7a1]">+Rs. 1,300 bonus</span>
          </div>
        </div>

        {/* Level 2 Card */}
        <div className="bg-[#0e1424] border border-sky-800/40 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-sky-500/20 text-sky-300">
                Tier 2 Commission
              </span>
              <Layers className="w-5 h-5 text-sky-400" />
            </div>
            <h4 className="text-lg font-bold text-white">Level 2 Team Referrals</h4>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-mono text-4xl font-extrabold text-sky-400">2%</span>
              <span className="text-xs text-slate-300">Indirect Team Commission</span>
            </div>
            <p className="mt-3 text-xs text-slate-300 leading-relaxed">
              When your direct invites refer their own friends, you earn a 2% passive commission on all secondary investments, building true team leverage!
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Example: Rs. 10,000 plan</span>
            <span className="font-mono font-bold text-sky-300">+Rs. 200 bonus</span>
          </div>
        </div>
      </div>

      {/* 5. Interactive Referral Profit Simulator */}
      <div className="bg-[#0e1424] border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="w-4 h-4 text-[#cba352]" />
          <h3 className="text-sm font-bold text-white">
            Referral Potential Income Calculator
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Direct Level 1 Friends: <strong className="text-white">{calcL1Count}</strong>
            </label>
            <input
              type="range"
              min="1"
              max="50"
              value={calcL1Count}
              onChange={(e) => setCalcL1Count(Number(e.target.value))}
              className="w-full accent-[#cba352] cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Average Investment Package
            </label>
            <select
              value={calcPlanIndex}
              onChange={(e) => setCalcPlanIndex(Number(e.target.value))}
              className="w-full bg-[#080c14] border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#cba352]"
            >
              {plans.map((p, idx) => (
                <option key={p.id} value={idx}>
                  {p.name} ({p.price})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Friends they invite each (L2): <strong className="text-white">{calcL2CountPerL1}</strong>
            </label>
            <input
              type="range"
              min="0"
              max="20"
              value={calcL2CountPerL1}
              onChange={(e) => setCalcL2CountPerL1(Number(e.target.value))}
              className="w-full accent-[#cba352] cursor-pointer"
            />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#080c14] border border-[#cba352]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs text-slate-400">
              Estimated Total Commission Yield
            </div>
            <div className="text-xs text-slate-300">
              Level 1 (13%): <span className="font-mono text-[#f8e7a1] font-bold">Rs. {calcL1Earnings.toLocaleString()}</span> &bull; Level 2 (2%): <span className="font-mono text-sky-400 font-bold">Rs. {calcL2Earnings.toLocaleString()}</span>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <div className="font-mono text-2xl sm:text-3xl font-extrabold text-[#f8e7a1]">
              Rs. {calcTotalEarnings.toLocaleString()}
            </div>
            <div className="text-[11px] text-emerald-400">
              Available for immediate cash withdrawal
            </div>
          </div>
        </div>
      </div>

      {/* 6. Referral Team Table */}
      <div className="bg-[#0e1424] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-[#cba352]" />
              <span>My Referral Team ({teamMembers.length})</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Clients registered through your invitation hierarchy
            </p>
          </div>

          <div className="flex items-center gap-1 bg-[#080c14] p-1 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => setTeamTab('ALL')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                teamTab === 'ALL'
                  ? 'bg-[#cba352] text-[#0b0f19]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({teamMembers.length})
            </button>
            <button
              type="button"
              onClick={() => setTeamTab(1)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                teamTab === 1
                  ? 'bg-[#cba352] text-[#0b0f19]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Level 1 ({level1Count})
            </button>
            <button
              type="button"
              onClick={() => setTeamTab(2)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                teamTab === 2
                  ? 'bg-[#cba352] text-[#0b0f19]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Level 2 ({level2Count})
            </button>
          </div>
        </div>

        {filteredTeam.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-slate-500 mb-3">
              <Users className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-white">No referrals in this tier yet</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Share your link with your network on WhatsApp and Telegram to start building your referral team and receiving 13% cash commissions!
            </p>
            <button
              type="button"
              onClick={handleCopyLink}
              className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-[#cba352] hover:bg-[#dfb867] text-[#0b0f19] cursor-pointer transition-colors"
            >
              {copiedLink ? 'Link Copied!' : 'Copy Invitation Link'}
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#080c14] text-[11px] text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Member</th>
                  <th className="py-3 px-4">Tier Level</th>
                  <th className="py-3 px-4">Joined Date</th>
                  <th className="py-3 px-4">Active Plan</th>
                  <th className="py-3 px-4 text-right">Total Invested</th>
                  <th className="py-3 px-4 text-right">Commission For You</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredTeam.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-900/40">
                    <td className="py-3.5 px-4 font-medium text-white">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-[#cba352]/20 border border-[#cba352]/30 flex items-center justify-center font-bold text-[11px] text-[#f8e7a1]">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div>{member.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {member.identifier.includes('@')
                              ? member.identifier.replace(/(.{2})(.*)(@.*)/, '$1***$3')
                              : member.identifier.replace(/(\d{3})\d+(\d{2})/, '$1****$2')}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {member.level === 1 ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#cba352]/20 text-[#f8e7a1] border border-[#cba352]/30">
                          Level 1 · 13%
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/30">
                          Level 2 · 2%
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {new Date(member.joinedAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4">
                      {member.activePlanName ? (
                        <span className="font-medium text-amber-300">
                          {member.activePlanName}
                        </span>
                      ) : (
                        <span className="text-slate-500 italic">No Active Plan</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono">
                      Rs. {member.totalInvested.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400">
                      +Rs. {member.commissionEarned.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 7. Commission Payout History */}
      {commissionLogs.length > 0 && (
        <div className="bg-[#0e1424] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-5 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Commission Payout Activity ({commissionLogs.length})</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Verified referral payouts deposited into your available balance
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#080c14] text-[11px] text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Date &amp; Time</th>
                  <th className="py-3 px-4">From Member</th>
                  <th className="py-3 px-4">Package</th>
                  <th className="py-3 px-4">Rate</th>
                  <th className="py-3 px-4 text-right">Investment Amount</th>
                  <th className="py-3 px-4 text-right">Bonus Credited</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {commissionLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/40">
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-white">
                      {log.referredUserName}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {log.planName}
                    </td>
                    <td className="py-3.5 px-4">
                      {log.level === 1 ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#cba352]/20 text-[#f8e7a1]">
                          13% (L1)
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-300">
                          2% (L2)
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono">
                      Rs. {log.sourceAmount.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400">
                      +Rs. {log.commissionAmount.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                        <Check className="w-3 h-3" />
                        Credited
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
