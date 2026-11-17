import React from 'react';

interface TruckIconProps {
  size?: number;
  color?: string;
  accentColor?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function FlatbedTruck({
  size = 120,
  color = '#0D6D78',
  accentColor = '#FFC600',
  className,
  style,
}: TruckIconProps) {
  const h = (size * 80) / 200;
  return (
    <svg width={size} height={h} viewBox="0 0 200 80" fill="none"
      xmlns="http://www.w3.org/2000/svg" className={className} style={style}
      aria-label="Flatbed truck" role="img">
      <circle cx="52" cy="64" r="12" stroke={color} strokeWidth="2" fill="#EBF2F3" />
      <circle cx="52" cy="64" r="5" stroke={color} strokeWidth="1.5" fill="#DDD9D1" />
      <circle cx="70" cy="64" r="12" stroke={color} strokeWidth="2" fill="#EBF2F3" />
      <circle cx="70" cy="64" r="5" stroke={color} strokeWidth="1.5" fill="#DDD9D1" />
      <circle cx="162" cy="64" r="12" stroke={color} strokeWidth="2" fill="#EBF2F3" />
      <circle cx="162" cy="64" r="5" stroke={color} strokeWidth="1.5" fill="#DDD9D1" />
      {/* Chassis */}
      <rect x="10" y="52" width="175" height="6" rx="1" stroke={color} strokeWidth="2" fill="#DDD9D1" />
      {/* Flat deck — amber side rails */}
      <rect x="10" y="38" width="118" height="16" rx="1" stroke={color} strokeWidth="2" fill="#EBF2F3" />
      <rect x="10" y="38" width="118" height="4" rx="1" fill={accentColor} />
      <rect x="10" y="50" width="118" height="4" rx="1" fill={accentColor} />
      {/* Deck boards */}
      {[25, 40, 55, 70, 85, 100].map((x) => (
        <line key={x} x1={x} y1="38" x2={x} y2="54" stroke={color} strokeWidth="1" opacity="0.3" />
      ))}
      {/* Headboard */}
      <rect x="123" y="30" width="6" height="22" rx="1" stroke={color} strokeWidth="1.5" fill="#DDD9D1" />
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

