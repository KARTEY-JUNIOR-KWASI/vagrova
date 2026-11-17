'use client';

import React, { useEffect, useState } from 'react';
import { colors } from '@vagrova/ui';

interface TruckApproachIntroProps {
  onComplete: () => void;
}

export default function TruckApproachIntro({ onComplete }: TruckApproachIntroProps) {
  const [phase, setPhase] = useState<'approach' | 'flash' | 'done'>('approach');

  useEffect(() => {
    const flashTimer = setTimeout(() => setPhase('flash'), 1750);
    const doneTimer = setTimeout(() => {
      setPhase('done');
      onComplete();
    }, 3450);

    return () => {
      clearTimeout(flashTimer);
      clearTimeout(doneTimer);
    };
  }, [onComplete]);

  return (
    <div
      onClick={onComplete}
      style={{
        flex: 1,
        minHeight: '100vh',
        backgroundColor: '#FFFFFF',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
      }}
    >
      {/* Subtle Mist Ice Studio Floor Gradient at the bottom */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: '38%',
          background: `linear-gradient(180deg, rgba(255,255,255,0) 0%, ${colors.waybillPaper} 72%, #E2ECEE 100%)`,
          pointerEvents: 'none',
        }}
      />

      {/* Centered VAGROVA Logo & Tagline at Top */}
      <div
        style={{
          position: 'absolute',
          top: '13vh',
          left: 0,
          right: 0,
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          padding: '0 24px',
          textAlign: 'center',
          pointerEvents: 'none',
        }}
      >
        <div className="anim-logo-reveal">
          <img
            src="/vagrova-logo.png"
            alt="VAGROVA"
            style={{
              width: '220px',
              maxWidth: '64vw',
              height: 'auto',
              display: 'block',
              mixBlendMode: 'multiply',
            }}
          />
        </div>

        <div
          className="anim-fade-up"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.2em',
            color: colors.gravelGrey,
            textTransform: 'uppercase',
          }}
        >
          Heavy Haulage · Machinery · Ghana
        </div>

        <div
          style={{
            width: '132px',
            height: '4px',
            borderRadius: '999px',
            backgroundColor: colors.waybillPaper,
            overflow: 'hidden',
            marginTop: '4px',
          }}
        >
          <div
            className="anim-splash-bar"
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: colors.safetyAmber,
              borderRadius: '999px',
            }}
          />
        </div>
      </div>

      {/* Approaching Studio Truck on Pure White (moves beneath the logo) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: '22vh',
          pointerEvents: 'none',
        }}
      >
        <div
          className="anim-truck-approach"
          style={{
            position: 'relative',
            width: '88%',
            maxWidth: '370px',
          }}
        >
          <img
            src="/trucks/truck-approach-white.jpg"
            alt="Vagrova Heavy Truck"
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
              mixBlendMode: 'multiply',
            }}
          />

          {/* Left LED Headlight Lens Flare */}
          <div
            style={{
              position: 'absolute',
              left: '31.8%',
              top: '59.5%',
              width: '56px',
              height: '56px',
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
            }}
          >
            <div
              className={phase === 'flash' ? 'anim-headlight-flare-bright' : 'anim-headlight-flare'}
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '999px',
                background:
                  'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,224,102,0.85) 34%, rgba(255,198,0,0) 72%)',
              }}
            />
          </div>

          {/* Right LED Headlight Lens Flare */}
          <div
            style={{
              position: 'absolute',
              left: '68.2%',
              top: '59.5%',
              width: '56px',
              height: '56px',
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
            }}
          >
            <div
              className={phase === 'flash' ? 'anim-headlight-flare-bright' : 'anim-headlight-flare'}
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '999px',
                background:
                  'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,224,102,0.85) 34%, rgba(255,198,0,0) 72%)',
              }}
            />
          </div>
        </div>
      </div>

      {/* Subtle Warm White High-Beam Bloom on Flash */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 8,
          pointerEvents: 'none',
          background:
            'radial-gradient(circle at 50% 62%, rgba(255,255,255,0.92) 0%, rgba(255,245,205,0.45) 45%, rgba(255,255,255,0.96) 100%)',
          opacity: phase === 'flash' ? 0.92 : 0,
          transition: 'opacity 480ms ease',
        }}
      />
    </div>
  );
}
