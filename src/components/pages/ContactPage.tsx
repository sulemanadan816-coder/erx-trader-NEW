import React from 'react';
import { SiteSettings } from '../../types';
import { ContactSupportSection } from '../sections/ContactSupportSection';

interface ContactPageProps {
  settings: SiteSettings;
}

export const ContactPage: React.FC<ContactPageProps> = ({ settings }) => {
  return (
    <div className="bg-[#080c14] text-slate-100 min-h-screen">
      <section className="py-14 sm:py-20 bg-[#0b101d] border-b border-[#cba352]/20 relative overflow-hidden">
        <div className="tz-stage-blob-1" aria-hidden="true" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#cba352]/15 border border-[#cba352]/30 text-[#f8e7a1] text-xs font-semibold uppercase tracking-wider mb-3">
              <span>Support &amp; Official Inquiries</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              Contact &amp; Client Support
            </h1>
            <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed">
              Reach out to {settings.brandName} through our verified Telegram support account, join
              our official WhatsApp Channel for updates, or submit a support message below.
            </p>
          </div>
        </div>
      </section>

      <ContactSupportSection settings={settings} showInquiryForm={true} />
    </div>
  );
};
