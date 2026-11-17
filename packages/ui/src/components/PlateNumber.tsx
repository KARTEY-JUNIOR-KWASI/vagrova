/**
 * Vagrova — PlateNumber
 *
 * Renders a vehicle plate number in a plate-style frame.
 * Uses IBM Plex Mono — looks like a stamped identifier.
 * Shown wherever a truck is identified.
 */

import React from 'react';
import { colors } from '../tokens/colors';

interface PlateNumberProps {
  plate: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_MAP = {
  sm: { fontSize: '11px', padding: '2px 8px', minWidth: '72px' },
  md: { fontSize: '14px', padding: '4px 12px', minWidth: '96px' },
  lg: { fontSize: '18px', padding: '6px 16px', minWidth: '120px' },
};

export function PlateNumber({ plate, size = 'md', className }: PlateNumberProps) {
  const s = SIZE_MAP[size];
  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '"IBM Plex Mono", "Courier New", monospace',
        fontWeight: 700,
        fontSize: s.fontSize,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: colors.asphalt,
        backgroundColor: colors.waybillPaper,
        border: `2px solid ${colors.asphalt}`,
        borderRadius: '3px',
        padding: s.padding,
        minWidth: s.minWidth,
        textAlign: 'center',
      }}
    >
      {plate}
    </span>
  );
}

