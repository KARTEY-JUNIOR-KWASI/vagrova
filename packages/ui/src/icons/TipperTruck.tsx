/**
 * Vagrova Truck Icons — Tipper
 *
 * Side-profile illustration. 2px stroke weight.
 * Single amber detail on the tipping bed.
 * All icons share: viewBox="0 0 200 80", same wheel positions,
 * same cab proportions — consistent visual family.
 */

import React from 'react';

interface TruckIconProps {
  /** Icon size in pixels (applied to both width and height proportionally) */
  size?: number;
  /** Override primary stroke color (default: Asphalt #0D6D78) */
  color?: string;
  /** Override amber accent color (default: Safety Amber #FFC600) */
  accentColor?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function TipperTruck({
  size = 120,
  color = '#0D6D78',
  accentColor = '#FFC600',
  className,
  style,
}: TruckIconProps) {
  const h = (size * 80) / 200;
  return (
    <svg
      width={size}
      height={h}
      viewBox="0 0 200 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      aria-label="Tipper truck"
      role="img"
    >
      {/* Rear wheels */}
      <circle cx="52" cy="64" r="12" stroke={color} strokeWidth="2" fill="#EBF2F3" />
      <circle cx="52" cy="64" r="5" stroke={color} strokeWidth="1.5" fill="#DDD9D1" />
      <circle cx="70" cy="64" r="12" stroke={color} strokeWidth="2" fill="#EBF2F3" />
      <circle cx="70" cy="64" r="5" stroke={color} strokeWidth="1.5" fill="#DDD9D1" />
      {/* Front wheel */}
      <circle cx="162" cy="64" r="12" stroke={color} strokeWidth="2" fill="#EBF2F3" />
      <circle cx="162" cy="64" r="5" stroke={color} strokeWidth="1.5" fill="#DDD9D1" />

      {/* Chassis / frame */}
      <rect x="10" y="52" width="175" height="6" rx="1" stroke={color} strokeWidth="2" fill="#DDD9D1" />

      {/* Tipping bed — amber accent on the top rail */}
      <rect x="10" y="20" width="120" height="34" rx="2" stroke={color} strokeWidth="2" fill="#EBF2F3" />
      {/* Amber top rail */}
      <rect x="10" y="20" width="120" height="5" rx="2" fill={accentColor} />
      {/* Bed ribs */}
      <line x1="40" y1="25" x2="40" y2="54" stroke={color} strokeWidth="1" opacity="0.4" />
      <line x1="70" y1="25" x2="70" y2="54" stroke={color} strokeWidth="1" opacity="0.4" />
      <line x1="100" y1="25" x2="100" y2="54" stroke={color} strokeWidth="1" opacity="0.4" />
      {/* Tailgate */}
      <rect x="10" y="20" width="5" height="34" rx="1" stroke={color} strokeWidth="1.5" fill="#DDD9D1" />

      {/* Cab */}
      <rect x="130" y="30" width="52" height="28" rx="3" stroke={color} strokeWidth="2" fill="#EBF2F3" />
      {/* Windscreen */}
      <rect x="148" y="34" width="28" height="16" rx="2" stroke={color} strokeWidth="1.5" fill="#DDD9D1" opacity="0.7" />
      {/* Door line */}
      <line x1="148" y1="30" x2="148" y2="58" stroke={color} strokeWidth="1.5" />
      {/* Door handle */}
      <rect x="140" y="43" width="6" height="2" rx="1" fill={color} />
      {/* Exhaust */}
      <rect x="130" y="22" width="4" height="10" rx="2" stroke={color} strokeWidth="1.5" fill="#DDD9D1" />
      {/* Front bumper */}
      <rect x="180" y="48" width="5" height="10" rx="1" stroke={color} strokeWidth="1.5" fill="#DDD9D1" />
      {/* Headlight */}
      <rect x="181" y="38" width="4" height="6" rx="1" fill={accentColor} opacity="0.7" />

      {/* Hoist cylinder */}
      <rect x="125" y="38" width="8" height="4" rx="1" stroke={color} strokeWidth="1.5" fill="#DDD9D1" />
    </svg>
  );
}

