'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { colors } from '@vagrova/ui';
import {
  ArrowRight,
  Bus,
  ChevronRight,
  Construction,
  LocateFixed,
  Navigation,
  Package,
  Search,
  Siren,
  Truck,
} from 'lucide-react';
import { NotificationBellButton } from '@/components/InAppNotifications';

const RouteMap = dynamic(() => import('@/components/RouteMap'), {
  ssr: false,
  loading: () => (
    <div style={{ height: '360px', backgroundColor: '#E5ECEE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.gravelGrey, fontSize: '13px', fontWeight: 600 }}>
      Loading Accra map...
    </div>
  ),
});

interface YangoHomeScreenProps {
  customerName: string;
  isReturningClient: boolean;
  totalTrips: number;
  language: 'EN' | 'TWI' | 'GA';
  onCycleLanguage: () => void;
  unreadNotifications: number;
  onOpenNotifications: () => void;
  pickupAddress: string;
  popularLocations: ReadonlyArray<{ name: string; area: string; eta: string }>;
  lastBooking: {
    equipmentId?: string | null;
    equipmentName: string;
    serviceGroup: 'TRANSPORT' | 'MACHINERY';
    pickupAddress: string;
    deliveryAddress: string;
  } | null;
  onQuickDestination: (destination: string) => void;
  onOpenSearch: () => void;
  onSelectCategory: (category: 'CRANE' | 'CARGO' | 'MACHINERY' | 'BUS') => void;
  onEmergencyDelivery: () => void;
  onRebookLast: () => void;
}

export default function YangoHomeScreen({
  customerName,
  isReturningClient,
  totalTrips,
  language,
  onCycleLanguage,
  unreadNotifications,
  onOpenNotifications,
  pickupAddress,
  popularLocations,
  lastBooking,
  onQuickDestination,
  onOpenSearch,
  onSelectCategory,
  onEmergencyDelivery,
  onRebookLast,
}: YangoHomeScreenProps) {
  const services: Array<{
    id: 'CRANE' | 'CARGO' | 'MACHINERY' | 'BUS';
    label: string;
    icon: any;
    bg: string;
    accent: string;
  }> = [
    { id: 'CRANE', label: 'Crane', icon: Construction, bg: '#F2F5F6', accent: colors.asphalt },
    { id: 'CARGO', label: 'Cargo', icon: Package, bg: '#FFF7E0', accent: '#B45309' },
    { id: 'MACHINERY', label: 'Machinery', icon: Truck, bg: '#EBF2F3', accent: colors.asphalt },
    { id: 'BUS', label: 'Bus', icon: Bus, bg: '#EEF2FF', accent: '#1E3A8A' },
  ];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingBottom: '88px', backgroundColor: colors.roadWhite }}>
      {/* 1. Full-Width Map Hero (Yango Style) */}
      <div style={{ position: 'relative', height: '355px', width: '100%', overflow: 'hidden', backgroundColor: '#E5ECEE' }}>
        <RouteMap
          height="355px"
          showLiveTruck={false}
          pickupLabel={pickupAddress || 'Accra, GH'}
          dropoffLabel="Tema Port"
        />

        {/* Soft Top White-to-Transparent Gradient so Header & "WHERE TO?" stay razor-sharp */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '185px',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.82) 58%, rgba(255,255,255,0) 100%)',
            pointerEvents: 'none',
            zIndex: 450,
          }}
        />

        {/* Floating Header + WHERE TO? + Quick Destination Pills */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 500,
            padding: 'max(14px, env(safe-area-inset-top)) 16px 0',
          }}
        >
          {/* Top Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '999px',
                  backgroundColor: colors.asphalt,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(13, 109, 120, 0.28)',
                }}
              >
                <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: '18px', color: colors.safetyAmber }}>
                  V
                </span>
              </div>
              {customerName && (
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: colors.asphalt,
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    padding: '4px 10px',
                    borderRadius: '999px',
                    border: `1px solid ${colors.grey200}`,
                  }}
                >
                  {isReturningClient ? `Welcome back, ${customerName.split(' ')[0]}` : `Hi, ${customerName.split(' ')[0]}`}
                  {totalTrips > 0 ? ` · ${totalTrips}` : ''}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={onCycleLanguage}
                style={{
                  height: '34px',
                  padding: '0 8px',
                  borderRadius: '8px',
                  border: `1px solid ${colors.grey200}`,
                  backgroundColor: colors.roadWhite,
                  fontSize: '11px',
                  fontWeight: 700,
                  color: colors.asphalt,
                }}
              >
                {language}
              </button>
              <NotificationBellButton
                unreadCount={unreadNotifications}
                onClick={onOpenNotifications}
              />
            </div>
          </div>

          {/* Current Location Breadcrumb */}
          <button
            onClick={onOpenSearch}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              fontWeight: 700,
              color: colors.asphalt,
              marginBottom: '2px',
              cursor: 'pointer',
            }}
          >
            <Navigation size={11} color={colors.asphalt} />
            <span style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {pickupAddress || 'Accra, GH'}
            </span>
            <ChevronRight size={13} />
          </button>

          {/* Bold WHERE TO? Headline */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <Search size={20} color={colors.asphalt} strokeWidth={2.6} />
            <h1
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '25px',
                fontWeight: 900,
                letterSpacing: '-0.02em',
                color: '#111827',
                margin: 0,
              }}
            >
              WHERE TO?
            </h1>
          </div>

          {/* Horizontal Quick-Destination Pills */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
            {popularLocations.slice(0, 3).map((loc) => (
              <button
                key={loc.name}
                onClick={() => onQuickDestination(loc.name)}
                style={{
                  flexShrink: 0,
                  backgroundColor: colors.roadWhite,
                  border: `1px solid ${colors.grey200}`,
                  borderRadius: '999px',
                  padding: '7px 12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: colors.asphalt,
                  cursor: 'pointer',
                }}
              >
                <span style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {loc.name.split(',')[0]}
                </span>
                <span style={{ fontSize: '11px', color: colors.gravelGrey, fontWeight: 600 }}>{loc.eta}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Center Floating Pickup Badge */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '62%',
            transform: 'translate(-50%, -50%)',
            zIndex: 480,
            backgroundColor: colors.roadWhite,
            borderRadius: '12px',
            padding: '6px 10px',
            boxShadow: '0 8px 20px rgba(0,0,0,0.16)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '8px',
              backgroundColor: colors.asphalt,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Truck size={14} color={colors.safetyAmber} />
          </div>
          <div>
            <div style={{ fontSize: '10px', color: colors.gravelGrey, fontWeight: 600, lineHeight: 1.1 }}>Pickup</div>
            <div style={{ fontSize: '12px', color: colors.asphalt, fontWeight: 800, lineHeight: 1.2 }}>Ready</div>
          </div>
        </div>

        {/* Bottom-Right GPS Re-center Button */}
        <button
          onClick={onOpenSearch}
          aria-label="Center pickup location"
          style={{
            position: 'absolute',
            right: '14px',
            bottom: '38px',
            zIndex: 500,
            width: '40px',
            height: '40px',
            borderRadius: '999px',
            backgroundColor: colors.roadWhite,
            border: `1px solid ${colors.grey200}`,
            boxShadow: '0 6px 16px rgba(0,0,0,0.14)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <LocateFixed size={18} color={colors.asphalt} />
        </button>
      </div>

      {/* 2. White Rounded Bottom Sheet Overlapping Map */}
      <div
        style={{
          marginTop: '-24px',
          position: 'relative',
          zIndex: 520,
          backgroundColor: colors.roadWhite,
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          padding: '18px 16px 14px',
          boxShadow: '0 -8px 24px rgba(0, 0, 0, 0.08)',
        }}
      >
        {/* 4 Service Categories: 1. Crane  2. Cargo  3. Machinery  4. Bus */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '14px' }}>
          {services.map((svc) => {
            const Icon = svc.icon;
            return (
              <button
                key={svc.id}
                onClick={() => onSelectCategory(svc.id)}
                className="vagrova-card-tap"
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                }}
              >
                <div
                  style={{
                    width: '100%',
                    height: '62px',
                    borderRadius: '16px',
                    backgroundColor: svc.bg,
                    border: `1px solid ${colors.grey200}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={26} color={svc.accent} strokeWidth={2.1} />
                </div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: colors.asphalt }}>{svc.label}</span>
              </button>
            );
          })}
        </div>

        {/* Emergency Delivery Priority Section */}
        <button
          onClick={onEmergencyDelivery}
          className="vagrova-card-tap"
          style={{
            width: '100%',
            backgroundColor: '#FFF5F5',
            border: '1.5px solid #F5C2C7',
            borderRadius: '16px',
            padding: '12px 14px',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            textAlign: 'left',
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                backgroundColor: colors.rustRed,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Siren size={19} color="#FFFFFF" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '14px', fontWeight: 800, color: '#87241B' }}>
                Emergency Delivery
              </div>
              <div style={{ fontSize: '11px', color: '#7C2712', marginTop: '1px' }}>
                Urgent priority dispatch &amp; recovery
              </div>
            </div>
          </div>
          <span
            style={{
              backgroundColor: colors.rustRed,
              color: '#FFFFFF',
              fontSize: '11px',
              fontWeight: 800,
              padding: '6px 10px',
              borderRadius: '999px',
              flexShrink: 0,
            }}
          >
            Urgent →
          </span>
        </button>

        {/* Pill "Where to?" Search Bar (Yango Bottom Pill) */}
        <button
          onClick={onOpenSearch}
          className="vagrova-card-tap"
          style={{
            width: '100%',
            height: '54px',
            borderRadius: '999px',
            backgroundColor: colors.waybillPaper,
            border: `1px solid ${colors.grey200}`,
            padding: '0 10px 0 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: lastBooking ? '12px' : '10px',
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Search size={18} color={colors.asphalt} />
            <span style={{ fontSize: '15px', fontWeight: 700, color: colors.asphalt }}>Where to?</span>
          </div>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '999px',
              backgroundColor: colors.asphalt,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ArrowRight size={17} color={colors.safetyAmber} />
          </div>
        </button>

        {/* Returning Client Quick Rebook Card (if available) */}
        {lastBooking && (
          <div
            style={{
              backgroundColor: colors.asphalt,
              color: colors.roadWhite,
              borderRadius: '14px',
              padding: '11px 14px',
              marginBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
            }}
          >
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700, color: colors.safetyAmber }}>
                QUICK REBOOK · {lastBooking.equipmentName.toUpperCase()}
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.88)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
                {lastBooking.serviceGroup === 'MACHINERY'
                  ? lastBooking.pickupAddress
                  : `${lastBooking.pickupAddress} → ${lastBooking.deliveryAddress}`}
              </div>
            </div>
            <button
              onClick={onRebookLast}
              style={{
                backgroundColor: colors.safetyAmber,
                color: colors.asphalt,
                border: 'none',
                borderRadius: '8px',
                padding: '7px 11px',
                fontSize: '12px',
                fontWeight: 800,
                flexShrink: 0,
                cursor: 'pointer',
              }}
            >
              Rebook →
            </button>
          </div>
        )}

        {/* Legal & Compliance Footer */}
        <footer
          aria-label="Legal and compliance links"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '10px',
            paddingTop: '4px',
            fontSize: '11px',
            color: colors.gravelGrey,
          }}
        >
          <Link href="/legal?tab=privacy" style={{ color: colors.gravelGrey, textDecoration: 'underline' }}>Privacy</Link>
          <Link href="/legal?tab=terms" style={{ color: colors.gravelGrey, textDecoration: 'underline' }}>Terms</Link>
          <Link href="/legal?tab=refund" style={{ color: colors.gravelGrey, textDecoration: 'underline' }}>Refunds</Link>
          <Link href="/legal?tab=cookies" style={{ color: colors.gravelGrey, textDecoration: 'underline' }}>Cookies</Link>
          <Link href="/legal?tab=deletion" style={{ color: colors.gravelGrey, textDecoration: 'underline' }}>Data Deletion</Link>
        </footer>
      </div>
    </div>
  );
}
