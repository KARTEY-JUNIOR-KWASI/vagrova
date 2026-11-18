'use client';

import React, { useEffect, useState } from 'react';
import { ArrowRight, Truck } from 'lucide-react';
import { colors } from '@vagrova/ui';

interface OnboardingHeroProps {
  onGetStarted: () => void;
  onDriverPortal: () => void;
}

export default function OnboardingHero({ onGetStarted, onDriverPortal }: OnboardingHeroProps) {
  const [stage, setStage] = useState<'splash' | 'hero' | 'reveal'>('splash');
  const [logoMounted, setLogoMounted] = useState(false);

  useEffect(() => {
    // Trigger initial center scale-up with ease-out curve on mount
    const mountFrame = requestAnimationFrame(() => setLogoMounted(true));

    // Step 2: After 2 seconds, glide logo to top-left & cross-fade to sunset fleet
    const heroTimer = setTimeout(() => setStage('hero'), 2000);

    // Step 3: Once logo settles (~750ms), stagger-reveal bottom onboarding elements
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
      {/* Background 1: Solid Vagrova Deep Harbor Teal (#0D6D78) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: colors.asphalt,
          zIndex: 0,
        }}
      />

      {/* Background 2: Fleet of Trucks on Highway at Sunset (Cross-fades in at 2s) */}
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
          src="/trucks/fleet-sunset.jpg"
          alt="Fleet of heavy trucks on highway at sunset"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
            display: 'block',
          }}
        />
        {/* Cinematic scrim for crisp white typography contrast */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(8, 52, 58, 0.52) 0%, rgba(10, 37, 64, 0.25) 42%, rgba(7, 25, 43, 0.90) 100%)',
          }}
        />
      </div>

      {/* Shared-Element Hero Logo: White Truck Icon + VAGROVA */}
      <div
        style={{
          position: 'absolute',
          zIndex: 10,
          top: isTopLeft ? '22px' : '50%',
          left: isTopLeft ? '20px' : '50%',
          transform: isTopLeft
            ? 'translate(0%, 0%) scale(0.76)'
            : logoMounted
            ? 'translate(-50%, -50%) scale(1)'
            : 'translate(-50%, -50%) scale(0.35)',
          transformOrigin: isTopLeft ? 'top left' : 'center center',
          opacity: logoMounted ? 1 : 0,
          transition:
            'top 760ms cubic-bezier(0.22, 1, 0.36, 1), left 760ms cubic-bezier(0.22, 1, 0.36, 1), transform 760ms cubic-bezier(0.22, 1, 0.36, 1), opacity 550ms cubic-bezier(0.22, 1, 0.36, 1)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            width: '54px',
            height: '54px',
            borderRadius: '15px',
            backgroundColor: 'rgba(255, 255, 255, 0.14)',
            border: '1.5px solid rgba(255, 255, 255, 0.45)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Truck size={30} color="#FFFFFF" strokeWidth={2.2} />
        </div>
        <span
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '26px',
            fontWeight: 900,
            letterSpacing: '0.06em',
            color: '#FFFFFF',
          }}
        >
          VAGROVA
        </span>
      </div>

      {/* Staggered Onboarding Content (150ms delay between each element) */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          padding: '28px 22px 36px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {/* Element 1 (0ms): Main Heading */}
        <h1
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '40px',
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

        {/* Element 2 (150ms): Subheading */}
        <p
          style={{
            fontSize: '16px',
            fontWeight: 500,
            lineHeight: 1.45,
            color: 'rgba(255, 255, 255, 0.88)',
            margin: '0 0 10px 0',
            opacity: isRevealed ? 1 : 0,
            transform: isRevealed ? 'translateY(0)' : 'translateY(26px)',
            transition:
              'opacity 520ms cubic-bezier(0.22, 1, 0.36, 1) 150ms, transform 520ms cubic-bezier(0.22, 1, 0.36, 1) 150ms',
          }}
        >
          Find the best trucks for your cargo
        </p>

        {/* Element 3 (300ms): Pill-shaped Navy Blue 'Get Started' Primary Button */}
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
              height: '56px',
              borderRadius: '999px',
              backgroundColor: '#0A2540',
              color: '#FFFFFF',
              border: '1.5px solid rgba(255, 255, 255, 0.22)',
              fontFamily: 'var(--font-heading)',
              fontSize: '16px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              cursor: 'pointer',
              boxShadow: '0 12px 28px rgba(10, 37, 64, 0.45)',
            }}
          >
            <span>Get Started</span>
            <ArrowRight size={18} />
          </button>
        </div>

        {/* Secondary Driver Portal Link (450ms) */}
        <div
          style={{
            textAlign: 'center',
            marginTop: '4px',
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
              color: 'rgba(255, 255, 255, 0.82)',
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
