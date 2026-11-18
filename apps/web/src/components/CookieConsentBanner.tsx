'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { colors } from '@vagrova/ui';

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem('vagrova_cookie_consent');
    if (!saved) {
      setVisible(true);
    }
  }, []);

  const choose = (choice: 'essential' | 'all') => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('vagrova_cookie_consent', choice);
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie and storage consent"
      style={{
        position: 'fixed',
        bottom: '78px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - 24px)',
        maxWidth: '406px',
        zIndex: 85,
        backgroundColor: colors.roadWhite,
        border: `1.5px solid ${colors.asphalt}`,
        borderRadius: '12px',
        padding: '12px 14px',
        boxShadow: '0 10px 28px rgba(8, 77, 85, 0.18)',
      }}
    >
      <div style={{ fontSize: '12px', fontWeight: 800, color: colors.asphalt, marginBottom: '4px' }}>
        Your Privacy &amp; Storage Choices
      </div>
      <p style={{ fontSize: '11px', color: colors.gravelGrey, lineHeight: 1.45, marginBottom: '10px' }}>
        Vagrova uses essential storage to keep you signed in and run offline. Zero ad trackers.{' '}
        <Link href="/legal?tab=cookies" style={{ color: colors.asphalt, fontWeight: 700, textDecoration: 'underline' }}>
          Cookie Policy
        </Link>
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <button
          onClick={() => choose('essential')}
          style={{
            height: '36px',
            backgroundColor: colors.waybillPaper,
            color: colors.asphalt,
            border: `1px solid ${colors.grey300}`,
            borderRadius: '8px',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Essential Only
        </button>
        <button
          onClick={() => choose('all')}
          style={{
            height: '36px',
            backgroundColor: colors.asphalt,
            color: colors.safetyAmber,
            border: 'none',
            borderRadius: '8px',
            fontSize: '11px',
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          Accept All
        </button>
      </div>
    </div>
  );
}
