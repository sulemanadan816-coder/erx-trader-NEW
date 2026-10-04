import React, { useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { DEFAULT_FAQS } from '../../config/siteConfig';
import { SiteSettings } from '../../types';
import { ContactSupportSection } from '../sections/ContactSupportSection';

interface FaqPageProps {
  settings: SiteSettings;
}

export const FaqPage: React.FC<FaqPageProps> = ({ settings }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [openId, setOpenId] = useState<string | null>(DEFAULT_FAQS[0]?.id || null);

  const categories = ['All', ...Array.from(new Set(DEFAULT_FAQS.map((f) => f.category)))];

  const filteredFaqs = DEFAULT_FAQS.filter((item) => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      item.question.toLowerCase().includes(q) ||
      item.answer.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  return (
    <div>
      <section className="py-14 sm:py-20 bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-xs text-slate-500 mb-2">
            <span>Help Center</span>
            <span aria-hidden="true"> · </span>
            <span>Frequently Asked Questions</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            {settings.brandName} — FAQ
          </h1>
          <p className="mt-3 text-base text-slate-600 leading-relaxed">
            Clear answers regarding our service plans, official Telegram and WhatsApp channels, and
            manual Easypaisa payment verification.
          </p>

          {/* Search & Interactive Category Filter Controls */}
          <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search questions..."
                aria-label="Search frequently asked questions"
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          {/* Accordion List */}
          <div className="mt-8 space-y-3">
            {filteredFaqs.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl">
                <p className="text-sm font-semibold text-slate-900">
                  No matching questions found.
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  Try clearing your search filter or contact us directly on Telegram (
                  {settings.telegramHandle}).
                </p>
              </div>
            ) : (
              filteredFaqs.map((faq) => {
                const isOpen = openId === faq.id;
                return (
                  <div
                    key={faq.id}
                    className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenId(isOpen ? null : faq.id)}
                      aria-expanded={isOpen}
                      className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 hover:bg-slate-100/70 transition-colors cursor-pointer"
                    >
                      <div>
                        <div className="text-xs text-slate-500 mb-1">{faq.category}</div>
                        <div className="text-base font-bold text-slate-900">{faq.question}</div>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-500 shrink-0 transition-transform duration-150 ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-6 pb-5 pt-1 text-sm text-slate-600 leading-relaxed border-t border-slate-200/60">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      <ContactSupportSection settings={settings} showInquiryForm={false} />
    </div>
  );
};
