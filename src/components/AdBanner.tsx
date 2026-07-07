import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';

const COOKIE_NAME = 'meuracha_cc_cookie';

function hasAdConsent(): boolean {
  if (typeof document === 'undefined') return false;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]*)`));
  if (!match) return false;
  try {
    const parsed = JSON.parse(decodeURIComponent(match[1]));
    // Check if advertisement category was accepted
    return parsed?.categories?.advertisement === true;
  } catch {
    return false;
  }
}

interface Props {
  className?: string;
  slot: string;
  format?: 'auto' | 'rectangle' | 'horizontal';
}

export function AdBanner({ className = '', slot, format = 'auto' }: Props) {
  const [consented, setConsented] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setConsented(hasAdConsent());
  }, []);

  useEffect(() => {
    if (!consented) return;

    // Re-check consent status periodically (cookie might update)
    const interval = setInterval(() => {
      setConsented(hasAdConsent());
    }, 2000);

    return () => clearInterval(interval);
  }, [consented]);

  // Push to adsbygoogle when rendered
  useEffect(() => {
    if (!consented || !mounted) return;

    const timer = setTimeout(() => {
      try {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      } catch {
        // Silently fail — AdSense may not be loaded yet
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [consented, mounted, slot]);

  if (!mounted || !consented) return null;

  return (
    <div className={`flex justify-center overflow-hidden ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-0000000000000000" // ← substituir pelo ID real
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
