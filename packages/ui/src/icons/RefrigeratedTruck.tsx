import React from 'react';
interface TruckIconProps { size?: number; color?: string; accentColor?: string; className?: string; style?: React.CSSProperties; }

export function RefrigeratedTruck({ size = 120, color = '#0D6D78', accentColor = '#FFC600', className, style }: TruckIconProps) {
  const h = (size * 80) / 200;
  return (
    <svg width={size} height={h} viewBox="0 0 200 80" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style} aria-label="Refrigerated truck" role="img">
      <circle cx="52" cy="64" r="12" stroke={color} strokeWidth="2" fill="#EBF2F3" /><circle cx="52" cy="64" r="5" stroke={color} strokeWidth="1.5" fill="#DDD9D1" />
      <circle cx="70" cy="64" r="12" stroke={color} strokeWidth="2" fill="#EBF2F3" /><circle cx="70" cy="64" r="5" stroke={color} strokeWidth="1.5" fill="#DDD9D1" />
      <circle cx="162" cy="64" r="12" stroke={color} strokeWidth="2" fill="#EBF2F3" /><circle cx="162" cy="64" r="5" stroke={color} strokeWidth="1.5" fill="#DDD9D1" />
      <rect x="10" y="52" width="175" height="6" rx="1" stroke={color} strokeWidth="2" fill="#DDD9D1" />
      {/* Insulated box body — thicker walls */}
      <rect x="10" y="16" width="118" height="38" rx="2" stroke={color} strokeWidth="3" fill="#EBF2F3" />
      {/* Amber accent stripe along side */}
      <rect x="10" y="30" width="118" height="4" rx="0" fill={accentColor} />
      {/* Refrigeration unit on front of box */}
      <rect x="123" y="20" width="10" height="20" rx="2" stroke={color} strokeWidth="1.5" fill="#DDD9D1" />
      <line x1="125" y1="24" x2="131" y2="24" stroke={color} strokeWidth="1" />
      <line x1="125" y1="28" x2="131" y2="28" stroke={color} strokeWidth="1" />
      <line x1="125" y1="32" x2="131" y2="32" stroke={color} strokeWidth="1" />
      <line x1="125" y1="36" x2="131" y2="36" stroke={color} strokeWidth="1" />
      {/* Door on rear */}
      <line x1="12" y1="16" x2="12" y2="54" stroke={color} strokeWidth="1.5" />
      <line x1="20" y1="16" x2="20" y2="54" stroke={color} strokeWidth="1.5" />
      <rect x="13" y="34" width="5" height="2" rx="1" fill={color} />
      {/* Cab */}
      <rect x="130" y="30" width="52" height="28" rx="3" stroke={color} strokeWidth="2" fill="#EBF2F3" />
      <rect x="148" y="34" width="28" height="16" rx="2" stroke={color} strokeWidth="1.5" fill="#DDD9D1" opacity="0.7" />
      <line x1="148" y1="30" x2="148" y2="58" stroke={color} strokeWidth="1.5" />
      <rect x="140" y="43" width="6" height="2" rx="1" fill={color} />
      <rect x="130" y="22" width="4" height="10" rx="2" stroke={color} strokeWidth="1.5" fill="#DDD9D1" />
      <rect x="180" y="48" width="5" height="10" rx="1" stroke={color} strokeWidth="1.5" fill="#DDD9D1" />
      <rect x="181" y="38" width="4" height="6" rx="1" fill={accentColor} opacity="0.7" />
    </svg>
  );
}

