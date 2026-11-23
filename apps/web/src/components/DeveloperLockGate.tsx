'use client';

import React, { useEffect, useState } from 'react';
import { Lock, Wrench } from 'lucide-react';
import { colors } from '@vagrova/ui';

// Toggle to `false` when ready to reopen the app to clients & public
const DEV_LOCK_ENABLED = true;

export default function DeveloperLockGate({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState(!DEV_LOCK_ENABLED);
  const [checked, setChecked] = useState(!DEV_LOCK_ENABLED);

  useEffect(() => {
    if (!DEV_LOCK_ENABLED || typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const devParam = params.get('dev');
    if (devParam === 'unlock') {
      sessionStorage.setItem('vagrova_dev_unlocked', '1');
      setUnlocked(true);
    } else if (devParam === 'lock') {
      sessionStorage.removeItem('vagrova_dev_unlocked');
      setUnlocked(false);
    } else if (sessionStorage.getItem('vagrova_dev_unlocked') === '1') {
      setUnlocked(true);
    }
    setChecked(true);
  }, []);

  if (!DEV_LOCK_ENABLED || unlocked) {
    return <>{children}</>;
  }

  if (!checked) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: colors.asphalt,
        }}
      />
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: `radial-gradient(circle at 50% 28%, #107E8B 0%, ${colors.asphalt} 52%, #06383E 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          backgroundColor: colors.roadWhite,
          borderRadius: '20px',
          padding: '30px 24px',
          textAlign: 'center',
          boxShadow: '0 24px 56px rgba(4, 24, 28, 0.35)',
        }}
      >
        <img
          src="/vagrova-logo.png"
          alt="VAGROVA"
          style={{
            height: '28px',
            width: 'auto',
            margin: '0 auto 20px',
            display: 'block',
            mixBlendMode: 'multiply',
          }}
        />

        <div
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '18px',
            backgroundColor: colors.waybillPaper,
            border: `1.5px solid ${colors.asphalt}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}
        >
          <Lock size={26} color={colors.asphalt} />
        </div>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: colors.safetyAmber,
            color: colors.asphalt,
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            fontWeight: 800,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            padding: '4px 10px',
            borderRadius: '999px',
            marginBottom: '12px',
          }}
        >
          <Wrench size={12} />
          <span>Maintenance Mode</span>
        </div>

        <h1
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '24px',
            fontWeight: 800,
            color: colors.asphalt,
            marginBottom: '8px',
            lineHeight: 1.2,
          }}
        >
          App Locked to Developer
        </h1>

        <p
          style={{
            fontSize: '14px',
            color: colors.gravelGrey,
            lineHeight: 1.55,
            margin: 0,
          }}
        >
          Vagrova is currently undergoing active development and final system updates. Access will reopen as soon as this release is complete.
        </p>
      </div>
    </div>
  );
}
