import React from 'react';
import { PageRoute, ServicePlan, SiteSettings, UserAccount } from '../../types';
import { HeroSection } from '../sections/HeroSection';
import { PlansSection } from '../sections/PlansSection';
import { InvestmentCalculator } from '../sections/InvestmentCalculator';
import { ReferralSection } from '../sections/ReferralSection';
import { ContactSupportSection } from '../sections/ContactSupportSection';

interface HomePageProps {
  settings: SiteSettings;
  plans: ServicePlan[];
  user?: UserAccount | null;
  onNavigate: (page: PageRoute) => void;
  onSelectPlan: (planId: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  settings,
  plans,
  user = null,
  onNavigate,
  onSelectPlan,
}) => {
  return (
    <div className="bg-[#080c14] text-slate-100 min-h-screen">
      {/* 1. TrustZone Hero Section */}
      <HeroSection settings={settings} user={user} onNavigate={onNavigate} />

      {/* 2. TrustZone 12 Investment Plans */}
      <PlansSection
        plans={plans}
        settings={settings}
        onSelectPlan={onSelectPlan}
        onNavigate={onNavigate}
      />

      {/* 3. Interactive Investment Returns Calculator */}
      <InvestmentCalculator plans={plans} onSelectPlan={onSelectPlan} />

      {/* 4. Multi-Tier Referral Program */}
      <ReferralSection user={user} onNavigateLogin={() => onNavigate('login')} />

      {/* 5. Support & Direct Assistance */}
      <ContactSupportSection settings={settings} />
    </div>
  );
};
