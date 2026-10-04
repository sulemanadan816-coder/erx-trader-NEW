import React from 'react';
import { SITE_CONFIG } from '../../config/siteConfig';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || 'An unexpected application error occurred.',
    };
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white border border-slate-200 rounded-xl p-6 sm:p-8 text-center">
            <div className="font-mono text-xs font-semibold text-red-700 mb-2">
              Error 500 · Application Recovery
            </div>
            <h1 className="text-xl font-bold text-slate-900">
              Something went wrong while rendering this view
            </h1>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              {SITE_CONFIG.brandName} encountered an unexpected state. You can safely reload the
              page or contact Telegram support ({SITE_CONFIG.telegramHandle}).
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  this.setState({ hasError: false, errorMessage: '' });
                  window.location.href = '/';
                }}
                className="px-4 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                Return to Homepage
              </button>
              <a
                href={SITE_CONFIG.telegramSupportUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Telegram Support
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
