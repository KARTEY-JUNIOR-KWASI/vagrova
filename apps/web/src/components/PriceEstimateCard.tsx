'use client';

import React from 'react';
import { colors } from '@vagrova/ui';
import { Calculator, ShieldCheck } from 'lucide-react';

export interface EquipmentRateInfo {
  id?: string;
  code?: string;
  name: string;
  pricingModel?: string;
  baseRateMinor?: string | number;
  unitRateMinor?: string | number;
  mobilisationMinor?: string | number;
}

const DEFAULT_RATES_BY_NAME: Record<string, { pricingModel: string; base: number; unit: number; mob: number }> = {
  'Cargo Station': { pricingModel: 'PROJECT_CONTRACT', base: 1500, unit: 0, mob: 0 },
  Crane: { pricingModel: 'HOURLY', base: 2500, unit: 650, mob: 800 },
  'Flatbed Truck': { pricingModel: 'PER_KM', base: 1800, unit: 35, mob: 0 },
  Forklift: { pricingModel: 'HOURLY', base: 1200, unit: 350, mob: 500 },
  'Lowbed Truck': { pricingModel: 'PER_KM', base: 2800, unit: 50, mob: 0 },
  'Tipper Truck': { pricingModel: 'PER_KM', base: 1200, unit: 30, mob: 0 },
  'Towing Truck': { pricingModel: 'PER_KM', base: 900, unit: 25, mob: 0 },
  Trailer: { pricingModel: 'PER_KM', base: 1600, unit: 34, mob: 0 },
  Backhoe: { pricingModel: 'DAILY', base: 3200, unit: 3200, mob: 1200 },
  'Dozer / Bulldozer': { pricingModel: 'DAILY', base: 5200, unit: 5200, mob: 2000 },
  Excavator: { pricingModel: 'DAILY', base: 4500, unit: 4500, mob: 1800 },
  Grader: { pricingModel: 'DAILY', base: 4800, unit: 4800, mob: 1800 },
  'Payloader / Wheel Loader': { pricingModel: 'DAILY', base: 3800, unit: 3800, mob: 1500 },
  'Roller / Compactor': { pricingModel: 'DAILY', base: 2800, unit: 2800, mob: 1100 },
  'Water Tanker': { pricingModel: 'DAILY', base: 2200, unit: 2200, mob: 600 },
};

export function formatGhs(amount: number): string {
  return `GHS ${Math.round(amount).toLocaleString('en-GH')}`;
}

export function getRateGhs(eq?: EquipmentRateInfo | null) {
  if (!eq) return { pricingModel: 'PER_KM', base: 1800, unit: 35, mob: 0 };
  const fallback = DEFAULT_RATES_BY_NAME[eq.name] ?? { pricingModel: 'PER_KM', base: 1800, unit: 35, mob: 0 };
  const base = eq.baseRateMinor !== undefined ? Number(eq.baseRateMinor) / 100 : fallback.base;
  const unit = eq.unitRateMinor !== undefined ? Number(eq.unitRateMinor) / 100 : fallback.unit;
  const mob = eq.mobilisationMinor !== undefined ? Number(eq.mobilisationMinor) / 100 : fallback.mob;
  return {
    pricingModel: eq.pricingModel || fallback.pricingModel,
    base: Number.isFinite(base) ? base : fallback.base,
    unit: Number.isFinite(unit) ? unit : fallback.unit,
    mob: Number.isFinite(mob) ? mob : fallback.mob,
  };
}

export function estimateRouteKm(pickup?: string, delivery?: string): number {
  const combined = `${pickup || ''} ${delivery || ''}`.toLowerCase();
  if (combined.includes('kumasi')) return 248;
  if (combined.includes('takoradi') || combined.includes('tarkwa')) return 235;
  if (combined.includes('tamale')) return 615;
  if (combined.includes('cape coast')) return 148;
  if (combined.includes('koforidua')) return 85;
  if (combined.includes('kasoa')) return 34;
  if (combined.includes('tema') && combined.includes('spintex')) return 18;
  if (combined.includes('tema')) return 28;
  return 24;
}

interface PriceEstimateCardProps {
  equipment?: EquipmentRateInfo | null;
  mode: 'TRANSPORT' | 'MACHINERY' | 'CARGO_STATION';
  pickupAddress?: string;
  deliveryAddress?: string;
  durationValue?: string;
  durationUnit?: 'HOURS' | 'DAYS' | 'WEEKS' | 'MONTHS';
  includeMobilisation?: boolean;
  stagingDays?: string;
}

export default function PriceEstimateCard({
  equipment,
  mode,
  pickupAddress,
  deliveryAddress,
  durationValue = '1',
  durationUnit = 'DAYS',
  includeMobilisation = true,
  stagingDays = '2',
}: PriceEstimateCardProps) {
  const rates = getRateGhs(equipment);
  const rows: Array<{ label: string; value: number }> = [];

  if (mode === 'MACHINERY') {
    const qty = Math.max(1, parseInt(durationValue, 10) || 1);
    const days =
      durationUnit === 'HOURS'
        ? Math.max(0.5, qty / 8)
        : durationUnit === 'WEEKS'
        ? qty * 7
        : durationUnit === 'MONTHS'
        ? qty * 26
        : qty;
    const dailyRate = rates.unit > 0 ? rates.unit : rates.base;
    const usageTotal = dailyRate * days;
    rows.push({
      label: `Equipment Hire (${qty} ${durationUnit.toLowerCase()} @ ${formatGhs(dailyRate)}/day)`,
      value: usageTotal,
    });
    if (includeMobilisation && rates.mob > 0) {
      rows.push({ label: 'Lowbed Mobilisation & Return', value: rates.mob });
    }
  } else if (mode === 'CARGO_STATION') {
    const days = Math.max(1, parseInt(stagingDays, 10) || 1);
    rows.push({ label: 'Hub Handling & Dispatch Base', value: rates.base });
    if (days > 1) {
      rows.push({ label: `Staging & Storage (${days} days)`, value: (days - 1) * 250 });
    }
  } else {
    const km = estimateRouteKm(pickupAddress, deliveryAddress);
    rows.push({ label: 'Base Dispatch & Loading', value: rates.base });
    if (rates.pricingModel === 'HOURLY') {
      const hrs = 4;
      rows.push({ label: `Est. Operation (${hrs} hrs @ ${formatGhs(rates.unit)}/hr)`, value: rates.unit * hrs });
    } else if (rates.unit > 0) {
      rows.push({ label: `Est. Haulage (~${km} km @ ${formatGhs(rates.unit)}/km)`, value: rates.unit * km });
    }
    if (rates.mob > 0) {
      rows.push({ label: 'Equipment Mobilisation', value: rates.mob });
    }
  }

  const total = rows.reduce((sum, r) => sum + r.value, 0);
  const deposit = Math.round(total * 0.3);

  return (
    <div
      style={{
        backgroundColor: colors.waybillPaper,
        border: `1.5px solid ${colors.asphalt}`,
        borderRadius: '10px',
        padding: '13px 14px',
        marginBottom: '12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Calculator size={15} color={colors.asphalt} />
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.06em',
              color: colors.asphalt,
              textTransform: 'uppercase',
            }}
          >
            Instant Price Estimate
          </span>
        </div>
        <span
          style={{
            fontSize: '10px',
            fontWeight: 700,
            padding: '2px 7px',
            borderRadius: '999px',
            backgroundColor: colors.safetyAmber,
            color: colors.asphalt,
          }}
        >
          Live GHS Rate
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '8px' }}>
        {rows.map((r) => (
          <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: colors.gravelGrey }}>
            <span>{r.label}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: colors.asphalt }}>{formatGhs(r.value)}</span>
          </div>
        ))}
      </div>

      <div
        style={{
          borderTop: `1px dashed ${colors.grey300}`,
          paddingTop: '8px',
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: colors.asphalt }}>Estimated Total</div>
          <div style={{ fontSize: '10px', color: colors.gravelGrey, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
            <ShieldCheck size={11} color={colors.weighbridgeGreen} />
            <span>30% booking deposit: {formatGhs(deposit)}</span>
          </div>
        </div>
        <div
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '20px',
            fontWeight: 800,
            color: colors.asphalt,
          }}
        >
          {formatGhs(total)}
        </div>
      </div>
    </div>
  );
}
