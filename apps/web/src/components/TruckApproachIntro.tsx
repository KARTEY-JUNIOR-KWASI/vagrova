'use client';

import React, { useEffect, useRef, useState } from 'react';
import { colors } from '@vagrova/ui';

interface TruckApproachIntroProps {
  onComplete: () => void;
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
      const horizonY = h * 0.44;
      const cx = w / 2;

      // Sky & Horizon Glow
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      skyGrad.addColorStop(0, '#031F23');
      skyGrad.addColorStop(0.44, '#084D55');
      skyGrad.addColorStop(0.45, '#06262A');
      skyGrad.addColorStop(1, '#021214');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // Perspective Asphalt Road Trapezoid
      ctx.beginPath();
      ctx.moveTo(cx - w * 0.04, horizonY);
      ctx.lineTo(cx + w * 0.04, horizonY);
      ctx.lineTo(cx + w * 0.95, h);
      ctx.lineTo(cx - w * 0.95, h);
      ctx.closePath();
      ctx.fillStyle = '#0B1719';
      ctx.fill();

      // Road Edge Teal/Gold Lines
      ctx.strokeStyle = 'rgba(130, 205, 231, 0.28)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - w * 0.04, horizonY);
      ctx.lineTo(cx - w * 0.88, h);
      ctx.moveTo(cx + w * 0.04, horizonY);
      ctx.lineTo(cx + w * 0.88, h);
      ctx.stroke();

      // Animated Center Highway Dashes rushing toward camera
      const speed = 1.65;
      const dashCount = 9;
      for (let i = 0; i < dashCount; i++) {
        const rawT = ((i / dashCount) + elapsed * speed) % 1;
        const p = rawT * rawT; // Perspective acceleration
        const y1 = horizonY + p * (h - horizonY);
        const y2 = horizonY + Math.min(1, (rawT + 0.045) ** 2) * (h - horizonY);
        const width = 1.5 + p * 7;

        ctx.strokeStyle = `rgba(255, 198, 0, ${0.15 + p * 0.75})`;
        ctx.lineWidth = width;
        ctx.beginPath();
        ctx.moveTo(cx, y1);
        ctx.lineTo(cx, y2);
        ctx.stroke();
      }

      // Volumetric Headlight Beams sweeping forward on the asphalt
      const approach = Math.min(1, elapsed / 2.0);
      const beamAlpha = Math.min(0.62, 0.12 + approach * 0.52);
      const spreadX = w * (0.06 + approach * 0.42);
      const beamTopY = horizonY + approach * (h * 0.12);

      const beamGrad = ctx.createRadialGradient(
        cx,
        beamTopY,
        4,
        cx,
        h * 0.85,
        w * (0.25 + approach * 0.65),
      );
      beamGrad.addColorStop(0, `rgba(255, 252, 230, ${beamAlpha})`);
      beamGrad.addColorStop(0.45, `rgba(255, 214, 102, ${beamAlpha * 0.45})`);
      beamGrad.addColorStop(1, 'rgba(255, 198, 0, 0)');

      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(cx - spreadX * 0.25, beamTopY);
      ctx.lineTo(cx + spreadX * 0.25, beamTopY);
      ctx.lineTo(cx + spreadX * 1.45, h);
      ctx.lineTo(cx - spreadX * 1.45, h);
      ctx.closePath();
      ctx.fill();

      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);

    const flashTimer = setTimeout(() => setPhase('flash'), 1750);
    const logoTimer = setTimeout(() => setPhase('logo'), 2250);
    const doneTimer = setTimeout(() => onComplete(), 3950);

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
        backgroundColor: '#031F23',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
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

      {/* Approaching Photorealistic Heavy Truck */}
      <div
        className="anim-truck-approach"
        style={{
          position: 'relative',
          zIndex: 2,
          width: '88%',
          maxWidth: '380px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          opacity: phase === 'logo' ? 0 : 1,
          transition: 'opacity 420ms ease',
        }}
      >
        <div style={{ position: 'relative', width: '100%' }}>
          <img
            src="/trucks/truck-approach.jpg"
            alt="Vagrova Truck Approaching"
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
              borderRadius: '18px',
              WebkitMaskImage:
                'radial-gradient(ellipse 88% 82% at 50% 52%, #000 58%, transparent 100%)',
              maskImage:
                'radial-gradient(ellipse 88% 82% at 50% 52%, #000 58%, transparent 100%)',
            }}
          />

          {/* Left & Right High-Beam LED Lens Flares */}
          <div
            className={phase === 'flash' ? 'anim-headlight-flare-bright' : 'anim-headlight-flare'}
            style={{
              position: 'absolute',
              left: '21%',
              top: '63%',
              width: '52px',
              height: '52px',
              transform: 'translate(-50%, -50%)',
              borderRadius: '999px',
              background:
                'radial-gradient(circle, rgba(255,255,255,0.98) 0%, rgba(255,220,120,0.72) 35%, rgba(255,198,0,0) 72%)',
              pointerEvents: 'none',
            }}
          />
          <div
            className={phase === 'flash' ? 'anim-headlight-flare-bright' : 'anim-headlight-flare'}
            style={{
              position: 'absolute',
              right: '21%',
              top: '63%',
              width: '52px',
              height: '52px',
              transform: 'translate(50%, -50%)',
              borderRadius: '999px',
              background:
                'radial-gradient(circle, rgba(255,255,255,0.98) 0%, rgba(255,220,120,0.72) 35%, rgba(255,198,0,0) 72%)',
              pointerEvents: 'none',
            }}
          />
        </div>
      </div>

      {/* High-Beam Light Flash Transition */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 5,
          pointerEvents: 'none',
          background:
            'radial-gradient(circle at 50% 54%, rgba(255,255,255,0.98) 0%, rgba(255,244,205,0.92) 45%, rgba(255,255,255,0.96) 100%)',
          opacity: phase === 'flash' ? 0.95 : phase === 'logo' ? 1 : 0,
          transition: 'opacity 420ms ease',
        }}
      />

      {/* Crisp Vagrova Logo Reveal Out of the Light */}
      {phase === 'logo' && (
        <div
          style={{
            position: 'relative',
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            padding: '32px',
          }}
        >
          <div className="anim-logo-pop">
            <img
              src="/vagrova-logo.png"
              alt="Vagrova"
              style={{ width: '240px', maxWidth: '72vw', height: 'auto', display: 'block' }}
            />
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
              backgroundColor: colors.grey100,
              overflow: 'hidden',
              marginTop: '8px',
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
