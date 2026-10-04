import React from 'react';
import { PageRoute, SiteSettings } from '../../types';

interface NotFoundPageProps {
  settings: SiteSettings;
  onNavigate: (page: PageRoute) => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ settings, onNavigate }) => {
  return (
    <section className="py-20 sm:py-28 bg-white">
      <div className="max-w-xl mx-auto px-4 sm:px-6 text-center">
        <div className="font-mono text-xs font-semibold text-slate-500 mb-2">
          Error 404 · Page Not Found
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          The requested page could not be found
        </h1>
        <p className="mt-3 text-sm text-slate-600 leading-relaxed">
          The link you followed may be outdated or the page does not exist on {settings.brandName}.
          Use the actions below to return to our homepage or contact support.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            Return to Homepage
          </button>
          <button
            type="button"
            onClick={() => onNavigate('contact')}
            className="px-5 py-2.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Contact Support
          </button>
        </div>
      </div>
    </section>
  );
};
