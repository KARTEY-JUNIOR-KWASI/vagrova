'use client';

import React, { useEffect, useState } from 'react';
import { Download, Share, X } from 'lucide-react';
import { colors } from '@vagrova/ui';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PwaManager() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosTip, setShowIosTip] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Register Service Worker for offline shell & Android Chrome PWA installability
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    // Never show install banner if already running in standalone app mode or dismissed recently
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    const wasDismissed = localStorage.getItem('vagrova_pwa_dismissed') === '1';

    if (isStandalone || wasDismissed) {
      setDismissed(true);
      return;
    }

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);

    // Detect iOS Safari (no beforeinstallprompt event)
    const ua = window.navigator.userAgent;
    const isIos = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
    if (isIos && isSafari) {
      setShowIosTip(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
    };
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    setDeferredPrompt(null);
    setShowIosTip(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('vagrova_pwa_dismissed', '1');
    }
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      handleDismiss();
    }
    setDeferredPrompt(null);
  };

  if (dismissed || (!deferredPrompt && !showIosTip)) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: '10px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - 24px)',
        maxWidth: '406px',
        zIndex: 90,
        backgroundColor: colors.asphalt,
        color: colors.roadWhite,
        borderRadius: '14px',
        padding: '10px 12px',
        boxShadow: '0 10px 28px rgba(8, 77, 85, 0.28)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        border: `1px solid rgba(255, 198, 0, 0.35)`,
      }}
    >
      <img
        src="/icons/icon-192.png"
        alt="Vagrova"
        style={{ width: '34px', height: '34px', borderRadius: '8px', flexShrink: 0 }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '12px', fontWeight: 800, lineHeight: 1.2 }}>
          Install Vagrova App
        </div>
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.82)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
          {deferredPrompt ? (
            'Open full-screen from your home screen'
          ) : (
            <>
              <span>Tap</span>
              <Share size={12} color={colors.safetyAmber} />
              <span>then &ldquo;Add to Home Screen&rdquo;</span>
            </>
          )}
        </div>
      </div>

      {deferredPrompt && (
        <button
          onClick={handleInstall}
          style={{
            backgroundColor: colors.safetyAmber,
            color: colors.asphalt,
            border: 'none',
            borderRadius: '8px',
            padding: '7px 10px',
            fontSize: '11px',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <Download size={13} />
          <span>Install</span>
        </button>
      )}

      <button
        onClick={handleDismiss}
        aria-label="Dismiss install prompt"
        style={{
          background: 'none',
          border: 'none',
          color: 'rgba(255,255,255,0.72)',
          padding: '4px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
}
