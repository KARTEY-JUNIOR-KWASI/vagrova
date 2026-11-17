'use client';

import React, { useEffect, useRef, useState } from 'react';
import { colors } from '@vagrova/ui';

interface TruckApproachIntroProps {
  onComplete: () => void;
}

/** Transparent SVG VAGROVA wordmark with signature Safety Gold V-accent (zero background box). */
function VagrovaWordmark({ dark = false }: { dark?: boolean }) {
  const textColor = dark ? '#082E33' : '#FFFFFF';
  return (
    <svg
      viewBox="0 0 360 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '230px', maxWidth: '68vw', height: 'auto', display: 'block' }}
      aria-label="VAGROVA"
    >
      {/* Signature Safety Gold left stroke of V */}
      <path d="M12 10L27 52L34 38L23 10H12Z" fill={colors.safetyAmber} />
      {/* Right stroke of V */}
      <path d="M40 10L27 52L34 52L51 10H40Z" fill={textColor} />
      {/* AGROVA geometric wordmark */}
      <text
        x="56"
        y="48"
        fill={textColor}
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

export default function TruckApproachIntro({ onComplete }: TruckApproachIntroProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [phase, setPhase] = useState<'approach' | 'flash' | 'logo'>('approach');

  // Highway perspective road lines + volumetric headlight beams on 60fps Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    const startTime = performance.now();

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = (now: number) => {
      const elapsed = (now - startTime) / 1000;
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      const horizonY = h * 0.48;
      const cx = w / 2;

      // Exact Vagrova Deep Harbor Teal night gradient (#041D21 -> #084D55 -> #0D6D78)
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      skyGrad.addColorStop(0, '#041D21');
      skyGrad.addColorStop(0.32, '#06363C');
      skyGrad.addColorStop(0.48, '#084D55');
      skyGrad.addColorStop(0.51, '#05282D');
      skyGrad.addColorStop(1, '#021214');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // Subtle horizon atmospheric teal glow (#0D6D78)
      const horizonGlow = ctx.createRadialGradient(cx, horizonY, 8, cx, horizonY, w * 0.65);
      horizonGlow.addColorStop(0, 'rgba(13, 109, 120, 0.55)');
      horizonGlow.addColorStop(0.6, 'rgba(8, 77, 85, 0.18)');
      horizonGlow.addColorStop(1, 'rgba(4, 29, 33, 0)');
      ctx.fillStyle = horizonGlow;
      ctx.fillRect(0, 0, w, h);

      // Perspective Asphalt Road Trapezoid
      ctx.beginPath();
      ctx.moveTo(cx - w * 0.05, horizonY);
      ctx.lineTo(cx + w * 0.05, horizonY);
      ctx.lineTo(cx + w * 0.96, h);
      ctx.lineTo(cx - w * 0.96, h);
      ctx.closePath();
      ctx.fillStyle = '#061A1D';
      ctx.fill();

      // Road Edge Coastal Teal Lines (#43AEC5 / #82CDE7)
      ctx.strokeStyle = 'rgba(130, 205, 231, 0.25)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - w * 0.05, horizonY);
      ctx.lineTo(cx - w * 0.9, h);
      ctx.moveTo(cx + w * 0.05, horizonY);
      ctx.lineTo(cx + w * 0.9, h);
      ctx.stroke();

      // Animated Center Highway Dashes rushing toward camera (#FFC600 Safety Gold)
      const speed = 1.65;
      const dashCount = 9;
      for (let i = 0; i < dashCount; i++) {
        const rawT = (i / dashCount + elapsed * speed) % 1;
        const p = rawT * rawT;
        const y1 = horizonY + p * (h - horizonY);
        const y2 = horizonY + Math.min(1, (rawT + 0.045) ** 2) * (h - horizonY);
        const width = 1.5 + p * 7;

        ctx.strokeStyle = `rgba(255, 198, 0, ${0.18 + p * 0.78})`;
        ctx.lineWidth = width;
        ctx.beginPath();
        ctx.moveTo(cx, y1);
        ctx.lineTo(cx, y2);
        ctx.stroke();
      }

      // Volumetric Headlight Beams sweeping forward on the asphalt
      const approach = Math.min(1, elapsed / 2.0);
      const beamAlpha = Math.min(0.65, 0.14 + approach * 0.52);
      const spreadX = w * (0.07 + approach * 0.44);
      const beamTopY = horizonY + approach * (h * 0.11);

      const beamGrad = ctx.createRadialGradient(
        cx,
        beamTopY,
        4,
        cx,
        h * 0.86,
        w * (0.28 + approach * 0.65),
      );
      beamGrad.addColorStop(0, `rgba(255, 253, 240, ${beamAlpha})`);
      beamGrad.addColorStop(0.45, `rgba(255, 198, 0, ${beamAlpha * 0.42})`);
      beamGrad.addColorStop(1, 'rgba(255, 198, 0, 0)');

      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(cx - spreadX * 0.24, beamTopY);
      ctx.lineTo(cx + spreadX * 0.24, beamTopY);
      ctx.lineTo(cx + spreadX * 1.45, h);
      ctx.lineTo(cx - spreadX * 1.45, h);
      ctx.closePath();
      ctx.fill();

      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);

    const flashTimer = setTimeout(() => setPhase('flash'), 1850);
    const logoTimer = setTimeout(() => setPhase('logo'), 2350);
    const doneTimer = setTimeout(() => onComplete(), 4000);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      clearTimeout(flashTimer);
      clearTimeout(logoTimer);
      clearTimeout(doneTimer);
    };
  }, [onComplete]);

  return (
    <div
      onClick={onComplete}
      style={{
        flex: 1,
        minHeight: '100vh',
        backgroundColor: '#041D21',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
      }}
    >
      {/* 60fps Perspective Night Road + Volumetric Headlight Beams */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          display: 'block',
        }}
      />

      {/* Top-Centered Transitioning VAGROVA Logo (Transparent, moves above the truck) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          paddingTop: '14vh',
          pointerEvents: 'none',
          opacity: phase === 'logo' ? 0 : 1,
          transition: 'opacity 380ms ease',
        }}
      >
        <div
          className="anim-fade-up"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <VagrovaWordmark dark={false} />
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.2em',
              color: colors.skyCyan,
              textTransform: 'uppercase',
              textAlign: 'center',
            }}
          >
            Heavy Haulage · Machinery · Ghana
          </div>
        </div>
      </div>

      {/* Approaching Photorealistic Heavy Truck (blended seamlessly beneath the logo) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: '12vh',
          pointerEvents: 'none',
          opacity: phase === 'logo' ? 0 : 1,
          transition: 'opacity 420ms ease',
        }}
      >
        <div
          className="anim-truck-approach"
          style={{
            position: 'relative',
            width: '96%',
            maxWidth: '420px',
          }}
        >
          <img
            src="/trucks/truck-approach.jpg"
            alt="Vagrova Truck Approaching"
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
              filter: 'contrast(1.06) saturate(1.12)',
              WebkitMaskImage:
                'radial-gradient(ellipse 62% 58% at 50% 50%, #000 28%, rgba(0,0,0,0.68) 48%, transparent 76%)',
              maskImage:
                'radial-gradient(ellipse 62% 58% at 50% 50%, #000 28%, rgba(0,0,0,0.68) 48%, transparent 76%)',
            }}
          />

          {/* Left Headlight Flare — locked directly on left LED headlamp */}
          <div
            style={{
              position: 'absolute',
              left: '39.2%',
              top: '52.5%',
              width: '54px',
              height: '54px',
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
                  'radial-gradient(circle, rgba(255,255,255,0.98) 0%, rgba(255,232,150,0.78) 32%, rgba(255,198,0,0) 72%)',
              }}
            />
          </div>

          {/* Right Headlight Flare — locked directly on right LED headlamp */}
          <div
            style={{
              position: 'absolute',
              left: '60.8%',
              top: '52.5%',
              width: '54px',
              height: '54px',
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
                  'radial-gradient(circle, rgba(255,255,255,0.98) 0%, rgba(255,232,150,0.78) 32%, rgba(255,198,0,0) 72%)',
              }}
            />
          </div>
        </div>
      </div>

      {/* High-Beam Light Flash -> Mist Ice (#EBF2F3) Transition */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 5,
          pointerEvents: 'none',
          background:
            phase === 'logo'
              ? `radial-gradient(circle at 50% 50%, #FFFFFF 0%, ${colors.waybillPaper} 100%)`
              : 'radial-gradient(circle at 50% 55%, rgba(255,255,255,0.98) 0%, rgba(255,232,150,0.88) 42%, rgba(255,255,255,0.96) 100%)',
          opacity: phase === 'flash' ? 0.95 : phase === 'logo' ? 1 : 0,
          transition: 'opacity 420ms ease',
        }}
      />

      {/* Centered Transparent VAGROVA Logo Reveal Out of the Light */}
      {phase === 'logo' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            padding: '24px',
            textAlign: 'center',
          }}
        >
          <div className="anim-logo-pop">
            <VagrovaWordmark dark={true} />
          </div>
          <div
            className="anim-fade-up"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.18em',
              color: colors.gravelGrey,
              textTransform: 'uppercase',
            }}
          >
            Heavy Haulage · Machinery · Ghana
          </div>
          <div
            style={{
              width: '140px',
              height: '4px',
              borderRadius: '999px',
              backgroundColor: 'rgba(13, 109, 120, 0.14)',
              overflow: 'hidden',
              marginTop: '6px',
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
      )}
    </div>
  );
}
