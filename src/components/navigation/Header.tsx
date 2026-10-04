import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { PageRoute, SiteSettings, UserAccount } from '../../types';
import { BrandLogo } from '../brand/BrandLogo';

interface HeaderProps {
  currentPage: PageRoute;
  onNavigate: (page: PageRoute) => void;
  settings: SiteSettings;
  user: UserAccount | null;
  onLogout: () => void;
}

const NAV_ITEMS: { label: string; route: PageRoute }[] = [
  { label: 'Home', route: 'home' },
  { label: 'About', route: 'about' },
  { label: 'Plan', route: 'plans' },
  { label: 'Contact', route: 'contact' },
];

const AUTHORIZED_ADMIN_EMAILS = [
  'sulemanadan816@gmail.com',
  'abubakararain104@gmail.com',
  'adangujjar3321@gmail.com',
];
function isExclusiveOwnerAdmin(user: UserAccount | null): boolean {
  return Boolean(
    user &&
      (user.role === 'admin' ||
        AUTHORIZED_ADMIN_EMAILS.includes(user.identifier.toLowerCase()))
  );
}

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  onNavigate,
  settings,
  user,
  onLogout,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (route: PageRoute) => {
    onNavigate(route);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-40 w-full h-18 bg-[#0b0f19]/90 backdrop-blur-md border-b border-[#cba352]/20">
      <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Zone 1: TrustZone Brand Lockup */}
        <a
          href="/?page=home"
          onClick={(e) => {
            e.preventDefault();
            handleNavClick('home');
          }}
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cba352] rounded-lg shrink-0"
          aria-label={`${settings.brandName} Home`}
        >
          <BrandLogo logoUrl={settings.logoUrl} brandName={settings.brandName} variant="light" />
        </a>

        {/* Zone 2: Navigation Links (Home, About, Plan, Contact) */}
        <nav
          aria-label="Primary Navigation"
          className="hidden lg:flex items-center gap-8 text-sm font-medium text-slate-300"
        >
          {NAV_ITEMS.map((item) => {
            const isActive =
              currentPage === item.route ||
              (item.route === 'plans' && currentPage === 'plans');
            return (
              <a
                key={item.route}
                href={`/?page=${item.route}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(item.route);
                }}
                className={`py-1 whitespace-nowrap shrink-0 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cba352] rounded-xs ${
                  isActive
                    ? 'text-[#cba352] font-semibold drop-shadow-[0_0_8px_rgba(203,163,82,0.4)]'
                    : 'text-slate-300 hover:text-[#cba352]'
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* Zone 3: Actions (Login & Register or User Dashboards) */}
        <div className="hidden lg:flex items-center gap-3 shrink-0">
          {user ? (
            <>
              <button
                type="button"
                onClick={() =>
                  handleNavClick(isExclusiveOwnerAdmin(user) ? 'admin' : 'dashboard')
                }
                className="px-4 py-2 text-xs font-semibold text-[#0b0f19] bg-gradient-to-r from-[#f8e7a1] via-[#cba352] to-[#b88d37] hover:brightness-110 rounded-lg shadow-sm shadow-amber-500/20 transition-all whitespace-nowrap shrink-0 cursor-pointer"
              >
                {isExclusiveOwnerAdmin(user) ? 'Admin Panel' : 'Dashboard'}
              </button>
              <button
                type="button"
                onClick={() => {
                  onLogout();
                  setMobileMenuOpen(false);
                }}
                className="px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => handleNavClick('login')}
                className="px-5 py-2 text-xs font-semibold text-[#cba352] hover:text-[#e5c368] border border-[#cba352]/60 hover:border-[#cba352] bg-[#cba352]/10 hover:bg-[#cba352]/20 rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer"
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => handleNavClick('register')}
                className="px-5 py-2 text-xs font-bold text-[#0b0f19] bg-gradient-to-r from-[#f8e7a1] via-[#cba352] to-[#b88d37] hover:brightness-110 rounded-lg shadow-md shadow-amber-500/25 transition-all whitespace-nowrap shrink-0 cursor-pointer"
              >
                Register
              </button>
            </>
          )}
        </div>

        {/* Mobile Hamburger Toggle & Quick Action */}
        <div className="flex lg:hidden items-center gap-2">
          {user && (
            <button
              type="button"
              onClick={() => handleNavClick(isExclusiveOwnerAdmin(user) ? 'admin' : 'dashboard')}
              className="px-2.5 py-1.5 text-xs font-bold text-[#0b0f19] bg-gradient-to-r from-[#f8e7a1] via-[#cba352] to-[#b88d37] rounded-md shadow-xs whitespace-nowrap cursor-pointer"
            >
              {isExclusiveOwnerAdmin(user) ? 'Admin' : 'Dashboard'}
            </button>
          )}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation-drawer"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] p-2 rounded-lg text-slate-200 hover:text-[#cba352] hover:bg-slate-800/50"
          >
            {mobileMenuOpen ? <X className="w-6 h-6 text-[#cba352]" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div
          id="mobile-navigation-drawer"
          className="lg:hidden bg-[#0c1222] border-b border-[#cba352]/30 shadow-2xl px-5 pt-4 pb-6 space-y-4"
        >
          <nav aria-label="Mobile Navigation" className="flex flex-col space-y-1.5">
            {NAV_ITEMS.map((item) => {
              const isActive = currentPage === item.route;
              return (
                <a
                  key={item.route}
                  href={`/?page=${item.route}`}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavClick(item.route);
                  }}
                  className={`px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#cba352]/15 text-[#cba352] font-semibold border-l-2 border-[#cba352]'
                      : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                  }`}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>

          <div className="pt-3 border-t border-slate-800 flex flex-col gap-2.5">
            {user ? (
              <>
                <button
                  type="button"
                  onClick={() =>
                    handleNavClick(isExclusiveOwnerAdmin(user) ? 'admin' : 'dashboard')
                  }
                  className="w-full py-2.5 px-4 text-sm font-bold text-[#0b0f19] bg-gradient-to-r from-[#f8e7a1] via-[#cba352] to-[#b88d37] rounded-lg text-center"
                >
                  {isExclusiveOwnerAdmin(user) ? 'Open Admin Panel' : 'Open Dashboard'}
                </button>
                {isExclusiveOwnerAdmin(user) && (
                  <button
                    type="button"
                    onClick={() => handleNavClick('dashboard')}
                    className="w-full py-2.5 px-4 text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg text-center"
                  >
                    Switch to Client View
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    onLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 px-4 text-sm font-semibold text-slate-300 bg-slate-800/80 hover:bg-slate-700 rounded-lg text-center"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleNavClick('login')}
                  className="w-full py-2.5 px-4 text-sm font-semibold text-[#cba352] border border-[#cba352]/50 bg-[#cba352]/10 rounded-lg text-center"
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => handleNavClick('register')}
                  className="w-full py-2.5 px-4 text-sm font-bold text-[#0b0f19] bg-gradient-to-r from-[#f8e7a1] via-[#cba352] to-[#b88d37] rounded-lg text-center shadow-md shadow-amber-500/20"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
