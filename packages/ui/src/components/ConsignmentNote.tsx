/**
 * Vagrova — ConsignmentNote
 *
 * The signature component of the Vagrova brand.
 * Styled as a printed consignment / waybill document:
 *   - Ruled grid
 *   - IBM Plex Mono job number
 *   - Labeled fields
 *   - Stamped status (QUOTE · PAID · DELIVERED)
 *
 * Used for: quotes, receipts, delivery confirmations.
 */

import React from 'react';
import { colors } from '../tokens/colors';

interface Field {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  wide?: boolean;
}

type StampStatus = 'QUOTE' | 'ACCEPTED' | 'PAID' | 'IN TRANSIT' | 'DELIVERED' | 'CANCELLED' | 'DISPUTED';

const STAMP_COLORS: Record<StampStatus, { border: string; text: string }> = {
  QUOTE: { border: colors.safetyAmber, text: colors.safetyAmber },
  ACCEPTED: { border: colors.weighbridgeGreen, text: colors.weighbridgeGreen },
  PAID: { border: colors.weighbridgeGreen, text: colors.weighbridgeGreen },
  'IN TRANSIT': { border: colors.safetyAmber, text: colors.safetyAmber },
  DELIVERED: { border: colors.weighbridgeGreen, text: colors.weighbridgeGreen },
  CANCELLED: { border: colors.rustRed, text: colors.rustRed },
  DISPUTED: { border: colors.rustRed, text: colors.rustRed },
};

interface ConsignmentNoteProps {
  jobNumber: string;
  title?: string;
  stamp?: StampStatus;
  fields: Field[];
  footer?: React.ReactNode;
  className?: string;
}

export function ConsignmentNote({
  jobNumber,
  title = 'Job Request',
  stamp,
  fields,
  footer,
  className,
}: ConsignmentNoteProps) {
  const stampStyle = stamp ? STAMP_COLORS[stamp] : null;

  return (
    <div
      className={className}
      style={{
        backgroundColor: colors.roadWhite,
        border: `1px solid ${colors.grey300}`,
        borderRadius: '6px',
        fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Header band */}
      <div
        style={{
          backgroundColor: colors.asphalt,
          color: colors.waybillPaper,
          padding: '10px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <div style={{ fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.6, marginBottom: 2 }}>
            VAGROVA — {title}
          </div>
          <div
            style={{
              fontFamily: '"IBM Plex Mono", monospace',
              fontSize: '15px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: colors.safetyAmber,
            }}
          >
            {jobNumber}
          </div>
        </div>

        {stamp && stampStyle && (
          <div
            style={{
              border: `2px solid ${stampStyle.border}`,
              color: stampStyle.text,
              fontFamily: '"IBM Plex Mono", monospace',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.12em',
              padding: '4px 10px',
              borderRadius: '3px',
              textTransform: 'uppercase',
              transform: 'rotate(-4deg)',
              opacity: 0.9,
            }}
          >
            {stamp}
          </div>
        )}
      </div>

      {/* Fields grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          borderBottom: `1px solid ${colors.grey200}`,
        }}
      >
        {fields.map((field, i) => (
          <div
            key={i}
            style={{
              gridColumn: field.wide ? '1 / -1' : undefined,
              padding: '10px 16px',
              borderBottom: i < fields.length - 1 ? `1px solid ${colors.grey200}` : undefined,
              borderRight: !field.wide && i % 2 === 0 ? `1px solid ${colors.grey200}` : undefined,
            }}
          >
            <div
              style={{
                fontSize: '10px',
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: colors.gravelGrey,
                marginBottom: '4px',
              }}
            >
              {field.label}
            </div>
            <div
              style={{
                fontSize: '14px',
                fontFamily: field.mono ? '"IBM Plex Mono", monospace' : undefined,
                fontWeight: field.mono ? 500 : 400,
                color: colors.asphalt,
                wordBreak: 'break-word',
              }}
            >
              {field.value}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      {footer && (
        <div style={{ padding: '12px 16px', backgroundColor: colors.grey100 }}>
          {footer}
        </div>
      )}
    </div>
  );
}

