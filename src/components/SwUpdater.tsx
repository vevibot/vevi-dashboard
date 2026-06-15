'use client';
import { useEffect, useState } from 'react';
import { RotateCw } from 'lucide-react';

/**
 * Service-worker update banner. Listens for `controllerchange` events fired
 * by workbox when a new SW takes control (because of skipWaiting+clientsClaim
 * configured in next.config.js). When a new version is detected, prompts the
 * user to reload — one tap and they're on fresh code.
 */
export function SwUpdater() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    let reloaded = false;
    const onChange = () => {
      if (reloaded) return;
      reloaded = true;
      setShow(true);
    };

    navigator.serviceWorker.addEventListener('controllerchange', onChange);

    // Also poll: ask the SW to check for updates every 60s while the tab is open
    const interval = setInterval(() => {
      navigator.serviceWorker.getRegistration()
        .then(reg => reg?.update())
        .catch(() => {});
    }, 60_000);

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onChange);
      clearInterval(interval);
    };
  }, []);

  if (!show) return null;

  return (
    <div className="fixed bottom-4 inset-x-4 md:bottom-6 md:right-6 md:left-auto md:w-80 z-[100] bg-surface border border-green/40 rounded-xl px-4 py-3 shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
      <RotateCw size={18} className="text-green shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-text text-sm font-sans font-medium">New version available</p>
        <p className="text-muted text-xs font-sans">Tap to reload with the latest update.</p>
      </div>
      <button
        onClick={() => window.location.reload()}
        className="bg-green text-bg text-xs font-sans font-semibold px-3 py-1.5 rounded-lg hover:bg-green/90 active:scale-95 transition shrink-0"
      >
        Reload
      </button>
    </div>
  );
}
