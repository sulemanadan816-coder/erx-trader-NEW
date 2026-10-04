import React, { useState } from 'react';
import { Zap } from 'lucide-react';
import { SITE_CONFIG } from '../../config/siteConfig';

interface BrandLogoProps {
  logoUrl?: string | null;
  brandName?: string;
  variant?: 'dark' | 'light';
  showPlaceholderHint?: boolean;
}

/**
 * TrustZone Official Brand Logo Component
 * - Displays the TrustZone emblem with golden lightning mark and luxury typography
 * - Preserves uploaded image if specified, otherwise renders TrustZone signature lockup
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({
  logoUrl = SITE_CONFIG.logoUrl,
  brandName = SITE_CONFIG.brandName,
}) => {
  const [imgError, setImgError] = useState(false);

  const effectiveLogo = logoUrl || SITE_CONFIG.logoUrl;
  const hasValidLogo = Boolean(effectiveLogo && !imgError);

  if (hasValidLogo) {
    return (
      <span className="inline-flex items-center gap-2.5 select-none">
        <img
          src={effectiveLogo!}
          alt={SITE_CONFIG.logoAlt}
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl object-contain shrink-0 shadow-md"
        />
        <span className="text-lg sm:text-xl font-extrabold tracking-tight text-white whitespace-nowrap">
          {brandName}
        </span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2.5 select-none group">
      <span
        aria-hidden="true"
        className="inline-flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-[#f8e7a1] via-[#cba352] to-[#8c6a25] p-0.5 shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform shrink-0"
      >
        <span className="w-full h-full bg-[#0a0f1d] rounded-[10px] flex items-center justify-center">
          <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-[#f8e7a1] fill-[#cba352]" />
        </span>
      </span>
      <span className="text-lg sm:text-xl font-extrabold tracking-tight text-white whitespace-nowrap flex items-center">
        <span>Trust</span>
        <span className="text-[#cba352]">Zone</span>
      </span>
    </span>
  );
};

