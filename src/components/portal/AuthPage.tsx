import React, { useState, useEffect } from 'react';
import { Lock, Mail, User, Zap, ArrowRight, Gift, CheckCircle2 } from 'lucide-react';
import { PageRoute, SiteSettings, UserAccount } from '../../types';
import { apiRequest } from '../../utils/api';

interface AuthPageProps {
  mode: 'login' | 'register';
  settings: SiteSettings;
  onNavigate: (page: PageRoute) => void;
  onAuthSuccess: (token: string, user: UserAccount) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  mode,
  settings,
  onNavigate,
  onAuthSuccess,
}) => {
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [hasRefCodeApplied, setHasRefCodeApplied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLogin = mode === 'login';

  useEffect(() => {
    try {
      const storedRef = localStorage.getItem('trustzone_ref_code');
      if (storedRef) {
        setReferralCode(storedRef);
        setHasRefCodeApplied(true);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isLogin && name.trim().length < 2) {
      setError('Please enter your full name (at least 2 characters).');
      return;
    }
    if (identifier.trim().length < 4) {
      setError('Please enter a valid email address or phone number.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const payload = isLogin
        ? { identifier: identifier.trim(), password }
        : {
            name: name.trim(),
            identifier: identifier.trim(),
            password,
            referralCode: referralCode.trim() || undefined,
          };

      const res = await apiRequest<{ token: string; user: UserAccount; error?: string }>(
        endpoint,
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok || !res.data?.token || !res.data?.user) {
        setError(res.error || 'Authentication failed. Please check your credentials.');
      } else {
        try {
          localStorage.removeItem('trustzone_ref_code');
        } catch {
          // ignore
        }
        onAuthSuccess(res.data.token, res.data.user);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-16 sm:py-24 bg-[#080c14] min-h-[calc(100vh-4.5rem)] flex items-center justify-center relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="tz-stage-blob-1" aria-hidden="true" />
      <div className="tz-stage-blob-2" aria-hidden="true" />

      <div className="w-full max-w-md mx-auto px-4 sm:px-6 relative z-10">
        <div className="bg-[#0e1424]/90 backdrop-blur-xl border border-[#cba352]/30 rounded-3xl p-7 sm:p-9 shadow-2xl">
          {/* Header branding */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#cba352]/15 border border-[#cba352]/30 text-[#f8e7a1] text-xs font-semibold uppercase tracking-wider mb-3">
              <Zap className="w-3.5 h-3.5 text-[#cba352] fill-[#cba352]" />
              <span>{settings.brandName} Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {isLogin ? 'Welcome Back' : 'Create an Account'}
            </h1>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed">
              {isLogin
                ? 'Sign in to access your investment dashboard, earnings, and fast withdrawals.'
                : 'Join TrustZone today to invest in guaranteed daily yield plans.'}
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-[#080c14] border border-slate-800 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => {
                setError(null);
                onNavigate('login');
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                isLogin
                  ? 'bg-gradient-to-r from-[#f8e7a1] via-[#cba352] to-[#b88d37] text-[#0b0f19] shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setError(null);
                onNavigate('register');
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                !isLogin
                  ? 'bg-gradient-to-r from-[#f8e7a1] via-[#cba352] to-[#b88d37] text-[#0b0f19] shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {error && (
              <div
                role="alert"
                className="p-3.5 rounded-xl bg-red-950/70 border border-red-700/60 text-xs font-medium text-red-200"
              >
                {error}
              </div>
            )}

            {!isLogin && (
              <div>
                <label
                  htmlFor="auth-name"
                  className="block text-xs font-semibold text-slate-300 mb-1.5"
                >
                  Full Name
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    id="auth-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    required
                    className="w-full pl-10 pr-3.5 py-3 text-sm bg-[#080c14] border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-[#cba352] focus:ring-1 focus:ring-[#cba352]"
                  />
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor="auth-identifier"
                className="block text-xs font-semibold text-slate-300 mb-1.5"
              >
                Email Address or Phone Number
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  id="auth-identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="you@example.com or 03XX-XXXXXXX"
                  required
                  className="w-full pl-10 pr-3.5 py-3 text-sm bg-[#080c14] border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-[#cba352] focus:ring-1 focus:ring-[#cba352]"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="auth-password"
                className="block text-xs font-semibold text-slate-300 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  id="auth-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  required
                  className="w-full pl-10 pr-3.5 py-3 text-sm bg-[#080c14] border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-[#cba352] focus:ring-1 focus:ring-[#cba352]"
                />
              </div>
            </div>

            {!isLogin && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="auth-refcode"
                    className="block text-xs font-semibold text-slate-300"
                  >
                    Referral Code (Optional)
                  </label>
                  {hasRefCodeApplied && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Invitation Applied
                    </span>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#cba352]">
                    <Gift className="w-4 h-4" />
                  </span>
                  <input
                    id="auth-refcode"
                    type="text"
                    value={referralCode}
                    onChange={(e) => {
                      setReferralCode(e.target.value.toUpperCase());
                      setHasRefCodeApplied(Boolean(e.target.value.trim()));
                    }}
                    placeholder="e.g. TZ123456 or leave blank"
                    className="w-full pl-10 pr-3.5 py-3 text-sm bg-[#080c14] border border-slate-700 uppercase font-mono rounded-xl text-white placeholder:text-slate-500 placeholder:normal-case placeholder:font-sans focus:outline-none focus:border-[#cba352] focus:ring-1 focus:ring-[#cba352]"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-gold py-3.5 px-4 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 shadow-lg shadow-amber-500/20 mt-2"
            >
              <span>{loading ? 'Authenticating...' : isLogin ? 'Sign In to Portal' : 'Create Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};
