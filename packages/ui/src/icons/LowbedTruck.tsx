import React from 'react';
interface TruckIconProps { size?: number; color?: string; accentColor?: string; className?: string; style?: React.CSSProperties; }

export function LowbedTruck({ size = 120, color = '#0D6D78', accentColor = '#FFC600', className, style }: TruckIconProps) {
  const h = (size * 80) / 200;
  return (
    <svg width={size} height={h} viewBox="0 0 200 80" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style} aria-label="Lowbed truck" role="img">
      {/* Rear tandem axle set */}
      <circle cx="30" cy="68" r="10" stroke={color} strokeWidth="2" fill="#EBF2F3" /><circle cx="30" cy="68" r="4" stroke={color} strokeWidth="1.5" fill="#DDD9D1" />
      <circle cx="48" cy="68" r="10" stroke={color} strokeWidth="2" fill="#EBF2F3" /><circle cx="48" cy="68" r="4" stroke={color} strokeWidth="1.5" fill="#DDD9D1" />
      <circle cx="68" cy="68" r="10" stroke={color} strokeWidth="2" fill="#EBF2F3" /><circle cx="68" cy="68" r="4" stroke={color} strokeWidth="1.5" fill="#DDD9D1" />
      {/* Front */}
      <circle cx="162" cy="64" r="12" stroke={color} strokeWidth="2" fill="#EBF2F3" /><circle cx="162" cy="64" r="5" stroke={color} strokeWidth="1.5" fill="#DDD9D1" />
      {/* Low chassis — drops down in the middle */}
      <polyline points="10,58 80,58 90,54 130,54 130,58 185,58" stroke={color} strokeWidth="2" fill="none" />
      {/* Low deck — amber strip */}
      <rect x="10" y="46" width="120" height="12" rx="1" stroke={color} strokeWidth="2" fill="#EBF2F3" />
      <rect x="10" y="46" width="120" height="4" rx="1" fill={accentColor} />
      {/* Ramps at rear */}
      <line x1="10" y1="58" x2="2" y2="68" stroke={color} strokeWidth="2" />
      <line x1="18" y1="58" x2="10" y2="68" stroke={color} strokeWidth="2" />
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

