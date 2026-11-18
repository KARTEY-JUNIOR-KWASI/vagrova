'use client';

import React, { useEffect, useState } from 'react';
import { colors } from '@vagrova/ui';

interface OnboardingHeroProps {
  onGetStarted: () => void;
  onDriverPortal?: () => void;
}

/** Centered VAGROVA wordmark with tight viewBox so it sits 100% dead-center like Yango. */
function VagrovaBrandMark() {
  return (
    <svg
      viewBox="0 0 256 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '230px', maxWidth: '64vw', height: 'auto', display: 'block' }}
      aria-label="VAGROVA"
    >
      <path d="M8 10L23 52L30 38L19 10H8Z" fill={colors.safetyAmber} />
      <path d="M36 10L23 52L30 52L47 10H36Z" fill="#FFFFFF" />
      <text
        x="50"
        y="48"
        fill="#FFFFFF"
        fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
        fontWeight="900"
        fontSize="44"
        letterSpacing="2"
      >
        AGROVA
      </text>
    </svg>
  );
}

export default function OnboardingHero({ onGetStarted }: OnboardingHeroProps) {
  const [logoMounted, setLogoMounted] = useState(false);

  useEffect(() => {
    const mountFrame = requestAnimationFrame(() => setLogoMounted(true));
    const doneTimer = setTimeout(() => onGetStarted(), 1900);

    return () => {
      cancelAnimationFrame(mountFrame);
      clearTimeout(doneTimer);
    };
  }, [onGetStarted]);

  return (
    <div
      onClick={onGetStarted}
      style={{
        flex: 1,
        minHeight: '100vh',
        backgroundColor: colors.asphalt,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          transform: logoMounted ? 'scale(1)' : 'scale(0.42)',
          opacity: logoMounted ? 1 : 0,
          transition:
            'transform 620ms cubic-bezier(0.22, 1, 0.36, 1), opacity 480ms cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        <VagrovaBrandMark />
      </div>
    </div>
  );
}
