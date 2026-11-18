'use client';

import React, { useEffect, useState } from 'react';
import { colors } from '@vagrova/ui';

interface OnboardingHeroProps {
  onGetStarted: () => void;
  onDriverPortal?: () => void;
}

/** Real VAGROVA company wordmark (Safety Gold V-accent + crisp white letters, zero background box). */
function VagrovaBrandMark({ width = 210 }: { width?: number }) {
  return (
    <svg
      viewBox="0 0 360 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: `${width}px`, maxWidth: '62vw', height: 'auto', display: 'block' }}
      aria-label="VAGROVA"
    >
      <path d="M12 10L27 52L34 38L23 10H12Z" fill={colors.safetyAmber} />
      <path d="M40 10L27 52L34 52L51 10H40Z" fill="#FFFFFF" />
      <text
        x="56"
        y="48"
        fill="#FFFFFF"
        fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
        fontWeight="900"
        fontSize="44"
        letterSpacing="2.5"
      >
        AGROVA
      </text>
    </svg>
  );
}

export default function OnboardingHero({ onGetStarted }: OnboardingHeroProps) {
  const [logoMounted, setLogoMounted] = useState(false);
  const [gliding, setGliding] = useState(false);

  useEffect(() => {
    const mountFrame = requestAnimationFrame(() => setLogoMounted(true));
    const glideTimer = setTimeout(() => setGliding(true), 1750);
    const doneTimer = setTimeout(() => onGetStarted(), 2450);

    return () => {
      cancelAnimationFrame(mountFrame);
      clearTimeout(glideTimer);
      clearTimeout(doneTimer);
    };
  }, [onGetStarted]);

  return (
    <div
      onClick={onGetStarted}
      style={{
        flex: 1,
        minHeight: '100vh',
        background: `radial-gradient(circle at 50% 42%, #107E8B 0%, ${colors.asphalt} 52%, #06383E 100%)`,
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
      }}
    >
      {/* Shared-Element Brand Logo Transition: Center Scale-Up -> Top-Left Glide -> Login */}
      <div
        style={{
          position: 'absolute',
          zIndex: 10,
          top: gliding ? '20px' : '50%',
          left: gliding ? '18px' : '50%',
          transform: gliding
            ? 'translate(0%, 0%) scale(0.74)'
            : logoMounted
            ? 'translate(-50%, -50%) scale(1.12)'
            : 'translate(-50%, -50%) scale(0.38)',
          transformOrigin: gliding ? 'top left' : 'center center',
          opacity: logoMounted ? 1 : 0,
          transition:
            'top 650ms cubic-bezier(0.22, 1, 0.36, 1), left 650ms cubic-bezier(0.22, 1, 0.36, 1), transform 650ms cubic-bezier(0.22, 1, 0.36, 1), opacity 520ms cubic-bezier(0.22, 1, 0.36, 1)',
          pointerEvents: 'none',
        }}
      >
        <VagrovaBrandMark width={210} />
      </div>
    </div>
  );
}
