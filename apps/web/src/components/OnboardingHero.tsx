'use client';

import React, { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { colors } from '@vagrova/ui';

interface OnboardingHeroProps {
  onGetStarted: () => void;
  onDriverPortal: () => void;
}

/** Real VAGROVA company wordmark (Safety Gold V-accent + crisp white letters, zero background box). */
function VagrovaBrandMark({ width = 188 }: { width?: number }) {
  return (
    <svg
      viewBox="0 0 360 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: `${width}px`, maxWidth: '58vw', height: 'auto', display: 'block' }}
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

export default function OnboardingHero({ onGetStarted, onDriverPortal }: OnboardingHeroProps) {
  const [stage, setStage] = useState<'splash' | 'hero' | 'reveal'>('splash');
  const [logoMounted, setLogoMounted] = useState(false);

  useEffect(() => {
    const mountFrame = requestAnimationFrame(() => setLogoMounted(true));
    const heroTimer = setTimeout(() => setStage('hero'), 2000);
    const revealTimer = setTimeout(() => setStage('reveal'), 2750);

    return () => {
      cancelAnimationFrame(mountFrame);
      clearTimeout(heroTimer);
      clearTimeout(revealTimer);
    };
  }, []);

  const isTopLeft = stage === 'hero' || stage === 'reveal';
  const isRevealed = stage === 'reveal';

  return (
    <div
      style={{
        flex: 1,
        minHeight: '100vh',
        backgroundColor: colors.asphalt,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
      }}
    >
      {/* Solid Vagrova Deep Harbor Teal (#0D6D78) Splash Backdrop */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: colors.asphalt,
          zIndex: 0,
        }}
      />

      {/* Real Uploaded Crane Truck Photo (Cross-fades in at 2s) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          opacity: isTopLeft ? 1 : 0,
          transition: 'opacity 780ms cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        <img
          src="/trucks/onboarding-real.jpg"
          alt="Vagrova crane truck lifting modular cabin"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center 35%',
            display: 'block',
          }}
        />
        {/* High-contrast gradient scrim so white headline & button pop cleanly */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(8, 52, 58, 0.62) 0%, rgba(10, 37, 64, 0.18) 38%, rgba(7, 25, 43, 0.92) 86%, rgba(7, 25, 43, 0.97) 100%)',
          }}
        />
      </div>

      {/* Shared-Element Hero Logo: Real VAGROVA Brand Mark */}
      <div
        style={{
          position: 'absolute',
          zIndex: 10,
          top: isTopLeft ? '20px' : '50%',
          left: isTopLeft ? '18px' : '50%',
          transform: isTopLeft
            ? 'translate(0%, 0%) scale(0.76)'
            : logoMounted
            ? 'translate(-50%, -50%) scale(1.12)'
            : 'translate(-50%, -50%) scale(0.38)',
          transformOrigin: isTopLeft ? 'top left' : 'center center',
          opacity: logoMounted ? 1 : 0,
          transition:
            'top 760ms cubic-bezier(0.22, 1, 0.36, 1), left 760ms cubic-bezier(0.22, 1, 0.36, 1), transform 760ms cubic-bezier(0.22, 1, 0.36, 1), opacity 550ms cubic-bezier(0.22, 1, 0.36, 1)',
          pointerEvents: 'none',
        }}
      >
        <VagrovaBrandMark width={200} />
      </div>

      {/* Staggered Onboarding Content — Positioned Higher Above Mobile Bottom Bar */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          padding: '24px 22px 92px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        {/* 0ms: Main Heading */}
        <h1
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '38px',
            fontWeight: 800,
            lineHeight: 1.08,
            letterSpacing: '-0.02em',
            color: '#FFFFFF',
            margin: 0,
            opacity: isRevealed ? 1 : 0,
            transform: isRevealed ? 'translateY(0)' : 'translateY(26px)',
            transition:
              'opacity 520ms cubic-bezier(0.22, 1, 0.36, 1) 0ms, transform 520ms cubic-bezier(0.22, 1, 0.36, 1) 0ms',
          }}
        >
          Haul Smarter
        </h1>

        {/* 150ms: Subheading */}
        <p
          style={{
            fontSize: '16px',
            fontWeight: 500,
            lineHeight: 1.45,
            color: 'rgba(255, 255, 255, 0.90)',
            margin: '0 0 8px 0',
            opacity: isRevealed ? 1 : 0,
            transform: isRevealed ? 'translateY(0)' : 'translateY(26px)',
            transition:
              'opacity 520ms cubic-bezier(0.22, 1, 0.36, 1) 150ms, transform 520ms cubic-bezier(0.22, 1, 0.36, 1) 150ms',
          }}
        >
          Find the best trucks for your cargo
        </p>

        {/* 300ms: Pill-shaped Navy Blue 'Get Started' Primary Button */}
        <div
          style={{
            opacity: isRevealed ? 1 : 0,
            transform: isRevealed ? 'translateY(0)' : 'translateY(26px)',
            transition:
              'opacity 520ms cubic-bezier(0.22, 1, 0.36, 1) 300ms, transform 520ms cubic-bezier(0.22, 1, 0.36, 1) 300ms',
          }}
        >
          <button
            onClick={onGetStarted}
            className="vagrova-card-tap"
            style={{
              width: '100%',
              height: '54px',
              borderRadius: '999px',
              backgroundColor: '#0A2540',
              color: '#FFFFFF',
              border: '1.5px solid rgba(255, 255, 255, 0.25)',
              fontFamily: 'var(--font-heading)',
              fontSize: '16px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              cursor: 'pointer',
              boxShadow: '0 12px 28px rgba(10, 37, 64, 0.5)',
            }}
          >
            <span>Get Started</span>
            <ArrowRight size={18} />
          </button>
        </div>

        {/* 450ms: Driver Portal Link */}
        <div
          style={{
            textAlign: 'center',
            marginTop: '2px',
            opacity: isRevealed ? 1 : 0,
            transform: isRevealed ? 'translateY(0)' : 'translateY(20px)',
            transition:
              'opacity 520ms cubic-bezier(0.22, 1, 0.36, 1) 450ms, transform 520ms cubic-bezier(0.22, 1, 0.36, 1) 450ms',
          }}
        >
          <button
            onClick={onDriverPortal}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.88)',
              fontSize: '13px',
              fontWeight: 600,
              textDecoration: 'underline',
              cursor: 'pointer',
              padding: '6px 10px',
            }}
          >
            Driver or Truck Owner? Open Driver Portal →
          </button>
        </div>
      </div>
    </div>
  );
}
