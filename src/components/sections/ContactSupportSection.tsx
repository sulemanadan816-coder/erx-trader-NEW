import React, { useState } from 'react';
import { Check, Copy, ExternalLink, Send } from 'lucide-react';
import { SiteSettings } from '../../types';
import { apiRequest } from '../../utils/api';

interface ContactSupportSectionProps {
  settings: SiteSettings;
  showInquiryForm?: boolean;
}

export const ContactSupportSection: React.FC<ContactSupportSectionProps> = ({
  settings,
  showInquiryForm = true,
}) => {
  const [copied, setCopied] = useState(false);
  const [name, setName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const handleCopyEasypaisa = async () => {
    try {
      await navigator.clipboard.writeText(settings.easypaisaNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const el = document.createElement('textarea');
      el.value = settings.easypaisaNumber;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleSubmitInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (name.trim().length < 2) {
      setFormError('Please enter your full name (at least 2 characters).');
      return;
    }
    if (contactInfo.trim().length < 4) {
      setFormError('Please provide your Telegram username, WhatsApp number, or email.');
      return;
    }
    if (subject.trim().length < 3) {
      setFormError('Please enter a brief subject for your inquiry.');
      return;
    }
    if (message.trim().length < 10) {
      setFormError('Please enter a clear message (at least 10 characters).');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiRequest<{ message?: string; error?: string }>('/api/inquiries', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          contactInfo: contactInfo.trim(),
          subject: subject.trim(),
          message: message.trim(),
        }),
      });
      if (!res.ok) {
        setFormError(res.error || 'Could not submit your inquiry. Please try again.');
      } else {
        setFormSuccess(
          res.data?.message ||
            'Your message has been submitted to REX TRADERS support. You can also reach us directly on Telegram.'
        );
        setName('');
        setContactInfo('');
        setSubject('');
        setMessage('');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="py-16 sm:py-24 bg-[#080c14] border-t border-[#cba352]/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-12">
          <p className="text-xs font-semibold text-[#cba352] uppercase tracking-wider mb-2">
            Official Communication &amp; Payment Channels
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Connect with {settings.brandName} Support
          </h2>
          <p className="mt-3 text-base text-slate-300 leading-relaxed">
            Use our verified Telegram desk for direct support, join our official WhatsApp Channel for
            service announcements, or copy our official Easypaisa number for plan payments.
          </p>
        </div>

        {/* 3 Official Channel Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Telegram Support */}
          <div className="bg-[#0e1424] border border-[#cba352]/25 rounded-2xl p-6 sm:p-7 flex flex-col justify-between shadow-xl">
            <div>
              <div className="text-xs text-[#f8e7a1] mb-2 font-mono">
                <span>Direct Support Desk · {settings.telegramHandle}</span>
              </div>
              <h3 className="text-lg font-bold text-white">Telegram Support</h3>
              <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                Message our support team directly on Telegram for plan inquiries, onboarding
                assistance, and payment verification follow-ups.
              </p>
              <div className="mt-4 py-2 px-3 bg-[#080c14] border border-slate-800 rounded-lg font-mono text-xs text-slate-300 break-all">
                {settings.telegramSupportUrl}
              </div>
            </div>
            <div className="mt-6">
              <a
                href={settings.telegramSupportUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full btn-gold py-3 px-4 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider"
              >
                <span>CONTACT TELEGRAM SUPPORT</span>
                <ExternalLink className="w-4 h-4 shrink-0" />
              </a>
            </div>
          </div>

          {/* Card 2: WhatsApp Channel */}
          <div className="bg-[#0e1424] border border-[#cba352]/25 rounded-2xl p-6 sm:p-7 flex flex-col justify-between shadow-xl">
            <div>
              <div className="text-xs text-emerald-400 mb-2 font-mono">
                <span>Official Broadcasts · WhatsApp Updates</span>
              </div>
              <h3 className="text-lg font-bold text-white">WhatsApp Channel</h3>
              <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                Follow the official {settings.brandName} WhatsApp Channel to receive timely updates,
                schedule notices, and important service announcements.
              </p>
              <div className="mt-4 py-2 px-3 bg-[#080c14] border border-slate-800 rounded-lg font-mono text-xs text-slate-300 truncate">
                {settings.whatsappChannelUrl}
              </div>
            </div>
            <div className="mt-6">
              <a
                href={settings.whatsappChannelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 text-xs font-bold uppercase tracking-wider text-white bg-emerald-700 hover:bg-emerald-600 rounded-xl transition-colors whitespace-nowrap"
              >
                <span>JOIN WHATSAPP CHANNEL</span>
                <ExternalLink className="w-4 h-4 shrink-0" />
              </a>
            </div>
          </div>

          {/* Card 3: Easypaisa Payment Details */}
          <div className="bg-[#0e1424] border border-[#cba352]/25 rounded-2xl p-6 sm:p-7 flex flex-col justify-between shadow-xl">
            <div>
              <div className="text-xs text-[#cba352] mb-2 font-mono">
                <span>Official Payment Account · Manual Verification</span>
              </div>
              <h3 className="text-lg font-bold text-white">Easypaisa Account</h3>
              <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                Use the official Easypaisa number below for plan payments. After transfer, submit
                your Transaction ID in the Client Portal for admin verification.
              </p>
              <div className="mt-4 py-2.5 px-3.5 bg-[#080c14] border border-slate-800 rounded-lg flex items-center justify-between">
                <span className="text-xs text-slate-400">Easypaisa</span>
                <span className="font-mono tabular-nums text-base font-bold text-[#f8e7a1] tracking-wider">
                  {settings.easypaisaNumber}
                </span>
              </div>
            </div>
            <div className="mt-6">
              <button
                type="button"
                onClick={handleCopyEasypaisa}
                className="w-full btn-gold-ghost py-3 px-4 inline-flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>COPIED: {settings.easypaisaNumber}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 shrink-0" />
                    <span>COPY EASYPAISA NUMBER</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Optional Direct Support Inquiry Form */}
        {showInquiryForm && (
          <div className="mt-12 bg-[#0e1424] border border-[#cba352]/25 rounded-2xl p-6 sm:p-8 shadow-xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-5 space-y-3">
                <h3 className="text-xl font-bold text-white">
                  Send a Support or Onboarding Message
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Have a question regarding plan selection, account access, or payment submission?
                  Submit a ticket below and our administrator will review it in the support desk.
                </p>
                <div className="pt-2 space-y-2 text-xs text-slate-400">
                  <p>
                    For the fastest response, reach out directly via Telegram:{' '}
                    <a
                      href={settings.telegramSupportUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-[#cba352] hover:underline"
                    >
                      {settings.telegramHandle}
                    </a>
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmitInquiry} className="lg:col-span-7 space-y-4" noValidate>
                {formError && (
                  <div
                    role="alert"
                    className="p-3.5 rounded-lg bg-red-950/70 border border-red-700/60 text-xs font-medium text-red-200"
                  >
                    {formError}
                  </div>
                )}
                {formSuccess && (
                  <div
                    role="status"
                    className="p-3.5 rounded-lg bg-emerald-950/70 border border-emerald-700/60 text-xs font-medium text-emerald-200"
                  >
                    {formSuccess}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="inquiry-name"
                      className="block text-xs font-semibold text-slate-300 mb-1.5"
                    >
                      Full Name
                    </label>
                    <input
                      id="inquiry-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                      required
                      className="w-full px-3.5 py-2.5 text-sm bg-[#080c14] border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-[#cba352]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="inquiry-contact"
                      className="block text-xs font-semibold text-slate-300 mb-1.5"
                    >
                      Telegram Username / Phone / Email
                    </label>
                    <input
                      id="inquiry-contact"
                      type="text"
                      value={contactInfo}
                      onChange={(e) => setContactInfo(e.target.value)}
                      placeholder="@username or 03XX-XXXXXXX"
                      required
                      className="w-full px-3.5 py-2.5 text-sm bg-[#080c14] border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-[#cba352]"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="inquiry-subject"
                    className="block text-xs font-semibold text-slate-300 mb-1.5"
                  >
                    Subject
                  </label>
                  <input
                    id="inquiry-subject"
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Plan details, onboarding, or payment verification question"
                    required
                    className="w-full px-3.5 py-2.5 text-sm bg-[#080c14] border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-[#cba352]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="inquiry-message"
                    className="block text-xs font-semibold text-slate-300 mb-1.5"
                  >
                    Message
                  </label>
                  <textarea
                    id="inquiry-message"
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Write your question or request clearly..."
                    required
                    className="w-full px-3.5 py-2.5 text-sm bg-[#080c14] border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-[#cba352]"
                  />
                </div>

                <div className="flex items-center justify-end">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-gold py-2.5 px-6 text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submitting ? 'Submitting Inquiry...' : 'Submit Support Inquiry'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
