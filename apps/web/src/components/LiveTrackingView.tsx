'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { colors, PlateNumber, StatusChip } from '@vagrova/ui';
import {
  ArrowLeft,
  CheckCircle2,
  MessageCircle,
  Navigation,
  Phone,
  ShieldCheck,
  Star,
  User,
} from 'lucide-react';

const RouteMap = dynamic(() => import('@/components/RouteMap'), {
  ssr: false,
  loading: () => (
    <div style={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.waybillPaper, color: colors.gravelGrey, fontSize: '13px', fontWeight: 600 }}>
      Loading live GPS map...
    </div>
  ),
});

const TRIP_STEPS = [
  { key: 'CONFIRMED', label: 'Confirmed' },
  { key: 'EN_ROUTE', label: 'En Route' },
  { key: 'LOADING', label: 'Loading' },
  { key: 'IN_TRANSIT', label: 'In Transit' },
  { key: 'DELIVERED', label: 'Delivered' },
] as const;

function resolveStepIndex(status?: string | null): number {
  const s = (status || '').toUpperCase();
  if (s.includes('DELIVER') || s.includes('COMPLET')) return 4;
  if (s.includes('TRANSIT')) return 3;
  if (s.includes('LOAD') || s.includes('ARRIV')) return 2;
  if (s.includes('DISPATCH') || s.includes('EN_ROUTE') || s.includes('PICKUP')) return 1;
  return 1; // Default active demo: En Route to Pickup
}

interface LiveTrackingViewProps {
  jobNumber: string;
  pickupLabel: string;
  dropoffLabel: string;
  liveCoords: { lat: number; lng: number } | null;
  liveTripStatus: string | null;
  driverName: string;
  driverPhotoUrl: string | null;
  driverPhone?: string;
  truckLabel?: string;
  plateNumber?: string;
  onBack: () => void;
}

export default function LiveTrackingView({
  jobNumber,
  pickupLabel,
  dropoffLabel,
  liveCoords,
  liveTripStatus,
  driverName,
  driverPhotoUrl,
  driverPhone = '+233248812290',
  truckLabel = 'MAN TGS 33.400 · Flatbed 40t',
  plateNumber = 'GW-2290-22',
  onBack,
}: LiveTrackingViewProps) {
  const activeStep = resolveStepIndex(liveTripStatus);
  const waNumber = driverPhone.replace(/[^0-9]/g, '');

  return (
    <div className="anim-screen-slide" style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingBottom: '92px', backgroundColor: colors.waybillPaper }}>
      {/* Clean Header */}
      <header
        style={{
          backgroundColor: colors.roadWhite,
          padding: '12px 16px',
          borderBottom: `1px solid ${colors.grey200}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <button
          onClick={onBack}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            border: `1px solid ${colors.grey200}`,
            backgroundColor: colors.grey100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ArrowLeft size={18} color={colors.asphalt} />
        </button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 800, color: colors.asphalt }}>
            {jobNumber}
          </div>
          <div style={{ fontSize: '10px', color: colors.gravelGrey, fontWeight: 600 }}>Live Dispatch Tracking</div>
        </div>
        <StatusChip status="heading_to_pickup" size="sm" />
      </header>

      {/* Full-Width Live GPS Map with Floating ETA + Live Pill */}
      <div style={{ position: 'relative', height: '250px', backgroundColor: '#DDE7E9', borderBottom: `1px solid ${colors.grey200}` }}>
        <div
          style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            zIndex: 1000,
            backgroundColor: colors.asphalt,
            color: colors.roadWhite,
            padding: '5px 10px',
            borderRadius: '999px',
            fontSize: '11px',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 4px 12px rgba(8, 77, 85, 0.28)',
          }}
        >
          <span
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '999px',
              backgroundColor: colors.safetyAmber,
              display: 'inline-block',
            }}
          />
          <Navigation size={11} color={colors.safetyAmber} />
          <span>LIVE GPS</span>
        </div>

        <div
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            zIndex: 1000,
            backgroundColor: colors.safetyAmber,
            color: colors.asphalt,
            padding: '5px 10px',
            borderRadius: '999px',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            fontWeight: 800,
            boxShadow: '0 4px 12px rgba(0,0,0,0.14)',
          }}
        >
          ETA 28 MIN
        </div>

        <RouteMap
          height="250px"
          showLiveTruck={true}
          liveCoords={liveCoords}
          pickupLabel={pickupLabel}
          dropoffLabel={dropoffLabel}
        />
      </div>

      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* 5-Step Uber-Style Live Progress Timeline */}
        <div
          style={{
            backgroundColor: colors.roadWhite,
            border: `1px solid ${colors.grey200}`,
            borderRadius: '12px',
            padding: '14px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '12px' }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: 800, color: colors.asphalt }}>
              {liveTripStatus ? liveTripStatus.replace(/_/g, ' ') : 'Driver is 12 km from pickup'}
            </div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: colors.weighbridgeGreen }}>On Schedule</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative' }}>
            {TRIP_STEPS.map((step, idx) => {
              const isDone = idx < activeStep;
              const isCurrent = idx === activeStep;
              return (
                <div key={step.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                  <div
                    style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '999px',
                      backgroundColor: isDone
                        ? colors.weighbridgeGreen
                        : isCurrent
                        ? colors.safetyAmber
                        : colors.grey100,
                      border: isCurrent ? `2px solid ${colors.asphalt}` : `1px solid ${colors.grey200}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 2,
                    }}
                  >
                    {isDone ? (
                      <CheckCircle2 size={13} color="#FFFFFF" />
                    ) : (
                      <span
                        style={{
                          width: '7px',
                          height: '7px',
                          borderRadius: '999px',
                          backgroundColor: isCurrent ? colors.asphalt : colors.grey300,
                        }}
                      />
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: '9px',
                      fontWeight: isCurrent || isDone ? 800 : 600,
                      color: isCurrent ? colors.asphalt : colors.gravelGrey,
                      marginTop: '5px',
                      textAlign: 'center',
                    }}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Driver & Fleet Card with Call + WhatsApp */}
        <div
          style={{
            backgroundColor: colors.roadWhite,
            border: `1px solid ${colors.grey200}`,
            borderRadius: '12px',
            padding: '14px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '999px',
                  backgroundColor: colors.waybillPaper,
                  border: `2px solid ${colors.asphalt}`,
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {driverPhotoUrl ? (
                  <img src={driverPhotoUrl} alt={driverName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <User size={22} color={colors.asphalt} />
                )}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: 800, color: colors.asphalt }}>
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{driverName}</span>
                  <ShieldCheck size={15} color={colors.weighbridgeGreen} />
                </div>
                <div style={{ fontSize: '12px', color: colors.gravelGrey, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '1px' }}>
                  <span style={{ fontWeight: 700, color: colors.weighbridgeGreen }}>Verified Operator</span>
                  <span>· {truckLabel}</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
            <a
              href={`tel:${driverPhone}`}
              style={{
                height: '40px',
                backgroundColor: colors.asphalt,
                color: colors.roadWhite,
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <Phone size={14} /> Call Driver
            </a>
            <a
              href={`https://wa.me/${waNumber}?text=${encodeURIComponent(`Hello ${driverName}, checking on Vagrova job ${jobNumber}`)}`}
              target="_blank"
              rel="noreferrer"
              style={{
                height: '40px',
                backgroundColor: '#E8F7EF',
                color: '#13573C',
                border: '1px solid #B7E4CC',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <MessageCircle size={14} /> WhatsApp
            </a>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${colors.grey200}`, paddingTop: '10px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: colors.gravelGrey, letterSpacing: '0.05em' }}>VERIFIED PLATE</span>
            <PlateNumber plate={plateNumber} size="sm" />
          </div>
        </div>

        {/* Delivery Confirmation PIN */}
        <div
          style={{
            backgroundColor: colors.asphalt,
            color: colors.roadWhite,
            borderRadius: '12px',
            padding: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: colors.safetyAmber, letterSpacing: '0.06em' }}>
              DELIVERY CONFIRMATION PIN
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.78)', marginTop: '2px' }}>
              Share with driver only after offloading
            </div>
          </div>
          <div
            style={{
              backgroundColor: colors.safetyAmber,
              color: colors.asphalt,
              fontFamily: 'var(--font-mono)',
              fontSize: '21px',
              fontWeight: 800,
              letterSpacing: '0.14em',
              padding: '6px 12px',
              borderRadius: '8px',
            }}
          >
            7428
          </div>
        </div>
      </div>
    </div>
  );
}
