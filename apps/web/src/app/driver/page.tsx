'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import {
  colors,
  PlateNumber,
  VEHICLE_TYPES,
  VEHICLE_LABELS,
  type VehicleType,
} from '@vagrova/ui';
import { vagrovaApi } from '@/lib/api';
import { connectTrackingSocket } from '@/lib/socket';
import {
  Phone,
  ShieldCheck,
  Truck,
  FileText,
  Upload,
  CheckCircle2,
  Clock,
  MapPin,
  Navigation,
  Wallet,
  ChevronRight,
  ChevronLeft,
  UserCheck,
  AlertCircle,
  Radio,
  Sparkles,
  Check,
  X,
  ArrowUpRight,
  CircleDot,
  Camera,
  User,
} from 'lucide-react';

const RouteMap = dynamic(() => import('@/components/RouteMap'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: 220,
        borderRadius: 18,
        backgroundColor: colors.waybillPaper,
        border: `1px solid ${colors.grey200}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: colors.gravelGrey,
        fontSize: 13,
        fontWeight: 600,
      }}
    >
      Loading route map...
    </div>
  ),
});

type Screen =
  | 'welcome'
  | 'signup_phone'
  | 'signup_otp'
  | 'signup_role'
  | 'signup_details'
  | 'signup_truck'
  | 'signup_docs'
  | 'dashboard'
  | 'offer'
  | 'active_trip'
  | 'earnings'
  | 'docs';

type Availability = 'AVAILABLE' | 'BUSY' | 'OFFLINE';

type TripPhase =
  | 'heading_to_pickup'
  | 'arrived_pickup'
  | 'loaded'
  | 'in_transit'
  | 'arrived_delivery'
  | 'delivered';

type DriverRole = 'DRIVER_ONLY' | 'OWNER_ONLY' | 'OWNER_AND_DRIVER';

interface UploadedDoc {
  id: string;
  label: string;
  requiredFor: string;
  fileName: string | null;
  status: 'PENDING' | 'UPLOADED' | 'VERIFIED';
  expiry: string;
}

const STEP_LABELS: Record<TripPhase, string> = {
  heading_to_pickup: 'Heading to Pickup',
  arrived_pickup: 'Arrived at Pickup',
  loaded: 'Cargo Loaded',
  in_transit: 'In Transit',
  arrived_delivery: 'Arrived at Delivery',
  delivered: 'Delivered',
};

const NEXT_STEP_ACTION: Record<TripPhase, { next: TripPhase; cta: string; hint: string } | null> = {
  heading_to_pickup: {
    next: 'arrived_pickup',
    cta: 'I Have Arrived at Pickup',
    hint: 'Tap once you reach the loading gate',
  },
  arrived_pickup: {
    next: 'loaded',
    cta: 'Cargo Loaded — Ready to Roll',
    hint: 'Confirm load is secured and tarped',
  },
  loaded: {
    next: 'in_transit',
    cta: 'Start Transit to Destination',
    hint: 'Waybill active · Live GPS streaming',
  },
  in_transit: {
    next: 'arrived_delivery',
    cta: 'Arrived at Dropoff Site',
    hint: 'Tap at the customer offloading gate',
  },
  arrived_delivery: {
    next: 'delivered',
    cta: 'Confirm Delivery Complete',
    hint: 'Ensure consignee sign-off before tapping',
  },
  delivered: null,
};

const PHASE_ORDER: TripPhase[] = [
  'heading_to_pickup',
  'arrived_pickup',
  'loaded',
  'in_transit',
  'arrived_delivery',
  'delivered',
];

const INITIAL_DOCS: UploadedDoc[] = [
  { id: 'ghana_card', label: 'Ghana Card (National ID)', requiredFor: 'All providers', fileName: 'ghana-card-yaw.jpg', status: 'VERIFIED', expiry: '2029-08-14' },
  { id: 'drivers_license', label: "Driver's License (Class C / Heavy)", requiredFor: 'Drivers', fileName: 'license-class-c.jpg', status: 'VERIFIED', expiry: '2027-04-02' },
  { id: 'dvla_roadworthy', label: 'DVLA Roadworthiness Certificate', requiredFor: 'Truck Owners', fileName: 'dvla-roadworthy.pdf', status: 'VERIFIED', expiry: '2026-12-30' },
  { id: 'insurance', label: 'Commercial Motor Insurance', requiredFor: 'Truck Owners', fileName: 'enterprise-motor-2026.pdf', status: 'VERIFIED', expiry: '2027-01-15' },
  { id: 'truck_photo', label: 'Clear Truck Photo (Plate Visible)', requiredFor: 'Truck Owners', fileName: 'man-tgs-front.jpg', status: 'VERIFIED', expiry: '—' },
];

const SIGNUP_STEPS: Screen[] = [
  'signup_phone',
  'signup_otp',
  'signup_role',
  'signup_details',
  'signup_truck',
  'signup_docs',
];

export default function DriverAppPage() {
  const [screen, setScreen] = useState<Screen>('dashboard');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('onboarding') === '1') {
        setScreen('welcome');
      }
    }
  }, []);

  // Auth & API state
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [truckId, setTruckId] = useState<string | null>(null);
  const [activeOfferId, setActiveOfferId] = useState<string | null>(null);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [apiBusy, setApiBusy] = useState(false);
  const [driverPhotoUrl, setDriverPhotoUrl] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vagrova_driver_photo');
      if (saved) setDriverPhotoUrl(saved);
    }
  }, []);

  useEffect(() => {
    if (!authToken) return;
    const socket = connectTrackingSocket(authToken);

    socket.on('jobOffer', (offer: any) => {
      if (offer?.offerId) setActiveOfferId(offer.offerId);
      if (offer?.jobId) setActiveJobId(offer.jobId);
      if (offer?.jobNumber) setActiveJobRef(offer.jobNumber);
      setActiveRoute((prev) => ({
        ...prev,
        pickup: offer.pickupAddress || prev.pickup,
        dropoff: offer.deliveryAddress || prev.dropoff,
        cargo: offer.cargo || prev.cargo,
      }));
      setOfferCountdown(offer.countdownSeconds || 60);
      setHasIncomingOffer(true);
    });

    const gpsTimer = setInterval(() => {
      if (!activeJobId) return;
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            socket.emit('driverPingLocation', {
              jobId: activeJobId,
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            });
          },
          () => {
            // Fallback Accra-Tema corridor ping if browser location blocked
            socket.emit('driverPingLocation', {
              jobId: activeJobId,
              latitude: 5.6335,
              longitude: -0.132,
            });
          },
        );
      }
    }, 5000);

    return () => {
      clearInterval(gpsTimer);
      socket.disconnect();
    };
  }, [authToken, activeJobId]);

  const handleDriverPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = () => {
        const result = typeof reader.result === 'string' ? reader.result : null;
        if (result) {
          setDriverPhotoUrl(result);
          localStorage.setItem('vagrova_driver_photo', result);
          localStorage.setItem('vagrova_driver_name', fullName);
        }
      };
      reader.readAsDataURL(file);

      if (authToken) {
        await vagrovaApi.uploadFile(authToken, file, 'avatars');
      }
    } catch {
      // Keep local preview even if offline
    } finally {
      setPhotoUploading(false);
    }
  };

  // Sign-up state
  const [phone, setPhone] = useState('024 812 3390');
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [role, setRole] = useState<DriverRole>('OWNER_AND_DRIVER');
  const [fullName, setFullName] = useState('Yaw Boateng');
  const [ghanaCardNo, setGhanaCardNo] = useState('GHA-719284012-4');
  const [licenseClass, setLicenseClass] = useState('Class C (Heavy Goods)');
  const [nextOfKin, setNextOfKin] = useState('Abena Boateng · 020 554 8810');
  const [vehicleType, setVehicleType] = useState<VehicleType>('flatbed');
  const [plateNumber, setPlateNumber] = useState('GW-2290-22');
  const [makeModel, setMakeModel] = useState('MAN TGS 33.400');
  const [payloadTons, setPayloadTons] = useState('40');
  const [docs, setDocs] = useState<UploadedDoc[]>(INITIAL_DOCS);

  // Dashboard & Dispatch state
  const [availability, setAvailability] = useState<Availability>('AVAILABLE');
  const [hasIncomingOffer, setHasIncomingOffer] = useState(true);
  const [offerCountdown, setOfferCountdown] = useState(42);
  const [activePhase, setActivePhase] = useState<TripPhase>('heading_to_pickup');
  const [activeJobRef, setActiveJobRef] = useState('VGJ-004819');
  const [activeRoute, setActiveRoute] = useState({
    pickup: 'Kasoa Tollbooth',
    dropoff: 'Accra Industrial Area',
    cargo: 'Cement Bags (30t)',
    distanceKm: 34.2,
    payoutGhs: 6250,
  });

  useEffect(() => {
    if (!hasIncomingOffer || availability !== 'AVAILABLE') return;
    const timer = setInterval(() => {
      setOfferCountdown((prev) => (prev <= 1 ? 45 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [hasIncomingOffer, availability]);

  const handleAcceptOffer = async () => {
    if (authToken && activeOfferId) {
      try {
        await vagrovaApi.respondToOffer(authToken, activeOfferId, 'ACCEPT');
      } catch {
        // Fallback to local state if API is offline
      }
    }
    setHasIncomingOffer(false);
    setAvailability('BUSY');
    setActiveJobRef('VGJ-004824');
    setActiveRoute({
      pickup: 'Tema Port Gate 3',
      dropoff: 'Spintex Industrial',
      cargo: 'Steel Beams (18t)',
      distanceKm: 28.5,
      payoutGhs: 5480,
    });
    setActivePhase('heading_to_pickup');
    setScreen('active_trip');
  };

  const handleAdvanceStep = async () => {
    const next = NEXT_STEP_ACTION[activePhase];
    if (!next) return;
    if (authToken && activeJobId) {
      try {
        await vagrovaApi.advanceTripStep(authToken, activeJobId, {
          nextStatus: next.next.toUpperCase(),
        });
      } catch {
        // Fallback to local state if API is offline
      }
    }
    setActivePhase(next.next);
    if (next.next === 'delivered') {
      setAvailability('AVAILABLE');
    }
  };

  const handleAvailabilityChange = async (nextStatus: Availability) => {
    setAvailability(nextStatus);
    if (authToken && truckId) {
      try {
        await vagrovaApi.updateTruckAvailability(authToken, truckId, nextStatus);
      } catch {
        // Keep optimistic UI status
      }
    }
  };

  const handleSimulateDocUpload = (docId: string) => {
    setDocs((prev) =>
      prev.map((d) =>
        d.id === docId
          ? { ...d, fileName: `${docId}-upload.jpg`, status: 'UPLOADED' }
          : d
      )
    );
  };

  const firstName = fullName.trim().split(' ')[0] || 'Partner';
  const currentPhaseIdx = PHASE_ORDER.indexOf(activePhase);
  const isAuthOrWelcome = screen === 'welcome' || SIGNUP_STEPS.includes(screen);
  const signupStepIdx = SIGNUP_STEPS.indexOf(screen);

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: colors.roadWhite,
        color: colors.asphalt,
        fontFamily: 'var(--font-inter), Inter, sans-serif',
        paddingBottom: isAuthOrWelcome ? 40 : 104,
      }}
    >
      {/* Clean Minimal White Header matching Customer UI */}
      {!isAuthOrWelcome && (
        <header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 40,
            backgroundColor: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(12px)',
            borderBottom: `1px solid ${colors.grey200}`,
          }}
        >
          <div
            style={{
              maxWidth: 460,
              margin: '0 auto',
              padding: '12px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <img
                src="/vagrova-logo.png"
                alt="Vagrova"
                style={{ height: 22, width: 'auto', objectFit: 'contain' }}
              />
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: colors.gravelGrey,
                  paddingLeft: 10,
                  borderLeft: `1px solid ${colors.grey200}`,
                }}
              >
                Partner
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <PlateNumber plate={plateNumber} size="sm" />
              <button
                onClick={() => setScreen('welcome')}
                title="Preview Onboarding"
                style={{
                  padding: '6px 10px',
                  borderRadius: 999,
                  backgroundColor: colors.waybillPaper,
                  border: `1px solid ${colors.grey200}`,
                  color: colors.asphalt,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Sign Up
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Main Centered Mobile-First Container */}
      <main
        style={{
          maxWidth: 460,
          margin: '0 auto',
          padding: isAuthOrWelcome ? '20px 18px' : '18px 18px 0',
        }}
      >
        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* WELCOME SCREEN                                                   */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {screen === 'welcome' && (
          <div className="anim-screen-slide" style={{ paddingTop: 18 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 28,
              }}
            >
              <img
                src="/vagrova-logo.png"
                alt="Vagrova"
                style={{ height: 26, width: 'auto' }}
              />
              <button
                onClick={() => setScreen('dashboard')}
                style={{
                  padding: '7px 14px',
                  borderRadius: 999,
                  backgroundColor: colors.waybillPaper,
                  border: `1px solid ${colors.grey200}`,
                  color: colors.asphalt,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Skip to Dashboard
              </button>
            </div>

            <div
              style={{
                backgroundColor: colors.waybillPaper,
                borderRadius: 24,
                padding: 20,
                border: `1px solid ${colors.grey200}`,
                marginBottom: 24,
              }}
            >
              <div
                style={{
                  borderRadius: 16,
                  overflow: 'hidden',
                  backgroundColor: colors.roadWhite,
                  marginBottom: 18,
                  border: `1px solid ${colors.grey200}`,
                }}
              >
                <img
                  src="/trucks/book-truck.jpg"
                  alt="Vagrova Heavy Fleet"
                  style={{ width: '100%', height: 190, objectFit: 'cover', display: 'block' }}
                />
              </div>

              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 10px',
                  borderRadius: 999,
                  backgroundColor: colors.roadWhite,
                  border: `1px solid ${colors.grey200}`,
                  fontSize: 11,
                  fontWeight: 700,
                  color: colors.asphalt,
                  marginBottom: 12,
                }}
              >
                <Sparkles size={12} color={colors.safetyAmber} />
                DRIVER & FLEET PARTNER
              </div>

              <h1
                style={{
                  fontFamily: 'var(--font-archivo), Archivo, sans-serif',
                  fontSize: 28,
                  fontWeight: 800,
                  lineHeight: 1.12,
                  letterSpacing: '-0.02em',
                  margin: '0 0 10px',
                  color: colors.asphalt,
                }}
              >
                Keep your truck moving with{' '}
                <span style={{ borderBottom: `3px solid ${colors.safetyAmber}` }}>
                  verified loads.
                </span>
              </h1>
              <p
                style={{
                  fontSize: 14,
                  lineHeight: 1.55,
                  color: colors.gravelGrey,
                  margin: 0,
                }}
              >
                Accept vetted haulage offers from Tema Port, Takoradi, and Kumasi with instant
                digital waybills and guaranteed payouts.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                className="vagrova-card-tap"
                onClick={() => setScreen('signup_phone')}
                style={{
                  width: '100%',
                  height: 54,
                  borderRadius: 16,
                  backgroundColor: colors.safetyAmber,
                  color: colors.asphalt,
                  border: 'none',
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                Register as Driver or Owner
                <ChevronRight size={18} />
              </button>

              <button
                onClick={() => setScreen('dashboard')}
                style={{
                  width: '100%',
                  height: 50,
                  borderRadius: 16,
                  backgroundColor: colors.roadWhite,
                  color: colors.asphalt,
                  border: `1px solid ${colors.grey200}`,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Already verified? Open Dashboard
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* 6-STEP PROVIDER SIGN-UP FLOW (Clean Road White & Waybill Paper)  */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {SIGNUP_STEPS.includes(screen) && (
          <div className="anim-screen-slide" style={{ paddingTop: 10 }}>
            {/* Top Progress Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 20,
              }}
            >
              <button
                onClick={() => {
                  const prevIdx = signupStepIdx - 1;
                  setScreen(prevIdx >= 0 ? SIGNUP_STEPS[prevIdx] : 'welcome');
                }}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  backgroundColor: colors.waybillPaper,
                  border: `1px solid ${colors.grey200}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: colors.asphalt,
                  cursor: 'pointer',
                }}
              >
                <ChevronLeft size={18} />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                {SIGNUP_STEPS.map((s, idx) => (
                  <div
                    key={s}
                    style={{
                      width: idx === signupStepIdx ? 22 : 8,
                      height: 6,
                      borderRadius: 999,
                      backgroundColor:
                        idx <= signupStepIdx ? colors.safetyAmber : colors.grey200,
                      transition: 'all 200ms ease',
                    }}
                  />
                ))}
              </div>

              <span style={{ fontSize: 12, fontWeight: 700, color: colors.gravelGrey }}>
                {signupStepIdx + 1}/6
              </span>
            </div>

            {screen === 'signup_phone' && (
              <div>
                <h1
                  style={{
                    fontFamily: 'var(--font-archivo), Archivo, sans-serif',
                    fontSize: 24,
                    fontWeight: 800,
                    margin: '0 0 8px',
                  }}
                >
                  Enter your mobile number
                </h1>
                <p style={{ fontSize: 14, color: colors.gravelGrey, margin: '0 0 22px' }}>
                  We will send a 6-digit SMS code to verify your partner account.
                </p>

                <div
                  style={{
                    backgroundColor: colors.waybillPaper,
                    borderRadius: 16,
                    padding: 16,
                    border: `1px solid ${colors.grey200}`,
                    marginBottom: 20,
                  }}
                >
                  <label
                    style={{
                      display: 'block',
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: colors.gravelGrey,
                      marginBottom: 8,
                    }}
                  >
                    Ghana Mobile Number
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span
                      style={{
                        padding: '10px 12px',
                        borderRadius: 12,
                        backgroundColor: colors.roadWhite,
                        border: `1px solid ${colors.grey200}`,
                        fontSize: 14,
                        fontWeight: 700,
                      }}
                    >
                      +233
                    </span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="024 812 3390"
                      style={{
                        flex: 1,
                        height: 44,
                        padding: '0 14px',
                        borderRadius: 12,
                        backgroundColor: colors.roadWhite,
                        border: `1px solid ${colors.grey200}`,
                        fontSize: 16,
                        fontWeight: 600,
                        color: colors.asphalt,
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                <button
                  disabled={apiBusy}
                  onClick={async () => {
                    setApiBusy(true);
                    try {
                      const normalized = phone.replace(/\s+/g, '');
                      await vagrovaApi.requestOtp(normalized.startsWith('+') ? normalized : `+233${normalized.replace(/^0/, '')}`);
                    } catch {
                      // Demo fallback when API is offline
                    } finally {
                      setApiBusy(false);
                      setScreen('signup_otp');
                    }
                  }}
                  style={{
                    width: '100%',
                    height: 52,
                    borderRadius: 16,
                    backgroundColor: colors.safetyAmber,
                    color: colors.asphalt,
                    border: 'none',
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: apiBusy ? 'wait' : 'pointer',
                  }}
                >
                  {apiBusy ? 'Sending Code...' : 'Send Verification Code'}
                </button>
              </div>
            )}

            {screen === 'signup_otp' && (
              <div>
                <h1
                  style={{
                    fontFamily: 'var(--font-archivo), Archivo, sans-serif',
                    fontSize: 24,
                    fontWeight: 800,
                    margin: '0 0 8px',
                  }}
                >
                  Verify SMS code
                </h1>
                <p style={{ fontSize: 14, color: colors.gravelGrey, margin: '0 0 22px' }}>
                  Enter the 6-digit code sent to <strong>{phone}</strong>. Demo code:{' '}
                  <strong style={{ color: colors.asphalt }}>123456</strong>
                </p>

                <div
                  style={{
                    backgroundColor: colors.waybillPaper,
                    borderRadius: 16,
                    padding: 16,
                    border: `1px solid ${colors.grey200}`,
                    marginBottom: 16,
                  }}
                >
                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => {
                      setOtp(e.target.value);
                      setOtpError('');
                    }}
                    placeholder="123456"
                    style={{
                      width: '100%',
                      height: 54,
                      textAlign: 'center',
                      letterSpacing: '0.35em',
                      fontSize: 22,
                      fontWeight: 800,
                      borderRadius: 12,
                      backgroundColor: colors.roadWhite,
                      border: `1px solid ${otpError ? colors.rustRed : colors.grey200}`,
                      color: colors.asphalt,
                      outline: 'none',
                    }}
                  />
                  {otpError && (
                    <p style={{ color: colors.rustRed, fontSize: 12, marginTop: 8, fontWeight: 600 }}>
                      {otpError}
                    </p>
                  )}
                </div>

                <button
                  disabled={apiBusy}
                  onClick={async () => {
                    if (otp.trim().length !== 6) {
                      setOtpError('Enter 6 digits (try 123456 for demo)');
                      return;
                    }
                    setApiBusy(true);
                    try {
                      const normalized = phone.replace(/\s+/g, '');
                      const formatted = normalized.startsWith('+') ? normalized : `+233${normalized.replace(/^0/, '')}`;
                      const res = await vagrovaApi.verifyOtp(
                        formatted,
                        otp.trim(),
                        fullName,
                        role === 'OWNER_ONLY' ? 'OWNER' : 'DRIVER',
                      );
                      setAuthToken(res.accessToken);
                      setScreen('signup_role');
                    } catch (err) {
                      if (otp.trim() === '123456') {
                        setScreen('signup_role');
                      } else {
                        setOtpError(err instanceof Error ? err.message : 'Invalid verification code');
                      }
                    } finally {
                      setApiBusy(false);
                    }
                  }}
                  style={{
                    width: '100%',
                    height: 52,
                    borderRadius: 16,
                    backgroundColor: colors.safetyAmber,
                    color: colors.asphalt,
                    border: 'none',
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: apiBusy ? 'wait' : 'pointer',
                  }}
                >
                  {apiBusy ? 'Verifying...' : 'Verify & Continue'}
                </button>
              </div>
            )}

            {screen === 'signup_role' && (
              <div>
                <h1
                  style={{
                    fontFamily: 'var(--font-archivo), Archivo, sans-serif',
                    fontSize: 24,
                    fontWeight: 800,
                    margin: '0 0 8px',
                  }}
                >
                  How do you operate?
                </h1>
                <p style={{ fontSize: 14, color: colors.gravelGrey, margin: '0 0 20px' }}>
                  Select your partner role so we prepare the right verification checklist.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 22 }}>
                  {[
                    {
                      id: 'OWNER_AND_DRIVER' as DriverRole,
                      title: 'Owner & Driver',
                      desc: 'I own my truck and drive it myself',
                    },
                    {
                      id: 'DRIVER_ONLY' as DriverRole,
                      title: 'Driver Only',
                      desc: 'I drive a truck owned by a fleet partner',
                    },
                    {
                      id: 'OWNER_ONLY' as DriverRole,
                      title: 'Fleet / Truck Owner',
                      desc: 'I register trucks and assign drivers',
                    },
                  ].map((item) => {
                    const active = role === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setRole(item.id)}
                        style={{
                          textAlign: 'left',
                          padding: 16,
                          borderRadius: 16,
                          backgroundColor: active ? colors.roadWhite : colors.waybillPaper,
                          border: active
                            ? `2px solid ${colors.asphalt}`
                            : `1px solid ${colors.grey200}`,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: colors.asphalt }}>
                            {item.title}
                          </div>
                          <div style={{ fontSize: 13, color: colors.gravelGrey, marginTop: 2 }}>
                            {item.desc}
                          </div>
                        </div>
                        <div
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 999,
                            backgroundColor: active ? colors.safetyAmber : colors.roadWhite,
                            border: active ? 'none' : `1px solid ${colors.grey300}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {active && <Check size={14} color={colors.asphalt} />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setScreen('signup_details')}
                  style={{
                    width: '100%',
                    height: 52,
                    borderRadius: 16,
                    backgroundColor: colors.safetyAmber,
                    color: colors.asphalt,
                    border: 'none',
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Continue
                </button>
              </div>
            )}

            {screen === 'signup_details' && (
              <div>
                <h1
                  style={{
                    fontFamily: 'var(--font-archivo), Archivo, sans-serif',
                    fontSize: 24,
                    fontWeight: 800,
                    margin: '0 0 8px',
                  }}
                >
                  Personal & KYC details
                </h1>
                <p style={{ fontSize: 14, color: colors.gravelGrey, margin: '0 0 20px' }}>
                  Required for Ghana Ports & Highways clearance and payouts.
                </p>

                <div
                  style={{
                    backgroundColor: colors.waybillPaper,
                    borderRadius: 18,
                    padding: 16,
                    border: `1px solid ${colors.grey200}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    marginBottom: 14,
                  }}
                >
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 999,
                      backgroundColor: colors.roadWhite,
                      border: `2px solid ${colors.asphalt}`,
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {driverPhotoUrl ? (
                      <img src={driverPhotoUrl} alt={fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <User size={26} color={colors.asphalt} />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: colors.asphalt }}>
                      Driver Profile Picture
                    </div>
                    <div style={{ fontSize: 12, color: colors.gravelGrey, marginTop: 2 }}>
                      Shown to customers when booking your truck
                    </div>
                  </div>
                  <label
                    style={{
                      padding: '8px 12px',
                      borderRadius: 10,
                      backgroundColor: colors.safetyAmber,
                      color: colors.asphalt,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                    }}
                  >
                    <Camera size={14} />
                    {photoUploading ? 'Saving...' : driverPhotoUrl ? 'Change' : 'Upload'}
                    <input type="file" accept="image/*" onChange={handleDriverPhotoUpload} style={{ display: 'none' }} />
                  </label>
                </div>

                <div
                  style={{
                    backgroundColor: colors.waybillPaper,
                    borderRadius: 18,
                    padding: 16,
                    border: `1px solid ${colors.grey200}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 14,
                    marginBottom: 20,
                  }}
                >
                  {[
                    { label: 'Full Legal Name', value: fullName, setter: setFullName },
                    { label: 'Ghana Card Number', value: ghanaCardNo, setter: setGhanaCardNo },
                    { label: "Driver's License Class", value: licenseClass, setter: setLicenseClass },
                    { label: 'Emergency Next of Kin', value: nextOfKin, setter: setNextOfKin },
                  ].map((field) => (
                    <div key={field.label}>
                      <label
                        style={{
                          display: 'block',
                          fontSize: 11,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          color: colors.gravelGrey,
                          marginBottom: 6,
                        }}
                      >
                        {field.label}
                      </label>
                      <input
                        value={field.value}
                        onChange={(e) => field.setter(e.target.value)}
                        style={{
                          width: '100%',
                          height: 44,
                          padding: '0 12px',
                          borderRadius: 12,
                          backgroundColor: colors.roadWhite,
                          border: `1px solid ${colors.grey200}`,
                          fontSize: 14,
                          fontWeight: 600,
                          color: colors.asphalt,
                          outline: 'none',
                        }}
                      />
                    </div>
                  ))}
                </div>

                <button
                  disabled={apiBusy}
                  onClick={async () => {
                    if (authToken) {
                      setApiBusy(true);
                      try {
                        const [kinName, kinPhone] = nextOfKin.split('·').map((s) => s.trim());
                        await vagrovaApi.registerProvider(authToken, {
                          kind: role,
                          homeTown: 'Accra',
                          nextOfKinName: kinName || nextOfKin,
                          nextOfKinPhone: kinPhone || '0205548810',
                        });
                      } catch {
                        // Proceed gracefully if API offline
                      } finally {
                        setApiBusy(false);
                      }
                    }
                    setScreen(role === 'DRIVER_ONLY' ? 'signup_docs' : 'signup_truck');
                  }}
                  style={{
                    width: '100%',
                    height: 52,
                    borderRadius: 16,
                    backgroundColor: colors.safetyAmber,
                    color: colors.asphalt,
                    border: 'none',
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: apiBusy ? 'wait' : 'pointer',
                  }}
                >
                  {apiBusy ? 'Saving...' : 'Continue'}
                </button>
              </div>
            )}

            {screen === 'signup_truck' && (
              <div>
                <h1
                  style={{
                    fontFamily: 'var(--font-archivo), Archivo, sans-serif',
                    fontSize: 24,
                    fontWeight: 800,
                    margin: '0 0 8px',
                  }}
                >
                  Register your truck
                </h1>
                <p style={{ fontSize: 14, color: colors.gravelGrey, margin: '0 0 20px' }}>
                  Enter your vehicle class and DVLA plate number.
                </p>

                <div
                  style={{
                    backgroundColor: colors.waybillPaper,
                    borderRadius: 18,
                    padding: 16,
                    border: `1px solid ${colors.grey200}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 14,
                    marginBottom: 20,
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: colors.gravelGrey,
                        marginBottom: 6,
                      }}
                    >
                      Vehicle Class
                    </label>
                    <select
                      value={vehicleType}
                      onChange={(e) => setVehicleType(e.target.value as VehicleType)}
                      style={{
                        width: '100%',
                        height: 44,
                        padding: '0 12px',
                        borderRadius: 12,
                        backgroundColor: colors.roadWhite,
                        border: `1px solid ${colors.grey200}`,
                        fontSize: 14,
                        fontWeight: 600,
                        color: colors.asphalt,
                      }}
                    >
                      {VEHICLE_TYPES.map((vt) => (
                        <option key={vt} value={vt}>
                          {VEHICLE_LABELS[vt]}
                        </option>
                      ))}
                    </select>
                  </div>

                  {[
                    { label: 'DVLA Plate Number', value: plateNumber, setter: setPlateNumber },
                    { label: 'Make & Model', value: makeModel, setter: setMakeModel },
                    { label: 'Payload Capacity (Tonnes)', value: payloadTons, setter: setPayloadTons },
                  ].map((field) => (
                    <div key={field.label}>
                      <label
                        style={{
                          display: 'block',
                          fontSize: 11,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          color: colors.gravelGrey,
                          marginBottom: 6,
                        }}
                      >
                        {field.label}
                      </label>
                      <input
                        value={field.value}
                        onChange={(e) => field.setter(e.target.value)}
                        style={{
                          width: '100%',
                          height: 44,
                          padding: '0 12px',
                          borderRadius: 12,
                          backgroundColor: colors.roadWhite,
                          border: `1px solid ${colors.grey200}`,
                          fontSize: 14,
                          fontWeight: 600,
                          color: colors.asphalt,
                          outline: 'none',
                        }}
                      />
                    </div>
                  ))}
                </div>

                <button
                  disabled={apiBusy}
                  onClick={async () => {
                    if (authToken) {
                      setApiBusy(true);
                      try {
                        const parts = makeModel.trim().split(' ');
                        const truck = await vagrovaApi.registerTruck(authToken, {
                          plate: plateNumber,
                          type: vehicleType.toUpperCase(),
                          make: parts[0] || 'MAN',
                          model: parts.slice(1).join(' ') || 'TGS',
                          year: 2022,
                          capacityTonnes: Number(payloadTons) || 30,
                        });
                        setTruckId(truck.id);
                      } catch {
                        // Proceed gracefully if API offline
                      } finally {
                        setApiBusy(false);
                      }
                    }
                    setScreen('signup_docs');
                  }}
                  style={{
                    width: '100%',
                    height: 52,
                    borderRadius: 16,
                    backgroundColor: colors.safetyAmber,
                    color: colors.asphalt,
                    border: 'none',
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: apiBusy ? 'wait' : 'pointer',
                  }}
                >
                  {apiBusy ? 'Registering Truck...' : 'Continue to Documents'}
                </button>
              </div>
            )}

            {screen === 'signup_docs' && (
              <div>
                <h1
                  style={{
                    fontFamily: 'var(--font-archivo), Archivo, sans-serif',
                    fontSize: 24,
                    fontWeight: 800,
                    margin: '0 0 8px',
                  }}
                >
                  Verification documents
                </h1>
                <p style={{ fontSize: 14, color: colors.gravelGrey, margin: '0 0 18px' }}>
                  Tap any item below to upload or replace a document.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 22 }}>
                  {docs.map((doc) => (
                    <div
                      key={doc.id}
                      style={{
                        padding: 14,
                        borderRadius: 16,
                        backgroundColor: colors.waybillPaper,
                        border: `1px solid ${colors.grey200}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: colors.asphalt }}>
                          {doc.label}
                        </div>
                        <div style={{ fontSize: 12, color: colors.gravelGrey, marginTop: 2 }}>
                          {doc.fileName ?? 'No file attached'} · Exp {doc.expiry}
                        </div>
                      </div>
                      <button
                        onClick={() => handleSimulateDocUpload(doc.id)}
                        style={{
                          padding: '7px 12px',
                          borderRadius: 10,
                          backgroundColor: colors.roadWhite,
                          border: `1px solid ${colors.grey200}`,
                          fontSize: 12,
                          fontWeight: 600,
                          color: colors.asphalt,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 5,
                        }}
                      >
                        <Upload size={13} />
                        {doc.fileName ? 'Replace' : 'Upload'}
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setScreen('dashboard')}
                  style={{
                    width: '100%',
                    height: 52,
                    borderRadius: 16,
                    backgroundColor: colors.safetyAmber,
                    color: colors.asphalt,
                    border: 'none',
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Complete Verification & Enter Dashboard
                </button>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* MAIN DASHBOARD (Clean Road White + Waybill Paper Aesthetic)      */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {screen === 'dashboard' && (
          <div className="anim-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Editorial Greeting + Verified Chip */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <label
                  title="Update Profile Picture"
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 999,
                    backgroundColor: colors.waybillPaper,
                    border: `2px solid ${colors.asphalt}`,
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    flexShrink: 0,
                    position: 'relative',
                  }}
                >
                  {driverPhotoUrl ? (
                    <img src={driverPhotoUrl} alt={fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <User size={22} color={colors.asphalt} />
                  )}
                  <input type="file" accept="image/*" onChange={handleDriverPhotoUpload} style={{ display: 'none' }} />
                </label>
                <div>
                  <p
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: colors.gravelGrey,
                      margin: '0 0 4px',
                    }}
                  >
                    {makeModel} · {payloadTons}t
                  </p>
                  <h1
                    style={{
                      fontFamily: 'var(--font-archivo), Archivo, sans-serif',
                      fontSize: 24,
                      fontWeight: 800,
                      lineHeight: 1.15,
                      letterSpacing: '-0.02em',
                      margin: 0,
                    }}
                  >
                    Good morning,{' '}
                    <span style={{ borderBottom: `3px solid ${colors.safetyAmber}` }}>
                      {firstName}.
                    </span>
                  </h1>
                </div>
              </div>

              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '5px 10px',
                  borderRadius: 999,
                  backgroundColor: colors.greenLight,
                  color: colors.weighbridgeGreen,
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                <ShieldCheck size={13} />
                Verified
              </span>
            </div>

            {/* Clean 3-Segment Availability Pill on Waybill Paper */}
            <div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  backgroundColor: colors.waybillPaper,
                  borderRadius: 14,
                  padding: 4,
                  border: `1px solid ${colors.grey200}`,
                }}
              >
                {(
                  [
                    { id: 'AVAILABLE', label: 'Available', dot: colors.weighbridgeGreen },
                    { id: 'BUSY', label: 'Busy', dot: colors.safetyAmber },
                    { id: 'OFFLINE', label: 'Offline', dot: colors.gravelGrey },
                  ] as const
                ).map((item) => {
                  const active = availability === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleAvailabilityChange(item.id)}
                      style={{
                        height: 38,
                        borderRadius: 10,
                        border: 'none',
                        backgroundColor: active ? colors.roadWhite : 'transparent',
                        boxShadow: active ? '0 1px 3px rgba(31,35,38,0.08)' : 'none',
                        color: active ? colors.asphalt : colors.gravelGrey,
                        fontSize: 13,
                        fontWeight: active ? 700 : 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        transition: 'all 160ms ease',
                      }}
                    >
                      <span
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: 999,
                          backgroundColor: active ? item.dot : colors.grey300,
                        }}
                      />
                      {item.label}
                    </button>
                  );
                })}
              </div>
              <p
                style={{
                  fontSize: 12,
                  color: colors.gravelGrey,
                  margin: '7px 2px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Radio size={12} color={availability === 'AVAILABLE' ? colors.weighbridgeGreen : colors.gravelGrey} />
                {availability === 'AVAILABLE'
                  ? 'Live GPS active — eligible for shortlist offers'
                  : availability === 'BUSY'
                  ? 'On active haul — new offers paused'
                  : 'Offline — hidden from dispatch'}
              </p>
            </div>

            {/* Clean Photorealistic Vehicle Stage Card */}
            <div
              style={{
                backgroundColor: colors.waybillPaper,
                borderRadius: 20,
                padding: 14,
                border: `1px solid ${colors.grey200}`,
                display: 'flex',
                alignItems: 'center',
                gap: 14,
              }}
            >
              <div
                style={{
                  width: 104,
                  height: 76,
                  borderRadius: 14,
                  overflow: 'hidden',
                  backgroundColor: colors.roadWhite,
                  border: `1px solid ${colors.grey200}`,
                  flexShrink: 0,
                }}
              >
                <img
                  src="/trucks/book-truck.jpg"
                  alt={makeModel}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: colors.gravelGrey, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {VEHICLE_LABELS[vehicleType]}
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: colors.asphalt, marginTop: 2 }}>
                  {makeModel}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6, fontSize: 12, color: colors.gravelGrey }}>
                  <span>4.92 rating</span>
                  <span>·</span>
                  <span>142 trips</span>
                </div>
              </div>
            </div>

            {/* Incoming Job Offer (High-Contrast Asphalt Sheet when live, matching Customer active card) */}
            {hasIncomingOffer && availability === 'AVAILABLE' && (
              <div
                style={{
                  backgroundColor: colors.asphalt,
                  color: colors.roadWhite,
                  borderRadius: 22,
                  padding: 18,
                  boxShadow: '0 12px 30px rgba(31,35,38,0.12)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 12,
                  }}
                >
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '4px 10px',
                      borderRadius: 999,
                      backgroundColor: colors.safetyAmber,
                      color: colors.asphalt,
                      fontSize: 11,
                      fontWeight: 800,
                      letterSpacing: '0.04em',
                    }}
                  >
                    NEW DISPATCH OFFER
                  </span>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      fontSize: 13,
                      fontWeight: 700,
                      color: colors.safetyAmber,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    <Clock size={14} />
                    00:{String(offerCountdown).padStart(2, '0')}
                  </span>
                </div>

                <div
                  style={{
                    fontFamily: 'var(--font-archivo), Archivo, sans-serif',
                    fontSize: 19,
                    fontWeight: 700,
                    marginBottom: 4,
                  }}
                >
                  Tema Port Gate 3 → Spintex Industrial
                </div>
                <div style={{ fontSize: 13, color: '#B8BDC2', marginBottom: 16 }}>
                  Flatbed 40t · Steel Beams (18t) · 28.5 km
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: 14,
                    borderTop: '1px solid rgba(255,255,255,0.12)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 11, color: '#9BA1A6', fontWeight: 600 }}>
                      NET PAYOUT
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-archivo), Archivo, sans-serif',
                        fontSize: 22,
                        fontWeight: 800,
                        color: colors.roadWhite,
                      }}
                    >
                      GHS 5,480.00
                    </div>
                  </div>

                  <button
                    className="vagrova-card-tap"
                    onClick={() => setScreen('offer')}
                    style={{
                      height: 44,
                      padding: '0 18px',
                      borderRadius: 12,
                      backgroundColor: colors.safetyAmber,
                      color: colors.asphalt,
                      border: 'none',
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    Review Offer
                    <ArrowUpRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Active / Current Waybill Summary Card */}
            <button
              className="vagrova-card-tap"
              onClick={() => setScreen('active_trip')}
              style={{
                width: '100%',
                textAlign: 'left',
                backgroundColor: colors.roadWhite,
                borderRadius: 20,
                padding: 16,
                border: `1px solid ${colors.grey200}`,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: colors.gravelGrey }}>
                    {activeJobRef}
                  </span>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      borderLeft: `3px solid ${activePhase === 'delivered' ? colors.weighbridgeGreen : colors.safetyAmber}`,
                      backgroundColor: activePhase === 'delivered' ? colors.greenLight : colors.grey100,
                      color: activePhase === 'delivered' ? colors.weighbridgeGreen : colors.asphalt,
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      padding: '2px 8px',
                      borderRadius: '0 4px 4px 0',
                      textTransform: 'uppercase',
                    }}
                  >
                    {STEP_LABELS[activePhase]}
                  </span>
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: colors.asphalt }}>
                  {activeRoute.pickup} → {activeRoute.dropoff}
                </div>
                <div style={{ fontSize: 13, color: colors.gravelGrey, marginTop: 3 }}>
                  {activeRoute.cargo} · Open live map & step controls
                </div>
              </div>
              <ChevronRight size={18} color={colors.gravelGrey} />
            </button>

            {/* Clean Two-Column Metric Strip */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
              }}
            >
              <button
                onClick={() => setScreen('earnings')}
                style={{
                  textAlign: 'left',
                  padding: 16,
                  borderRadius: 18,
                  backgroundColor: colors.waybillPaper,
                  border: `1px solid ${colors.grey200}`,
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: colors.gravelGrey, textTransform: 'uppercase' }}>
                  This Week
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-archivo), Archivo, sans-serif',
                    fontSize: 20,
                    fontWeight: 800,
                    color: colors.asphalt,
                    marginTop: 4,
                  }}
                >
                  GHS 18,450
                </div>
                <div style={{ fontSize: 12, color: colors.weighbridgeGreen, fontWeight: 600, marginTop: 4 }}>
                  6 completed jobs
                </div>
              </button>

              <button
                onClick={() => setScreen('docs')}
                style={{
                  textAlign: 'left',
                  padding: 16,
                  borderRadius: 18,
                  backgroundColor: colors.waybillPaper,
                  border: `1px solid ${colors.grey200}`,
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: colors.gravelGrey, textTransform: 'uppercase' }}>
                  Compliance
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-archivo), Archivo, sans-serif',
                    fontSize: 20,
                    fontWeight: 800,
                    color: colors.asphalt,
                    marginTop: 4,
                  }}
                >
                  5 / 5 Valid
                </div>
                <div style={{ fontSize: 12, color: colors.gravelGrey, fontWeight: 600, marginTop: 4 }}>
                  DVLA & Insurance active
                </div>
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* INCOMING OFFER DETAIL (With Live RouteMap + Clean Actions)       */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {screen === 'offer' && (
          <div className="anim-screen-slide" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button
                onClick={() => setScreen('dashboard')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'none',
                  border: 'none',
                  color: colors.asphalt,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                <ChevronLeft size={18} />
                Back to Dispatch
              </button>

              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '5px 10px',
                  borderRadius: 999,
                  backgroundColor: colors.waybillPaper,
                  border: `1px solid ${colors.grey200}`,
                  fontSize: 12,
                  fontWeight: 700,
                  color: colors.asphalt,
                }}
              >
                <Clock size={13} color={colors.safetyAmber} />
                Expires in 00:{String(offerCountdown).padStart(2, '0')}
              </span>
            </div>

            <RouteMap
              height="210px"
              pickupLabel="Tema Port Gate 3"
              dropoffLabel="Spintex Industrial"
            />

            <div
              style={{
                backgroundColor: colors.waybillPaper,
                borderRadius: 20,
                padding: 18,
                border: `1px solid ${colors.grey200}`,
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: colors.gravelGrey, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>
                Job Offer · VGJ-004824
              </div>
              <h2
                style={{
                  fontFamily: 'var(--font-archivo), Archivo, sans-serif',
                  fontSize: 22,
                  fontWeight: 800,
                  margin: '0 0 14px',
                }}
              >
                Tema Port Gate 3 → Spintex Industrial
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: colors.gravelGrey }}>Cargo</span>
                  <span style={{ fontWeight: 700 }}>Steel Beams (18 tonnes)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: colors.gravelGrey }}>Required Truck</span>
                  <span style={{ fontWeight: 700 }}>Flatbed 40t</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: colors.gravelGrey }}>Distance</span>
                  <span style={{ fontWeight: 700 }}>28.5 km (~55 min)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: colors.gravelGrey }}>Gross Rate</span>
                  <span style={{ fontWeight: 700 }}>GHS 6,090.00</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    paddingTop: 10,
                    borderTop: `1px solid ${colors.grey200}`,
                  }}
                >
                  <span style={{ fontWeight: 700 }}>Your Net Payout</span>
                  <span
                    style={{
                      fontFamily: 'var(--font-archivo), Archivo, sans-serif',
                      fontSize: 18,
                      fontWeight: 800,
                      color: colors.weighbridgeGreen,
                    }}
                  >
                    GHS 5,480.00
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
              <button
                onClick={() => {
                  setHasIncomingOffer(false);
                  setScreen('dashboard');
                }}
                style={{
                  height: 54,
                  borderRadius: 16,
                  backgroundColor: colors.roadWhite,
                  border: `1px solid ${colors.grey200}`,
                  color: colors.asphalt,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <X size={16} />
                Decline
              </button>

              <button
                className="vagrova-card-tap"
                onClick={handleAcceptOffer}
                style={{
                  height: 54,
                  borderRadius: 16,
                  backgroundColor: colors.safetyAmber,
                  border: 'none',
                  color: colors.asphalt,
                  fontSize: 15,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <Check size={18} />
                Accept Haulage Job
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* ACTIVE TRIP EXECUTION (Real RouteMap + Dark Asphalt 64px Sheet)  */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {screen === 'active_trip' && (
          <div className="anim-screen-slide" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: colors.gravelGrey, letterSpacing: '0.06em' }}>
                  ACTIVE WAYBILL · {activeJobRef}
                </div>
                <div style={{ fontSize: 17, fontWeight: 800, color: colors.asphalt }}>
                  {activeRoute.pickup} → {activeRoute.dropoff}
                </div>
              </div>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  borderLeft: `3px solid ${activePhase === 'delivered' ? colors.weighbridgeGreen : colors.safetyAmber}`,
                  backgroundColor: activePhase === 'delivered' ? colors.greenLight : colors.grey100,
                  color: activePhase === 'delivered' ? colors.weighbridgeGreen : colors.asphalt,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  padding: '3px 10px',
                  borderRadius: '0 4px 4px 0',
                  textTransform: 'uppercase',
                }}
              >
                {STEP_LABELS[activePhase]}
              </span>
            </div>

            <RouteMap
              height="220px"
              showLiveTruck={activePhase !== 'delivered'}
              pickupLabel={activeRoute.pickup}
              dropoffLabel={activeRoute.dropoff}
            />

            {/* Clean Progress Stepper on Waybill Paper */}
            <div
              style={{
                backgroundColor: colors.waybillPaper,
                borderRadius: 18,
                padding: 14,
                border: `1px solid ${colors.grey200}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: colors.asphalt }}>
                  Milestone Progress
                </span>
                <span style={{ fontSize: 12, fontWeight: 600, color: colors.gravelGrey }}>
                  Step {currentPhaseIdx + 1} of {PHASE_ORDER.length}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${PHASE_ORDER.length}, 1fr)`, gap: 5 }}>
                {PHASE_ORDER.map((phase, idx) => (
                  <div
                    key={phase}
                    style={{
                      height: 6,
                      borderRadius: 999,
                      backgroundColor:
                        idx <= currentPhaseIdx
                          ? activePhase === 'delivered'
                            ? colors.weighbridgeGreen
                            : colors.safetyAmber
                          : colors.grey200,
                    }}
                  />
                ))}
              </div>
              <div style={{ fontSize: 12, color: colors.gravelGrey, marginTop: 8 }}>
                {activeRoute.cargo} · {activeRoute.distanceKm} km · Payout GHS{' '}
                {activeRoute.payoutGhs.toLocaleString()}
              </div>
            </div>

            {/* Dark Asphalt Execution Sheet with 64px Safety Amber CTA */}
            <div
              style={{
                backgroundColor: colors.asphalt,
                color: colors.roadWhite,
                borderRadius: 22,
                padding: 18,
              }}
            >
              {NEXT_STEP_ACTION[activePhase] ? (
                <>
                  <div style={{ fontSize: 12, color: '#B8BDC2', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CircleDot size={13} color={colors.safetyAmber} />
                    {NEXT_STEP_ACTION[activePhase]!.hint}
                  </div>
                  <button
                    className="vagrova-card-tap"
                    onClick={handleAdvanceStep}
                    style={{
                      width: '100%',
                      height: 64,
                      borderRadius: 16,
                      backgroundColor: colors.safetyAmber,
                      color: colors.asphalt,
                      border: 'none',
                      fontSize: 16,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                  >
                    <Navigation size={18} />
                    {NEXT_STEP_ACTION[activePhase]!.cta}
                  </button>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '6px 0' }}>
                  <CheckCircle2 size={32} color={colors.weighbridgeGreen} style={{ margin: '0 auto 8px' }} />
                  <div style={{ fontSize: 17, fontWeight: 800 }}>Delivery Confirmed</div>
                  <div style={{ fontSize: 13, color: '#B8BDC2', margin: '4px 0 14px' }}>
                    GHS {activeRoute.payoutGhs.toLocaleString()} queued for settlement
                  </div>
                  <button
                    onClick={() => setScreen('dashboard')}
                    style={{
                      width: '100%',
                      height: 48,
                      borderRadius: 14,
                      backgroundColor: colors.safetyAmber,
                      color: colors.asphalt,
                      border: 'none',
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Return to Dispatch
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* EARNINGS TAB                                                     */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {screen === 'earnings' && (
          <div className="anim-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h1
              style={{
                fontFamily: 'var(--font-archivo), Archivo, sans-serif',
                fontSize: 24,
                fontWeight: 800,
                margin: 0,
              }}
            >
              Earnings & Payouts
            </h1>

            <div
              style={{
                backgroundColor: colors.asphalt,
                color: colors.roadWhite,
                borderRadius: 22,
                padding: 20,
              }}
            >
              <div style={{ fontSize: 12, color: '#9BA1A6', fontWeight: 600 }}>
                TOTAL SETTLED THIS MONTH
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-archivo), Archivo, sans-serif',
                  fontSize: 30,
                  fontWeight: 800,
                  marginTop: 6,
                }}
              >
                GHS 42,890.00
              </div>
              <div style={{ fontSize: 12, color: colors.safetyAmber, marginTop: 6, fontWeight: 600 }}>
                MTN MoMo Instant Payout · 024 812 3390
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { ref: 'VGJ-004812', route: 'Tema Port → Kumasi', date: 'Today', amount: 'GHS 8,400.00', status: 'Settled' },
                { ref: 'VGJ-004799', route: 'Takoradi → Tarkwa', date: 'Yesterday', amount: 'GHS 6,250.00', status: 'Settled' },
                { ref: 'VGJ-004771', route: 'Accra → Ho', date: '14 Nov', amount: 'GHS 3,800.00', status: 'Settled' },
              ].map((item) => (
                <div
                  key={item.ref}
                  style={{
                    padding: 16,
                    borderRadius: 16,
                    backgroundColor: colors.waybillPaper,
                    border: `1px solid ${colors.grey200}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: colors.asphalt }}>
                      {item.route}
                    </div>
                    <div style={{ fontSize: 12, color: colors.gravelGrey, marginTop: 2 }}>
                      {item.ref} · {item.date}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: colors.asphalt }}>
                      {item.amount}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: colors.weighbridgeGreen }}>
                      {item.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* DOCS & VEHICLE TAB                                               */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {screen === 'docs' && (
          <div className="anim-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h1
              style={{
                fontFamily: 'var(--font-archivo), Archivo, sans-serif',
                fontSize: 24,
                fontWeight: 800,
                margin: 0,
              }}
            >
              Documents & Fleet
            </h1>

            <div
              style={{
                padding: 15,
                borderRadius: 16,
                backgroundColor: colors.roadWhite,
                border: `1.5px solid ${colors.asphalt}`,
                display: 'flex',
                alignItems: 'center',
                gap: 14,
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 999,
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
                  <img src={driverPhotoUrl} alt={fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <User size={24} color={colors.asphalt} />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: colors.asphalt }}>
                  Driver Profile Photo
                </div>
                <div style={{ fontSize: 12, color: colors.gravelGrey, marginTop: 2 }}>
                  Visible to customers when ordering
                </div>
              </div>
              <label
                style={{
                  padding: '8px 12px',
                  borderRadius: 10,
                  backgroundColor: colors.safetyAmber,
                  color: colors.asphalt,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <Camera size={14} />
                {photoUploading ? 'Saving...' : driverPhotoUrl ? 'Change' : 'Upload'}
                <input type="file" accept="image/*" onChange={handleDriverPhotoUpload} style={{ display: 'none' }} />
              </label>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {docs.map((doc) => (
                <div
                  key={doc.id}
                  style={{
                    padding: 15,
                    borderRadius: 16,
                    backgroundColor: colors.waybillPaper,
                    border: `1px solid ${colors.grey200}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: colors.asphalt }}>
                      {doc.label}
                    </div>
                    <div style={{ fontSize: 12, color: colors.gravelGrey, marginTop: 2 }}>
                      {doc.fileName ?? 'Pending'} · Exp {doc.expiry}
                    </div>
                  </div>
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: 999,
                      backgroundColor:
                        doc.status === 'VERIFIED' ? colors.greenLight : colors.roadWhite,
                      color:
                        doc.status === 'VERIFIED' ? colors.weighbridgeGreen : colors.asphalt,
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    {doc.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Clean Floating Pill Bottom Navigation matching Customer UI */}
      {!isAuthOrWelcome && (
        <nav
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            margin: '0 auto',
            width: '100%',
            maxWidth: 460,
            backgroundColor: colors.roadWhite,
            borderTop: `1px solid ${colors.grey200}`,
            padding: '6px 8px calc(6px + env(safe-area-inset-bottom, 0px))',
            boxShadow: '0 -6px 20px rgba(13, 109, 120, 0.08)',
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 4,
            zIndex: 50,
          }}
        >
          {[
            { id: 'dashboard' as Screen, label: 'Dispatch', icon: Truck },
            { id: 'active_trip' as Screen, label: 'Trip', icon: Navigation },
            { id: 'earnings' as Screen, label: 'Earnings', icon: Wallet },
            { id: 'docs' as Screen, label: 'Docs', icon: FileText },
          ].map((tab) => {
            const active = screen === tab.id || (tab.id === 'dashboard' && screen === 'offer');
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setScreen(tab.id)}
                style={{
                  height: 50,
                  borderRadius: 16,
                  border: 'none',
                  backgroundColor: active ? colors.asphalt : 'transparent',
                  color: active ? colors.safetyAmber : colors.gravelGrey,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 3,
                  fontSize: 11,
                  fontWeight: active ? 700 : 600,
                  cursor: 'pointer',
                  transition: 'all 160ms ease',
                }}
              >
                <Icon size={17} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}
