/**
 * Vagrova — StatusChip
 *
 * A small tag with a colored left edge (3px) indicating job status.
 * NOT a glowing badge. Looks like a printed form tag.
 */

import React from 'react';
import { colors } from '../tokens/colors';
import { JOB_STATUS_LABELS, JOB_STATUS_COLORS, type JobStatus } from '../tokens/constants';

interface StatusChipProps {
  status: JobStatus;
  size?: 'sm' | 'md';
  className?: string;
}

export function StatusChip({ status, size = 'md', className }: StatusChipProps) {
  const label = JOB_STATUS_LABELS[status];
  const edgeColor = JOB_STATUS_COLORS[status];

  const fontSize = size === 'sm' ? '11px' : '12px';
  const padding = size === 'sm' ? '2px 8px' : '3px 10px';

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        borderLeft: `3px solid ${edgeColor}`,
        backgroundColor: colors.grey100,
        color: colors.asphalt,
        fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
        fontSize,
        fontWeight: 600,
        letterSpacing: '0.04em',
        padding,
        borderRadius: '0 3px 3px 0',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        userSelect: 'none',
      }}
    >
      {label}
    </span>
  );
}

