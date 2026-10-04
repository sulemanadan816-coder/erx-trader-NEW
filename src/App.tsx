/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useCallback } from 'react';
import { DEFAULT_PLANS, SITE_CONFIG } from './config/siteConfig';
import { PageRoute, ServicePlan, SiteSettings, UserAccount } from './types';
import { Header } from './components/navigation/Header';
import { Footer } from './components/footer/Footer';
import { HomePage } from './components/pages/HomePage';
import { AboutPage } from './components/pages/AboutPage';
import { PlansPage } from './components/pages/PlansPage';
import { HowItWorksPage } from './components/pages/HowItWorksPage';
import { FaqPage } from './components/pages/FaqPage';
import { ContactPage } from './components/pages/ContactPage';
import { LegalPage } from './components/pages/LegalPage';
import { NotFoundPage } from './components/pages/NotFoundPage';
import { AuthPage } from './components/portal/AuthPage';
import { ClientDashboard } from './components/portal/ClientDashboard';
import { AdminDashboard } from './components/portal/AdminDashboard';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { apiRequest } from './utils/api';

const VALID_PAGES: PageRoute[] = [
  'home',
  'about',
  'services',
  'plans',
  'how-it-works',
  'faq',
  'contact',
  'terms',
  'privacy',
  'login',
  'register',
  'dashboard',
  'admin',
  'not-found',
];

function resolveInitialPage(): PageRoute {
  const params = new URLSearchParams(window.location.search);
  const refParam = params.get('ref');
  if (refParam) {
    try {
      localStorage.setItem('trustzone_ref_code', refParam.trim().toUpperCase());
    } catch {
      // ignore
    }
  }
  const pageParam = params.get('page');
  if (!pageParam) {
    if (window.location.pathname !== '/' && window.location.pathname !== '/index.html') {
      return 'not-found';
    }
    return 'home';
  }
  if (VALID_PAGES.includes(pageParam as PageRoute)) {
    return pageParam as PageRoute;
  }
  return 'not-found';
}

const STORAGE_TOKEN_KEY = 'rex_traders_auth_token';
const AUTHORIZED_ADMIN_EMAILS = [
  'sulemanadan816@gmail.com',
  'abubakararain104@gmail.com',
  'adangujjar3321@gmail.com',
];

function isOwnerAdmin(account: UserAccount | null): boolean {
  return Boolean(
    account &&
      account.role === 'admin' &&
      AUTHORIZED_ADMIN_EMAILS.includes(account.identifier.toLowerCase())
  );
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageRoute>(resolveInitialPage);
  const [settings, setSettings] = useState<SiteSettings>(SITE_CONFIG);
  const [plans, setPlans] = useState<ServicePlan[]>(DEFAULT_PLANS);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(STORAGE_TOKEN_KEY)
  );
  const [user, setUser] = useState<UserAccount | null>(null);

  const navigate = useCallback((page: PageRoute) => {
    setCurrentPage(page);
    const url = page === 'home' ? '/' : `/?page=${page}`;
    window.history.pushState({ page }, '', url);
  }, []);

  useEffect(() => {
    const onPopState = () => {
      setCurrentPage(resolveInitialPage());
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Dynamically update document title per active page for SEO
  useEffect(() => {
    const titles: Record<PageRoute, string> = {
      home: `${settings.brandName} — Professional Trading Services & Client Portal`,
      about: `About ${settings.brandName} — Operational Standards & Service Principles`,
      services: `Services & Capabilities — ${settings.brandName}`,
      plans: `Service Plans & Packages — ${settings.brandName}`,
      'how-it-works': `How It Works — ${settings.brandName} Onboarding Guide`,
      faq: `Frequently Asked Questions — ${settings.brandName}`,
      contact: `Contact & Official Support — ${settings.brandName}`,
      terms: `Terms & Conditions — ${settings.brandName}`,
      privacy: `Privacy Policy — ${settings.brandName}`,
      login: `Client Portal Sign In — ${settings.brandName}`,
      register: `Create Client Account — ${settings.brandName}`,
      dashboard: `Client Dashboard — ${settings.brandName}`,
      admin: `Administrator Console — ${settings.brandName}`,
      'not-found': `Page Not Found — ${settings.brandName}`,
    };
    document.title = titles[currentPage] || `${settings.brandName}`;
  }, [currentPage, settings.brandName]);

  const loadPublicBootstrap = useCallback(async () => {
    const res = await apiRequest<{ settings?: SiteSettings; plans?: ServicePlan[] }>(
      '/api/public/bootstrap'
    );
    if (!res.ok) return;
    if (res.data?.settings) setSettings(res.data.settings);
    if (Array.isArray(res.data?.plans) && res.data.plans.length > 0) {
      setPlans(res.data.plans);
    }
  }, []);

  useEffect(() => {
    loadPublicBootstrap();
  }, [loadPublicBootstrap]);

  // Verify stored session token on mount
  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const res = await apiRequest<{ user?: UserAccount }>('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        if (!cancelled && res.status === 401) {
          localStorage.removeItem(STORAGE_TOKEN_KEY);
          setToken(null);
          setUser(null);
        }
        return;
      }
      if (!cancelled && res.data?.user) {
        setUser(res.data.user);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleAuthSuccess = (newToken: string, loggedInUser: UserAccount) => {
    localStorage.setItem(STORAGE_TOKEN_KEY, newToken);
    setToken(newToken);
    setUser(loggedInUser);
    if (isOwnerAdmin(loggedInUser) && !selectedPlanId) {
      navigate('admin');
    } else {
      navigate('dashboard');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_TOKEN_KEY);
    setToken(null);
    setUser(null);
    navigate('home');
  };

  const handleSelectPlan = (planId: string) => {
    setSelectedPlanId(planId);
    if (user) {
      navigate('dashboard');
    } else {
      navigate('login');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPageContent = () => {
    switch (currentPage) {
      case 'home':
        return (
          <HomePage
            settings={settings}
            plans={plans}
            user={user}
            onNavigate={navigate}
            onSelectPlan={handleSelectPlan}
          />
        );
      case 'about':
      case 'services':
        return <AboutPage settings={settings} onNavigate={navigate} />;
      case 'plans':
        return (
          <PlansPage
            settings={settings}
            plans={plans}
            onSelectPlan={handleSelectPlan}
            onNavigate={navigate}
          />
        );
      case 'how-it-works':
        return <HowItWorksPage settings={settings} onNavigate={navigate} />;
      case 'faq':
        return <FaqPage settings={settings} />;
      case 'contact':
        return <ContactPage settings={settings} />;
      case 'terms':
        return <LegalPage type="terms" settings={settings} onNavigate={navigate} />;
      case 'privacy':
        return <LegalPage type="privacy" settings={settings} onNavigate={navigate} />;
      case 'login':
        return (
          <AuthPage
            mode="login"
            settings={settings}
            onNavigate={navigate}
            onAuthSuccess={handleAuthSuccess}
          />
        );
      case 'register':
        return (
          <AuthPage
            mode="register"
            settings={settings}
            onNavigate={navigate}
            onAuthSuccess={handleAuthSuccess}
          />
        );
      case 'dashboard':
        if (!user || !token) {
          return (
            <AuthPage
              mode="login"
              settings={settings}
              onNavigate={navigate}
              onAuthSuccess={handleAuthSuccess}
            />
          );
        }
        return (
          <ClientDashboard
            user={user}
            token={token}
            settings={settings}
            plans={plans}
            selectedPlanId={selectedPlanId}
            onNavigate={navigate}
            onLogout={handleLogout}
          />
        );
      case 'admin':
        if (!user || !token) {
          return (
            <AuthPage
              mode="login"
              settings={settings}
              onNavigate={navigate}
              onAuthSuccess={handleAuthSuccess}
            />
          );
        }
        if (!isOwnerAdmin(user)) {
          return (
            <ClientDashboard
              user={user}
              token={token}
              settings={settings}
              plans={plans}
              selectedPlanId={selectedPlanId}
              onNavigate={navigate}
              onLogout={handleLogout}
            />
          );
        }
        return (
          <AdminDashboard
            token={token}
            settings={settings}
            onSettingsUpdated={(updated) => setSettings(updated)}
            onPlansUpdated={loadPublicBootstrap}
            onNavigate={navigate}
          />
        );
      case 'not-found':
      default:
        return <NotFoundPage settings={settings} onNavigate={navigate} />;
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        <Header
          currentPage={currentPage}
          onNavigate={navigate}
          settings={settings}
          user={user}
          onLogout={handleLogout}
        />
        <main className="flex-1">{renderPageContent()}</main>
        <Footer onNavigate={navigate} settings={settings} />
      </div>
    </ErrorBoundary>
  );
}
