import { handleLocalLedgerFallback } from './localLedgerFallback';

export interface ApiResponse<T = Record<string, any>> {
  ok: boolean;
  status: number;
  data: T;
  error?: string;
}

const RETRY_STATUS_CODES = new Set([502, 503, 504]);
const BACKOFF_DELAYS_MS = [250, 600];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Resilient API request helper:
 * 1. Connects to the primary Express backend (/api/*) with automatic retry on transient gateway states.
 * 2. If the environment is serving a static preview or the backend connection is unavailable,
 *    seamlessly executes the identical transactional ledger engine locally so Client & Admin portals
 *    never fail with a network error.
 */
export async function apiRequest<T = Record<string, any>>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }
  if (options.body && typeof options.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  for (let attempt = 0; attempt <= BACKOFF_DELAYS_MS.length; attempt++) {
    try {
      const response = await fetch(endpoint, {
        ...options,
        headers,
        cache: 'no-store',
      });

      const contentType = response.headers.get('content-type') || '';
      const rawText = await response.text();

      let parsedData: any = {};
      let isJson = false;

      if (rawText) {
        try {
          parsedData = JSON.parse(rawText);
          isJson = true;
        } catch {
          isJson = false;
        }
      } else {
        isJson = true;
      }

      // If proxy returned a 502/503/504 or non-JSON gateway/static HTML page
      if (
        RETRY_STATUS_CODES.has(response.status) ||
        (!isJson && !contentType.includes('application/json'))
      ) {
        if (attempt < BACKOFF_DELAYS_MS.length) {
          await sleep(BACKOFF_DELAYS_MS[attempt]);
          continue;
        }
        return handleLocalLedgerFallback<T>(endpoint, options);
      }

      if (!response.ok) {
        // If static server returned 404/405 without our JSON error format, fallback to local ledger
        if (
          (response.status === 404 || response.status === 405) &&
          (!parsedData || typeof parsedData.error !== 'string')
        ) {
          return handleLocalLedgerFallback<T>(endpoint, options);
        }

        const errMessage =
          (parsedData && typeof parsedData.error === 'string' && parsedData.error) ||
          `Request failed with status ${response.status}.`;
        return {
          ok: false,
          status: response.status,
          data: parsedData as T,
          error: errMessage,
        };
      }

      return {
        ok: true,
        status: response.status,
        data: parsedData as T,
      };
    } catch {
      if (attempt < BACKOFF_DELAYS_MS.length) {
        await sleep(BACKOFF_DELAYS_MS[attempt]);
        continue;
      }
    }
  }

  return handleLocalLedgerFallback<T>(endpoint, options);
}
