import React from 'react';
import { ExternalLink, ShieldCheck, Zap } from 'lucide-react';
import { PageRoute, SiteSettings } from '../../types';
import { BrandLogo } from '../brand/BrandLogo';

interface FooterProps {
  onNavigate: (page: PageRoute) => void;
  settings: SiteSettings;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, settings }) => {
  const go = (page: PageRoute) => {
    onNavigate(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#060911] text-slate-300 border-t border-[#cba352]/20 relative overflow-hidden">
      {/* Top subtle golden glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-[#cba352]/50 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-18">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-slate-800/80">
          {/* Column 1: TrustZone Brand & Bio (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <a
              href="/?page=home"
              onClick={(e) => {
                e.preventDefault();
                go('home');
              }}
              className="inline-block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cba352] rounded-lg"
            >
              <BrandLogo
                logoUrl={settings.logoUrl}
                brandName={settings.brandName}
                variant="light"
              />
            </a>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              TrustZone NexaPay is your trusted platform for smart digital investments and secure financial growth. We provide a transparent and user-friendly experience for all investors with guaranteed daily yields and instant payouts.
            </p>
            <div className="pt-2 flex items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                SSL 256-Bit Encrypted
              </span>
              <span>·</span>
              <span className="text-[#cba352] font-semibold">Verified Platform</span>
            </div>
          </div>

          {/* Column 2: Explore (2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Explore</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button
                  type="button"
                  onClick={() => go('home')}
                  className="text-slate-400 hover:text-[#cba352] transition-colors cursor-pointer"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => go('about')}
                  className="text-slate-400 hover:text-[#cba352] transition-colors cursor-pointer"
                >
                  About TrustZone
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => go('plans')}
                  className="text-slate-400 hover:text-[#cba352] transition-colors cursor-pointer"
                >
                  Investment Plans
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => go('contact')}
                  className="text-slate-400 hover:text-[#cba352] transition-colors cursor-pointer"
                >
                  Contact Support
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Account (2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Account</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button
                  type="button"
                  onClick={() => go('login')}
                  className="text-slate-400 hover:text-[#cba352] transition-colors cursor-pointer"
                >
                  Login
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => go('register')}
                  className="text-slate-400 hover:text-[#cba352] transition-colors cursor-pointer"
                >
                  Register
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => go('dashboard')}
                  className="text-slate-400 hover:text-[#cba352] transition-colors cursor-pointer"
                >
                  Client Dashboard
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => go('admin')}
                  className="text-slate-400 hover:text-[#cba352] transition-colors cursor-pointer"
                >
                  Admin Console
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Official Channels (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Support &amp; Community</h3>
            <p className="text-xs text-slate-400">
              Connect directly with our 24/7 dedicated support team.
            </p>
            <div className="space-y-2.5 pt-1">
              <a
                href={settings.telegramSupportUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#0e1424] border border-slate-800 hover:border-[#cba352]/50 text-xs text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-[#cba352]" />
                  <span>Telegram: {settings.telegramHandle}</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </a>
              <a
                href={settings.whatsappChannelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#0e1424] border border-slate-800 hover:border-emerald-500/50 text-xs text-slate-200 transition-colors"
              >
                <span>WhatsApp Official Channel</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            &copy; 2026 <strong>TrustZone</strong>. All Rights Reserved.
          </div>
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => go('privacy')}
              className="hover:text-slate-200 transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
            <button
              type="button"
              onClick={() => go('terms')}
              className="hover:text-slate-200 transition-colors cursor-pointer"
            >
              Terms of Service
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
