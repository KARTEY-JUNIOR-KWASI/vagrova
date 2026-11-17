import React from 'react';
interface TruckIconProps { size?: number; color?: string; accentColor?: string; className?: string; style?: React.CSSProperties; }

export function TowRecoveryTruck({ size = 120, color = '#0D6D78', accentColor = '#FFC600', className, style }: TruckIconProps) {
  const h = (size * 80) / 200;
  return (
    <svg width={size} height={h} viewBox="0 0 200 80" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style} aria-label="Tow recovery truck" role="img">
      <circle cx="52" cy="64" r="12" stroke={color} strokeWidth="2" fill="#EBF2F3" /><circle cx="52" cy="64" r="5" stroke={color} strokeWidth="1.5" fill="#DDD9D1" />
      <circle cx="162" cy="64" r="12" stroke={color} strokeWidth="2" fill="#EBF2F3" /><circle cx="162" cy="64" r="5" stroke={color} strokeWidth="1.5" fill="#DDD9D1" />
      <rect x="10" y="52" width="175" height="6" rx="1" stroke={color} strokeWidth="2" fill="#DDD9D1" />
      {/* Tow body */}
      <rect x="10" y="30" width="118" height="24" rx="2" stroke={color} strokeWidth="2" fill="#EBF2F3" />
      {/* Amber warning stripe on body */}
      <rect x="10" y="30" width="118" height="6" rx="1" fill={accentColor} opacity="0.8" />
      {/* Recovery boom — tilted */}
      <line x1="50" y1="52" x2="20" y2="22" stroke={color} strokeWidth="3" strokeLinecap="round" />
      {/* Boom amber highlight */}
      <line x1="48" y1="52" x2="20" y2="24" stroke={accentColor} strokeWidth="1.5" strokeLinecap="round" />
      {/* Hook */}
      <path d="M18 22 Q16 28 20 30 Q24 28 22 22" stroke={color} strokeWidth="1.5" fill="none" />
      {/* Winch drum */}
      <circle cx="80" cy="42" r="8" stroke={color} strokeWidth="1.5" fill="#DDD9D1" />
      <circle cx="80" cy="42" r="3" stroke={color} strokeWidth="1" fill="#BCB8B1" />
      {/* Cab */}
      <rect x="130" y="30" width="52" height="28" rx="3" stroke={color} strokeWidth="2" fill="#EBF2F3" />
      <rect x="148" y="34" width="28" height="16" rx="2" stroke={color} strokeWidth="1.5" fill="#DDD9D1" opacity="0.7" />
      <line x1="148" y1="30" x2="148" y2="58" stroke={color} strokeWidth="1.5" />
      <rect x="140" y="43" width="6" height="2" rx="1" fill={color} />
      <rect x="130" y="22" width="4" height="10" rx="2" stroke={color} strokeWidth="1.5" fill="#DDD9D1" />
      <rect x="180" y="48" width="5" height="10" rx="1" stroke={color} strokeWidth="1.5" fill="#DDD9D1" />
      <rect x="181" y="38" width="4" height="6" rx="1" fill={accentColor} opacity="0.7" />
      {/* Light bar on cab roof */}
      <rect x="134" y="26" width="44" height="5" rx="2" fill={accentColor} />
    </svg>
  );
}

