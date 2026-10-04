import React from 'react';
import { PageRoute, SiteSettings } from '../../types';

interface LegalPageProps {
  type: 'terms' | 'privacy';
  settings: SiteSettings;
  onNavigate: (page: PageRoute) => void;
}

export const LegalPage: React.FC<LegalPageProps> = ({ type, settings, onNavigate }) => {
  const isTerms = type === 'terms';

  return (
    <section className="py-14 sm:py-20 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-xs text-slate-500 mb-2">
          <span>{settings.brandName}</span>
          <span aria-hidden="true"> · </span>
          <span>Legal Documentation</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
          {isTerms ? 'Terms & Conditions' : 'Privacy Policy'}
        </h1>

        <div className="mt-4 flex items-center gap-2 p-1 bg-slate-100 rounded-lg w-fit">
          <button
            type="button"
            onClick={() => onNavigate('terms')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer ${
              isTerms ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'
            }`}
          >
            Terms &amp; Conditions
          </button>
          <button
            type="button"
            onClick={() => onNavigate('privacy')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer ${
              !isTerms ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'
            }`}
          >
            Privacy Policy
          </button>
        </div>

        {isTerms ? (
          <div className="mt-8 space-y-6 text-sm text-slate-600 leading-relaxed">
            <div>
              <h2 className="text-base font-bold text-slate-900 mb-2">
                1. Overview of Services
              </h2>
              <p>
                {settings.brandName} provides structured trading service packages, session
                briefings, community announcements, and client support through our official Telegram
                support desk ({settings.telegramHandle}) and official WhatsApp Channel. By using
                this website or registering an account, you agree to these Terms &amp; Conditions.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900 mb-2">
                2. No Guaranteed Returns or Financial Promises
              </h2>
              <p>
                All trading and financial market activities involve inherent risk.{' '}
                {settings.brandName} does not guarantee profits, fixed returns, or specific
                financial outcomes. Users are solely responsible for their own trading and financial
                decisions.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900 mb-2">
                3. Payment &amp; Manual Verification Policy
              </h2>
              <p>
                Service plan payments made via Easypaisa ({settings.easypaisaNumber}) must be
                submitted with a valid Transaction ID (TID) and sender number through the Client
                Portal or verified directly with support. All submitted transactions remain in{' '}
                <strong>Pending</strong> status until manually verified and approved by a{' '}
                {settings.brandName} administrator.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900 mb-2">
                4. Official Communication Channels
              </h2>
              <p>
                {settings.brandName} communicates exclusively through the official Telegram link (
                <a
                  href={settings.telegramSupportUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-900 underline"
                >
                  {settings.telegramSupportUrl}
                </a>
                ) and the official WhatsApp Channel (
                <a
                  href={settings.whatsappChannelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-900 underline"
                >
                  {settings.whatsappChannelUrl}
                </a>
                ). We are not responsible for interactions with unauthorized third-party accounts.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900 mb-2">
                5. Account Conduct &amp; Access
              </h2>
              <p>
                Users must provide accurate information when registering an account or submitting a
                payment transaction reference. Submitting fraudulent or duplicate Transaction IDs
                may result in rejection of the transaction or suspension of portal access.
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-8 space-y-6 text-sm text-slate-600 leading-relaxed">
            <div>
              <h2 className="text-base font-bold text-slate-900 mb-2">
                1. Information We Collect
              </h2>
              <p>
                {settings.brandName} collects only the minimum information required to provide
                account access, process manual payment verifications, and respond to support
                inquiries. This includes your name, login identifier (email or phone number),
                submitted Easypaisa Transaction IDs, and support messages.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900 mb-2">
                2. How We Use Your Information
              </h2>
              <p>
                We use the information you submit solely to:
                <br />— Verify your Easypaisa payment references against our official account (
                {settings.easypaisaNumber}).
                <br />— Activate and manage your selected {settings.brandName} service plan.
                <br />— Respond to your support inquiries via our portal or Telegram support desk.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900 mb-2">
                3. Data Security &amp; Storage
              </h2>
              <p>
                Account passwords are encrypted using cryptographic hashing before storage. Access
                to administrative verification tools is restricted strictly to authorized{' '}
                {settings.brandName} administrators.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900 mb-2">
                4. Third-Party Links
              </h2>
              <p>
                Our website links directly to our official Telegram support account and official
                WhatsApp Channel. When you follow those links, your interactions on Telegram or
                WhatsApp are governed by their respective platform privacy policies.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900 mb-2">
                5. Contact Regarding Privacy
              </h2>
              <p>
                If you have questions about your account data or wish to update your details, please
                contact us via our Contact page or directly on Telegram at{' '}
                <a
                  href={settings.telegramSupportUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-900 underline"
                >
                  {settings.telegramSupportUrl}
                </a>
                .
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
