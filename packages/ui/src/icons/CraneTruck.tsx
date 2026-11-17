import React from 'react';
interface TruckIconProps { size?: number; color?: string; accentColor?: string; className?: string; style?: React.CSSProperties; }

export function CraneTruck({ size = 120, color = '#0D6D78', accentColor = '#FFC600', className, style }: TruckIconProps) {
  const h = (size * 90) / 200;
  return (
    <svg width={size} height={h} viewBox="0 0 200 90" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style} aria-label="Crane truck" role="img">
      <circle cx="52" cy="74" r="12" stroke={color} strokeWidth="2" fill="#EBF2F3" /><circle cx="52" cy="74" r="5" stroke={color} strokeWidth="1.5" fill="#DDD9D1" />
      <circle cx="70" cy="74" r="12" stroke={color} strokeWidth="2" fill="#EBF2F3" /><circle cx="70" cy="74" r="5" stroke={color} strokeWidth="1.5" fill="#DDD9D1" />
      <circle cx="162" cy="74" r="12" stroke={color} strokeWidth="2" fill="#EBF2F3" /><circle cx="162" cy="74" r="5" stroke={color} strokeWidth="1.5" fill="#DDD9D1" />
      <rect x="10" y="62" width="175" height="6" rx="1" stroke={color} strokeWidth="2" fill="#DDD9D1" />
      {/* Body platform */}
      <rect x="10" y="48" width="118" height="16" rx="1" stroke={color} strokeWidth="2" fill="#EBF2F3" />
      {/* Outriggers */}
      <rect x="20" y="62" width="6" height="12" rx="1" stroke={color} strokeWidth="1.5" fill="#DDD9D1" />
      <rect x="100" y="62" width="6" height="12" rx="1" stroke={color} strokeWidth="1.5" fill="#DDD9D1" />
      {/* Crane base turret */}
      <rect x="55" y="34" width="22" height="16" rx="2" stroke={color} strokeWidth="2" fill="#DDD9D1" />
      {/* Crane boom — amber */}
      <line x1="66" y1="34" x2="30" y2="10" stroke={accentColor} strokeWidth="3" strokeLinecap="round" />
      <line x1="66" y1="34" x2="100" y2="10" stroke={color} strokeWidth="2" strokeLinecap="round" />
      {/* Hook cable */}
      <line x1="30" y1="10" x2="30" y2="22" stroke={color} strokeWidth="1.5" />
      <path d="M28 22 Q30 28 32 22" stroke={color} strokeWidth="1.5" fill="none" />
      {/* Counterweight */}
      <rect x="100" y="8" width="14" height="8" rx="1" stroke={color} strokeWidth="1.5" fill="#DDD9D1" />
      {/* Cab */}
      <rect x="130" y="40" width="52" height="28" rx="3" stroke={color} strokeWidth="2" fill="#EBF2F3" />
      <rect x="148" y="44" width="28" height="16" rx="2" stroke={color} strokeWidth="1.5" fill="#DDD9D1" opacity="0.7" />
      <line x1="148" y1="40" x2="148" y2="68" stroke={color} strokeWidth="1.5" />
      <rect x="140" y="53" width="6" height="2" rx="1" fill={color} />
      <rect x="130" y="32" width="4" height="10" rx="2" stroke={color} strokeWidth="1.5" fill="#DDD9D1" />
      <rect x="180" y="58" width="5" height="10" rx="1" stroke={color} strokeWidth="1.5" fill="#DDD9D1" />
      <rect x="181" y="48" width="4" height="6" rx="1" fill={accentColor} opacity="0.7" />
    </svg>
  );
}

