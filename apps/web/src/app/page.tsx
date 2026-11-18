'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PriceEstimateCard, { formatGhs, getRateGhs } from '@/components/PriceEstimateCard';
import LiveTrackingView from '@/components/LiveTrackingView';
import OnboardingHero from '@/components/OnboardingHero';
import {
  ToastBanner,
  NotificationBellButton,
  NotificationDrawer,
  type AppNotificationItem,
} from '@/components/InAppNotifications';
import {
  Phone,
  Mic,
  MapPin,
  Camera,
  Volume2,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Truck,
  Navigation,
  Clock,
  HelpCircle,
  Upload,
  X,
  PhoneCall,
  Package,
  HardHat,
  Wheat,
  Box,
  Layers,
  Search,
  Calendar,
  Plus,
  ArrowUpDown,
  Home,
  FileText,
  ChevronRight,
  LocateFixed,
  User,
  Building2,
  KeyRound,
} from 'lucide-react';
import {
  colors,
  VEHICLE_TYPES,
  VEHICLE_LABELS,
  VEHICLE_CAPACITY,
  VEHICLE_USE,
  type VehicleType,
  TruckIcon,
  ConsignmentNote,
  PlateNumber,
  StatusChip,
} from '@vagrova/ui';
import { vagrovaApi } from '@/lib/api';
import { connectTrackingSocket } from '@/lib/socket';
import TruckApproachIntro from '@/components/TruckApproachIntro';

const RouteMap = dynamic(() => import('@/components/RouteMap'), {
  ssr: false,
  loading: () => (
    <div style={{ width: '100%', height: '240px', backgroundColor: '#EBF2F3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', color: '#4B6B70' }}>
      Loading Accra – Tema map...
    </div>
  ),
});

type Screen =
  | 'splash'
  | 'welcome'
  | 'auth_phone'
  | 'auth_otp'
  | 'auth_profile'
  | 'home'
  | 'route'
  | 'vehicles'
  | 'truck_detail'
  | 'load'
  | 'photos'
  | 'quote'
  | 'machinery_request'
  | 'cargo_station_request'
  | 'request_submitted'
  | 'tracking'
  | 'jobs'
  | 'callback';

const POPULAR_LOCATIONS = [
  { name: 'Tema Port, Container Terminal 3', area: 'Tema, Greater Accra', distance: '24.5 km', eta: '38 min' },
  { name: 'Spintex Heavy Industrial Area', area: 'Spintex Rd, Accra', distance: '14.2 km', eta: '25 min' },
  { name: 'Kasoa North Quarry Site', area: 'Kasoa, Central Region', distance: '28.0 km', eta: '45 min' },
  { name: 'George W. Bush Hwy N246', area: 'Lapaz / Achimota, Accra', distance: '4.5 km', eta: '12 min' },
];

const VEHICLE_ESTIMATES: Record<VehicleType, { eta: string; fromGhs: string; tag?: string }> = {
  tipper: { eta: '12 min', fromGhs: '1,200', tag: 'POPULAR' },
  flatbed: { eta: '15 min', fromGhs: '1,800', tag: 'RECOMMENDED' },
  lowbed: { eta: '22 min', fromGhs: '2,800', tag: 'HEAVY PLANT' },
  container_carrier: { eta: '18 min', fromGhs: '1,500' },
  tanker: { eta: '25 min', fromGhs: '2,000' },
  crane_truck: { eta: '28 min', fromGhs: '2,500' },
  tow_recovery: { eta: '10 min', fromGhs: '900', tag: 'FASTEST' },
  refrigerated: { eta: '20 min', fromGhs: '1,600' },
};

const LOAD_CATEGORIES = [
  { id: 'building_materials', label: 'Building Materials', icon: HardHat },
  { id: 'machinery', label: 'Machinery / Plant', icon: Truck },
  { id: 'containers', label: 'Shipping Container', icon: Box },
  { id: 'farm_produce', label: 'Farm Produce', icon: Wheat },
  { id: 'general_goods', label: 'General Heavy Goods', icon: Package },
] as const;

export default function CustomerOrderingApp() {
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>('splash');
  const [language, setLanguage] = useState<'EN' | 'TWI' | 'GA'>('EN');
  const [driverPhotoUrl, setDriverPhotoUrl] = useState<string | null>(null);
  const [driverDisplayName, setDriverDisplayName] = useState('');
  const [liveCoords, setLiveCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [liveTripStatus, setLiveTripStatus] = useState<string | null>(null);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [myJobs, setMyJobs] = useState<any[]>([]);
  const [selectedTrackingJob, setSelectedTrackingJob] = useState<any | null>(null);

  // Managed Equipment Catalog & Category A/B Request State
  const [serviceGroup, setServiceGroup] = useState<'TRANSPORT' | 'MACHINERY'>('TRANSPORT');
  const [equipmentCatalog, setEquipmentCatalog] = useState<any[]>([]);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(null);
  const [selectedEquipmentName, setSelectedEquipmentName] = useState<string>('Excavator');
  const [submittedJobNumber, setSubmittedJobNumber] = useState<string>('');
  const [requestSubmitting, setRequestSubmitting] = useState(false);

  const [projectLocation, setProjectLocation] = useState('Tarkwa Mining Concession, Western Region');
  const [workDescription, setWorkDescription] = useState('Site clearing and trench excavation for drainage');
  const [startDate, setStartDate] = useState('2026-11-20');
  const [expectedDuration, setExpectedDuration] = useState('14');
  const [durationUnit, setDurationUnit] = useState<'HOURS' | 'DAYS' | 'WEEKS' | 'MONTHS'>('DAYS');
  const [workingCapacity, setWorkingCapacity] = useState('20-ton class');
  const [siteAccessibility, setSiteAccessibility] = useState('Gravel access road, wide gate');
  const [operatorRequired, setOperatorRequired] = useState(true);
  const [fuelArrangement, setFuelArrangement] = useState<'COMPANY_SUPPLIED' | 'CUSTOMER_SUPPLIED'>('COMPANY_SUPPLIED');
  const [transportNeeded, setTransportNeeded] = useState(true);
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Cargo Station Hub-to-Hub Freight State
  const [stationHub, setStationHub] = useState('Tema Port Hub');
  const [stationMode, setStationMode] = useState('Hub-to-Hub Consolidated Freight');
  const [stationStagingDays, setStationStagingDays] = useState('2');

  const [isReturningClient, setIsReturningClient] = useState(false);
  const [totalTrips, setTotalTrips] = useState(0);
  const [lastBooking, setLastBooking] = useState<{
    equipmentId?: string | null;
    equipmentName: string;
    serviceGroup: 'TRANSPORT' | 'MACHINERY';
    pickupAddress: string;
    deliveryAddress: string;
  } | null>(null);

  const saveLastBooking = (booking: {
    equipmentId?: string | null;
    equipmentName: string;
    serviceGroup: 'TRANSPORT' | 'MACHINERY';
    pickupAddress: string;
    deliveryAddress: string;
  }) => {
    setLastBooking(booking);
    if (typeof window !== 'undefined') {
      localStorage.setItem('vagrova_last_booking', JSON.stringify(booking));
    }
  };

  const selectedEquipmentObj =
    equipmentCatalog
      .flatMap((cat) => cat.equipmentTypes || [])
      .find((eq: any) => eq.id === selectedEquipmentId || eq.name === selectedEquipmentName) || {
      name: selectedEquipmentName,
    };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedToken = localStorage.getItem('vagrova_customer_token');
      const savedPhone = localStorage.getItem('vagrova_customer_phone');
      const savedCustomerName = localStorage.getItem('vagrova_customer_name');
      const savedCompany = localStorage.getItem('vagrova_customer_company');
      if (savedToken) setAuthToken(savedToken);
      if (savedPhone) setAuthPhone(savedPhone);
      if (savedCustomerName && savedCustomerName !== 'New User') {
        setCustomerName(savedCustomerName);
        setIsReturningClient(true);
      }
      if (savedCompany) setCompanyName(savedCompany);
      const savedLastBooking = localStorage.getItem('vagrova_last_booking');
      if (savedLastBooking) {
        try {
          setLastBooking(JSON.parse(savedLastBooking));
        } catch {}
      }

      if (savedToken) {
        vagrovaApi
          .getMe(savedToken)
          .then((me) => {
            if (me.user.name && me.user.name !== 'New User') {
              setCustomerName(me.user.name);
              localStorage.setItem('vagrova_customer_name', me.user.name);
            }
            if (me.user.companyName) {
              setCompanyName(me.user.companyName);
              localStorage.setItem('vagrova_customer_company', me.user.companyName);
            }
            setIsReturningClient(Boolean(me.isReturningUser));
            setTotalTrips(me.totalJobs ?? 0);
          })
          .catch((err) => {
            if (err?.status === 401) {
              localStorage.removeItem('vagrova_customer_token');
              setAuthToken(null);
              setIsReturningClient(false);
            }
          });

        vagrovaApi
          .getMyJobs(savedToken)
          .then((jobs) => {
            if (Array.isArray(jobs)) {
              setMyJobs(jobs);
              if (jobs.length > 0) {
                const latest = jobs[0];
                setSelectedTrackingJob(latest);
                setActiveJobId(latest.id);
                saveLastBooking({
                  equipmentId: latest.equipmentTypeId || null,
                  equipmentName: latest.equipmentType?.name || latest.vehicleType || 'Flatbed Truck',
                  serviceGroup: latest.serviceGroup === 'MACHINERY' ? 'MACHINERY' : 'TRANSPORT',
                  pickupAddress: latest.pickupAddress || 'Tema Port',
                  deliveryAddress: latest.deliveryAddress || 'Accra',
                });
              }
            }
          })
          .catch(() => {});
      }
    }
  }, []);

  useEffect(() => {
    vagrovaApi
      .getEquipmentCatalog()
      .then((data) => {
        if (Array.isArray(data)) setEquipmentCatalog(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPhoto = localStorage.getItem('vagrova_driver_photo');
      const savedName = localStorage.getItem('vagrova_driver_name');
      if (savedPhoto) setDriverPhotoUrl(savedPhoto);
      if (savedName) setDriverDisplayName(savedName);
    }
  }, [screen]);

  // First-time User Auth & Profile State
  const [authPhone, setAuthPhone] = useState('');
  const [authOtp, setAuthOtp] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [acceptedTermsAndAge, setAcceptedTermsAndAge] = useState(false);

  // In-App On-Screen Notifications & Toast State
  const [notifications, setNotifications] = useState<AppNotificationItem[]>([]);
  const [activeToast, setActiveToast] = useState<AppNotificationItem | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);

  const pushNotification = (
    title: string,
    message: string,
    type: AppNotificationItem['type'] = 'info',
  ) => {
    const item: AppNotificationItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title,
      message,
      type,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false,
    };
    setNotifications((prev) => [item, ...prev].slice(0, 25));
    setActiveToast(item);
    setTimeout(() => {
      setActiveToast((cur) => (cur?.id === item.id ? null : cur));
    }, 4500);
  };

  useEffect(() => {
    if (!authToken || screen !== 'tracking' || !activeJobId) return;
    const socket = connectTrackingSocket(authToken);
    socket.emit('joinJobRoom', { jobId: activeJobId });

    socket.on('truckLocationUpdated', (loc: { latitude: number; longitude: number }) => {
      if (typeof loc?.latitude === 'number' && typeof loc?.longitude === 'number') {
        setLiveCoords({ lat: loc.latitude, lng: loc.longitude });
      }
    });

    socket.on('jobStatusChanged', (payload: { status?: string }) => {
      if (payload?.status) {
        const cleanStatus = payload.status.replace(/_/g, ' ');
        setLiveTripStatus(cleanStatus);
        pushNotification('Trip Status Updated', `Your job is now ${cleanStatus}.`, 'success');
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [authToken, screen, activeJobId]);
  const [accountType, setAccountType] = useState<'individual' | 'company'>('individual');
  const [customerName, setCustomerName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');

  // Booking State
  const [pickupAddress, setPickupAddress] = useState('George W. Bush Hwy N246');
  const [pickupContactPhone] = useState('+233 24 123 4567');

  const [deliveryAddress, setDeliveryAddress] = useState('Tema Port, Container Terminal 3');
  const [deliveryContactPhone] = useState('+233 55 987 6543');
  const [deliveryLandmark, setDeliveryLandmark] = useState('Golden Jubilee Gate 2');
  const [extraStops, setExtraStops] = useState<string[]>([]);

  const [vehicleType, setVehicleType] = useState<VehicleType>('lowbed');
  const [vehicleFilter, setVehicleFilter] = useState<'all' | 'plant' | 'port' | 'fast'>('all');
  const [bookingPlan, setBookingPlan] = useState<'single' | 'multiday' | 'assisted'>('single');
  const [recordingVoice, setRecordingVoice] = useState(false);

  const [loadCategory, setLoadCategory] = useState('machinery');
  const [weightTonnes, setWeightTonnes] = useState('24');
  const [loadDescription, setLoadDescription] = useState('CAT 320D Excavator with bucket attachment');
  const [isOversized, setIsOversized] = useState(true);
  const [needLoadingHelp, setNeedLoadingHelp] = useState(false);
  const [needOffloadingHelp, setNeedOffloadingHelp] = useState(true);
  const [isHazardous, setIsHazardous] = useState(false);

  const [photos, setPhotos] = useState([
    { id: '1', name: 'excavator_front_side.jpg', size: '1.4 MB' },
    { id: '2', name: 'loading_access_road.jpg', size: '2.1 MB' },
  ]);

  const [paymentMethod, setPaymentMethod] = useState<'momo' | 'bank' | 'cash'>('momo');
  const [momoNetwork, setMomoNetwork] = useState<'MTN MoMo' | 'Telecel Cash' | 'AT Money'>('MTN MoMo');
  const [callbackPhone, setCallbackPhone] = useState('');
  const [callbackSent, setCallbackSent] = useState(false);

  const handleSwapAddresses = () => {
    const temp = pickupAddress;
    setPickupAddress(deliveryAddress);
    setDeliveryAddress(temp);
  };

  const handleAddPhoto = () => {
    if (photos.length >= 8) return;
    setPhotos([
      ...photos,
      { id: String(Date.now()), name: `load_photo_${photos.length + 1}.jpg`, size: '1.5 MB' },
    ]);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#084D55',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      {/* Mobile-first App Frame (inspired by Bolt / Yango / Qargo) */}
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          minHeight: '100vh',
          backgroundColor: colors.waybillPaper,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          boxShadow: '0 0 40px rgba(0,0,0,0.45)',
        }}
      >
        <ToastBanner toast={activeToast} onDismiss={() => setActiveToast(null)} />
        <NotificationDrawer
          open={notifOpen}
          items={notifications}
          onClose={() => setNotifOpen(false)}
          onMarkAllRead={() =>
            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
          }
        />
        {/* ════════════════════════════════════════════════════════════════════
            SCREEN 0A: REALISTIC TRUCK APPROACH + HEADLIGHT BLOOM LOGO INTRO
           ════════════════════════════════════════════════════════════════════ */}
        {screen === 'splash' && (
          <OnboardingHero
            onGetStarted={() => {
              const hasReturningSession =
                isReturningClient || Boolean(authToken && customerName && customerName !== 'New User');
              setScreen(hasReturningSession ? 'home' : 'auth_phone');
            }}
            onDriverPortal={() => router.push('/driver')}
          />
        )}

        {/* ════════════════════════════════════════════════════════════════════
            SCREEN 0B: ROLE SELECTION (ORDER A RIDE vs DRIVER / TRUCK OWNER)
           ════════════════════════════════════════════════════════════════════ */}
        {screen === 'welcome' && (
          <div
            className="anim-screen-slide"
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              backgroundColor: colors.roadWhite,
              minHeight: '100vh',
            }}
          >
            {/* Top Bar */}
            <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${colors.grey200}` }}>
              <img
                src="/vagrova-logo.png"
                alt="Vagrova"
                style={{ height: '24px', width: 'auto', display: 'block' }}
              />
              <div style={{ display: 'flex', border: `1px solid ${colors.grey200}`, borderRadius: '6px', overflow: 'hidden' }}>
                {(['EN', 'TWI', 'GA'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    style={{
                      padding: '4px 9px',
                      fontSize: '11px',
                      fontWeight: 700,
                      border: 'none',
                      backgroundColor: language === lang ? colors.asphalt : colors.roadWhite,
                      color: language === lang ? colors.safetyAmber : colors.gravelGrey,
                    }}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            {/* Center Role Choice Stage */}
            <div style={{ padding: '24px 20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div className="anim-fade-up" style={{ marginBottom: '22px' }}>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    color: colors.gravelGrey,
                    textTransform: 'uppercase',
                    marginBottom: '8px',
                  }}
                >
                  Welcome to Vagrova
                </div>
                <h1
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '28px',
                    fontWeight: 800,
                    color: colors.asphalt,
                    lineHeight: 1.15,
                    marginBottom: '8px',
                  }}
                >
                  How would you like to{' '}
                  <span style={{ borderBottom: `3px solid ${colors.safetyAmber}` }}>
                    get started?
                  </span>
                </h1>
                <p style={{ fontSize: '14px', color: colors.gravelGrey, lineHeight: 1.5 }}>
                  Choose whether you want to book a truck for your cargo or register as a driver / truck owner.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Option 1: Order a Ride / Book a Truck */}
                <button
                  onClick={() => setScreen(authToken || customerName ? 'home' : 'auth_phone')}
                  className="vagrova-card-tap"
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '18px',
                    borderRadius: '18px',
                    backgroundColor: colors.waybillPaper,
                    border: `2px solid ${colors.asphalt}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                  }}
                >
                  <div
                    style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: '14px',
                      backgroundColor: colors.safetyAmber,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Package size={24} color={colors.asphalt} strokeWidth={2.2} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: '17px', fontWeight: 800, color: colors.asphalt, marginBottom: '3px' }}>
                      Order a Truck / Ride
                    </div>
                    <div style={{ fontSize: '13px', color: colors.gravelGrey, lineHeight: 1.4 }}>
                      Book tippers, flatbeds, lowbeds, or containers with upfront quotes & live tracking.
                    </div>
                  </div>
                  <ChevronRight size={20} color={colors.asphalt} />
                </button>

                {/* Option 2: Register as Driver or Truck Owner */}
                <button
                  onClick={() => router.push('/driver?onboarding=1')}
                  className="vagrova-card-tap"
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '18px',
                    borderRadius: '18px',
                    backgroundColor: colors.roadWhite,
                    border: `1.5px solid ${colors.grey200}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                  }}
                >
                  <div
                    style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: '14px',
                      backgroundColor: colors.asphalt,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Truck size={24} color={colors.safetyAmber} strokeWidth={2.2} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: '17px', fontWeight: 800, color: colors.asphalt, marginBottom: '3px' }}>
                      Register as Driver / Truck Owner
                    </div>
                    <div style={{ fontSize: '13px', color: colors.gravelGrey, lineHeight: 1.4 }}>
                      Verify your truck or driver license and receive haulage jobs with instant MoMo payouts.
                    </div>
                  </div>
                  <ChevronRight size={20} color={colors.gravelGrey} />
                </button>
              </div>
            </div>

            {/* Bottom Call Dispatch Bar */}
            <div
              style={{
                backgroundColor: colors.waybillPaper,
                borderTop: `1px solid ${colors.grey200}`,
                padding: '16px 20px',
              }}
            >
              <a
                href="tel:+233302000000"
                className="vagrova-card-tap"
                style={{
                  width: '100%',
                  height: '48px',
                  backgroundColor: colors.asphalt,
                  color: colors.roadWhite,
                  borderRadius: '12px',
                  textDecoration: 'none',
                  fontFamily: 'var(--font-heading)',
                  fontSize: '14px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <Phone size={15} color={colors.safetyAmber} />
                <span>Call Vagrova Dispatch (+233 30 200 0000)</span>
              </a>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            SCREEN 0B: FIRST-TIME LOGIN — PHONE ENTRY (Passwordless OTP)
           ════════════════════════════════════════════════════════════════════ */}
        {screen === 'auth_phone' && (
          <div className="anim-screen-slide" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', backgroundColor: '#FFFFFF', minHeight: '100vh' }}>
            <div>
              <header style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '11px',
                      backgroundColor: colors.asphalt,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Truck size={20} color="#FFFFFF" strokeWidth={2.2} />
                  </div>
                  <span
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: '19px',
                      fontWeight: 900,
                      letterSpacing: '0.06em',
                      color: colors.asphalt,
                    }}
                  >
                    VAGROVA
                  </span>
                </div>
                <button
                  onClick={() => setScreen('splash')}
                  aria-label="Back to onboarding"
                  style={{ width: '34px', height: '34px', borderRadius: '999px', border: `1px solid ${colors.grey200}`, backgroundColor: colors.waybillPaper, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <ArrowLeft size={16} color={colors.asphalt} />
                </button>
              </header>

              <div style={{ padding: '28px 20px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '6px', backgroundColor: colors.waybillPaper, border: `1px solid ${colors.grey200}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }}>
                  <Phone size={20} color={colors.asphalt} />
                </div>

                <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '26px', fontWeight: 700, color: colors.asphalt, marginBottom: '6px' }}>
                  Enter your phone number
                </h1>
                <p style={{ fontSize: '14px', color: colors.gravelGrey, marginBottom: '22px', lineHeight: 1.5 }}>
                  We will send a 6-digit one-time code by SMS. No password needed.
                </p>

                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: colors.gravelGrey, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                  Ghana Mobile Number
                </label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                  <div style={{ height: '50px', padding: '0 12px', backgroundColor: colors.waybillPaper, border: `1px solid ${colors.grey300}`, borderRadius: '4px', display: 'flex', alignItems: 'center', fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 700, color: colors.asphalt }}>
                    +233
                  </div>
                  <input
                    type="tel"
                    value={authPhone}
                    onChange={(e) => {
                      setAuthError(null);
                      setAuthPhone(e.target.value);
                    }}
                    placeholder="024 123 4567"
                    style={{ flex: 1, height: '50px', border: `1.5px solid ${colors.asphalt}`, borderRadius: '4px', padding: '0 14px', fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 600 }}
                  />
                </div>

                {authError && (
                  <div style={{ backgroundColor: colors.redLight, color: colors.rustRed, fontSize: '13px', fontWeight: 600, padding: '10px 12px', borderRadius: '4px', marginTop: '8px' }}>
                    {authError}
                  </div>
                )}
              </div>
            </div>

            <div style={{ padding: '20px', backgroundColor: colors.waybillPaper, borderTop: `1px solid ${colors.grey200}`, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                disabled={authLoading}
                onClick={async () => {
                  const cleaned = authPhone.replace(/[\s\-()]/g, '');
                  if (cleaned.length < 9) {
                    setAuthError('Please enter a valid 9 or 10-digit Ghana mobile number.');
                    return;
                  }
                  setAuthLoading(true);
                  setAuthError(null);
                  try {
                    await vagrovaApi.requestOtp(cleaned);
                  } catch {
                    // Graceful local preview fallback if API server is not running
                  } finally {
                    setAuthLoading(false);
                    setScreen('auth_otp');
                  }
                }}
                style={{ width: '100%', height: '54px', backgroundColor: colors.safetyAmber, color: colors.asphalt, border: 'none', borderRadius: '4px', fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <span>{authLoading ? 'Sending Code...' : 'Send Verification Code'}</span>
                <ArrowRight size={18} />
              </button>

              <button
                onClick={() => setScreen('home')}
                style={{ background: 'none', border: 'none', fontSize: '13px', fontWeight: 600, color: colors.gravelGrey, padding: '6px' }}
              >
                Skip for now (Browse as Guest)
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            SCREEN 0C: FIRST-TIME LOGIN — 6-DIGIT OTP VERIFICATION
           ════════════════════════════════════════════════════════════════════ */}
        {screen === 'auth_otp' && (
          <div className="anim-screen-slide" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', backgroundColor: colors.roadWhite, minHeight: '100vh' }}>
            <div>
              <header style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${colors.grey200}` }}>
                <button
                  onClick={() => setScreen('auth_phone')}
                  aria-label="Back"
                  style={{ width: '36px', height: '36px', borderRadius: '4px', border: `1px solid ${colors.grey200}`, backgroundColor: colors.waybillPaper, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <ArrowLeft size={18} />
                </button>
                <img src="/vagrova-logo.png" alt="Vagrova" style={{ height: '22px', width: 'auto' }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, color: colors.gravelGrey }}>2/3</span>
              </header>

              <div style={{ padding: '28px 20px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '6px', backgroundColor: colors.waybillPaper, border: `1px solid ${colors.grey200}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }}>
                  <KeyRound size={20} color={colors.asphalt} />
                </div>

                <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '26px', fontWeight: 700, color: colors.asphalt, marginBottom: '6px' }}>
                  Enter verification code
                </h1>
                <p style={{ fontSize: '14px', color: colors.gravelGrey, marginBottom: '22px', lineHeight: 1.5 }}>
                  Sent via SMS to <strong style={{ fontFamily: 'var(--font-mono)', color: colors.asphalt }}>{authPhone || '024 123 4567'}</strong>.{' '}
                  <button onClick={() => setScreen('auth_phone')} style={{ background: 'none', border: 'none', color: colors.asphalt, fontWeight: 700, textDecoration: 'underline', fontSize: '14px' }}>
                    Change
                  </button>
                </p>

                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: colors.gravelGrey, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                  6-Digit Code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={authOtp}
                  onChange={(e) => {
                    setAuthError(null);
                    setAuthOtp(e.target.value.replace(/\D/g, ''));
                  }}
                  placeholder="• • • • • •"
                  style={{ width: '100%', height: '56px', border: `1.5px solid ${colors.asphalt}`, borderRadius: '4px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '24px', fontWeight: 700, letterSpacing: '0.45em', color: colors.asphalt }}
                />

                <div style={{ marginTop: '12px', fontSize: '12px', color: colors.gravelGrey }}>
                  Preview mode: enter any 6 digits (e.g. <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>123456</span>) if testing offline.
                </div>

                {authError && (
                  <div style={{ backgroundColor: colors.redLight, color: colors.rustRed, fontSize: '13px', fontWeight: 600, padding: '10px 12px', borderRadius: '4px', marginTop: '10px' }}>
                    {authError}
                  </div>
                )}
              </div>
            </div>

            <div style={{ padding: '20px', backgroundColor: colors.waybillPaper, borderTop: `1px solid ${colors.grey200}` }}>
              <button
                disabled={authLoading}
                onClick={async () => {
                  if (authOtp.length !== 6) {
                    setAuthError('Please enter the 6-digit verification code.');
                    return;
                  }
                  setAuthLoading(true);
                  setAuthError(null);
                  try {
                    const res = await vagrovaApi.verifyOtp(authPhone.replace(/[\s\-()]/g, ''), authOtp);
                    setAuthToken(res.accessToken);
                    if (typeof window !== 'undefined') {
                      localStorage.setItem('vagrova_customer_token', res.accessToken);
                      localStorage.setItem('vagrova_customer_phone', authPhone);
                    }
                    if (res.isReturningUser && res.user?.name && res.user.name !== 'New User') {
                      setCustomerName(res.user.name);
                      setIsReturningClient(true);
                      setTotalTrips(res.totalJobs ?? 0);
                      if (typeof window !== 'undefined') {
                        localStorage.setItem('vagrova_customer_name', res.user.name);
                      }
                      if (res.user.companyName) {
                        setCompanyName(res.user.companyName);
                        if (typeof window !== 'undefined') {
                          localStorage.setItem('vagrova_customer_company', res.user.companyName);
                        }
                      }
                      setScreen('home');
                    } else {
                      setIsReturningClient(false);
                      setScreen('auth_profile');
                    }
                  } catch (err: any) {
                    setAuthError(err?.message || 'Invalid or expired verification code.');
                  } finally {
                    setAuthLoading(false);
                  }
                }}
                style={{ width: '100%', height: '54px', backgroundColor: colors.safetyAmber, color: colors.asphalt, border: 'none', borderRadius: '4px', fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <span>{authLoading ? 'Verifying...' : 'Verify & Continue'}</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            SCREEN 0D: FIRST-TIME PROFILE SETUP (Individual or Company)
           ════════════════════════════════════════════════════════════════════ */}
        {screen === 'auth_profile' && (
          <div className="anim-screen-slide" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', backgroundColor: colors.roadWhite, minHeight: '100vh' }}>
            <div>
              <header style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${colors.grey200}` }}>
                <button
                  onClick={() => setScreen('auth_otp')}
                  aria-label="Back"
                  style={{ width: '36px', height: '36px', borderRadius: '4px', border: `1px solid ${colors.grey200}`, backgroundColor: colors.waybillPaper, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <ArrowLeft size={18} />
                </button>
                <img src="/vagrova-logo.png" alt="Vagrova" style={{ height: '22px', width: 'auto' }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, color: colors.gravelGrey }}>3/3</span>
              </header>

              <div style={{ padding: '24px 20px' }}>
                <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', fontWeight: 700, color: colors.asphalt, marginBottom: '6px' }}>
                  Complete your profile
                </h1>
                <p style={{ fontSize: '14px', color: colors.gravelGrey, marginBottom: '18px' }}>
                  Tell us who we are hauling for so your consignment notes are formatted properly.
                </p>

                {/* Account Type Selector */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '18px' }}>
                  <button
                    onClick={() => setAccountType('individual')}
                    style={{
                      backgroundColor: accountType === 'individual' ? colors.asphalt : colors.waybillPaper,
                      color: accountType === 'individual' ? colors.roadWhite : colors.asphalt,
                      border: `1.5px solid ${accountType === 'individual' ? colors.asphalt : colors.grey300}`,
                      borderRadius: '6px',
                      padding: '14px 12px',
                      textAlign: 'left',
                    }}
                  >
                    <User size={18} color={accountType === 'individual' ? colors.safetyAmber : colors.asphalt} style={{ marginBottom: '6px' }} />
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: 700 }}>Individual</div>
                    <div style={{ fontSize: '11px', opacity: 0.75, marginTop: '2px' }}>Personal or one-off move</div>
                  </button>

                  <button
                    onClick={() => setAccountType('company')}
                    style={{
                      backgroundColor: accountType === 'company' ? colors.asphalt : colors.waybillPaper,
                      color: accountType === 'company' ? colors.roadWhite : colors.asphalt,
                      border: `1.5px solid ${accountType === 'company' ? colors.asphalt : colors.grey300}`,
                      borderRadius: '6px',
                      padding: '14px 12px',
                      textAlign: 'left',
                    }}
                  >
                    <Building2 size={18} color={accountType === 'company' ? colors.safetyAmber : colors.asphalt} style={{ marginBottom: '6px' }} />
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: 700 }}>Company</div>
                    <div style={{ fontSize: '11px', opacity: 0.75, marginTop: '2px' }}>Contractors, farms, factories</div>
                  </button>
                </div>

                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: colors.gravelGrey, textTransform: 'uppercase', marginBottom: '4px' }}>
                  Your Full Name *
                </label>
                <input
                  value={customerName}
                  onChange={(e) => {
                    setAuthError(null);
                    setCustomerName(e.target.value);
                  }}
                  placeholder="e.g. Samuel Mensah"
                  style={{ width: '100%', height: '46px', border: `1px solid ${colors.grey300}`, borderRadius: '4px', padding: '0 12px', marginBottom: '12px' }}
                />

                {accountType === 'company' && (
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: colors.gravelGrey, textTransform: 'uppercase', marginBottom: '4px' }}>
                      Company / Business Name *
                    </label>
                    <input
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Mensah Civil Works Ltd"
                      style={{ width: '100%', height: '46px', border: `1px solid ${colors.grey300}`, borderRadius: '4px', padding: '0 12px' }}
                    />
                  </div>
                )}

                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: colors.gravelGrey, textTransform: 'uppercase', marginBottom: '4px' }}>
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="For PDF receipts & invoices (1-click unsubscribe included)"
                  style={{ width: '100%', height: '46px', border: `1px solid ${colors.grey300}`, borderRadius: '4px', padding: '0 12px', marginBottom: '12px' }}
                />

                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', color: colors.gravelGrey, lineHeight: 1.45, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={acceptedTermsAndAge}
                    onChange={(e) => {
                      setAuthError(null);
                      setAcceptedTermsAndAge(e.target.checked);
                    }}
                    style={{ marginTop: '3px', flexShrink: 0 }}
                  />
                  <span>
                    I confirm I am <strong>18+ years old</strong> and agree to Vagrova&apos;s{' '}
                    <Link href="/legal?tab=terms" style={{ color: colors.asphalt, fontWeight: 700, textDecoration: 'underline' }}>Terms</Link>,{' '}
                    <Link href="/legal?tab=privacy" style={{ color: colors.asphalt, fontWeight: 700, textDecoration: 'underline' }}>Privacy Policy</Link>, and{' '}
                    <Link href="/legal?tab=refund" style={{ color: colors.asphalt, fontWeight: 700, textDecoration: 'underline' }}>Refund Policy</Link>.
                  </span>
                </label>

                {authError && (
                  <div style={{ backgroundColor: colors.redLight, color: colors.rustRed, fontSize: '13px', fontWeight: 600, padding: '10px 12px', borderRadius: '4px', marginTop: '12px' }}>
                    {authError}
                  </div>
                )}
              </div>
            </div>

            <div style={{ padding: '20px', backgroundColor: colors.waybillPaper, borderTop: `1px solid ${colors.grey200}` }}>
              <button
                disabled={authLoading}
                onClick={async () => {
                  if (!customerName.trim()) {
                    setAuthError('Please enter your name to continue.');
                    return;
                  }
                  if (accountType === 'company' && !companyName.trim()) {
                    setAuthError('Please enter your company name.');
                    return;
                  }
                  if (!acceptedTermsAndAge) {
                    setAuthError('Please confirm you are 18+ and accept the Terms & Privacy Policy.');
                    return;
                  }
                  setAuthLoading(true);
                  setAuthError(null);
                  const cleanName = customerName.trim();
                  const cleanCompany = accountType === 'company' ? companyName.trim() : '';
                  try {
                    if (authToken) {
                      await vagrovaApi.updateProfile(authToken, {
                        name: cleanName,
                        companyName: cleanCompany || undefined,
                        email: customerEmail.trim() || undefined,
                      });
                    }
                    if (typeof window !== 'undefined') {
                      localStorage.setItem('vagrova_customer_name', cleanName);
                      if (cleanCompany) {
                        localStorage.setItem('vagrova_customer_company', cleanCompany);
                      } else {
                        localStorage.removeItem('vagrova_customer_company');
                      }
                    }
                    setIsReturningClient(false);
                    setScreen('home');
                  } catch {
                    if (typeof window !== 'undefined') {
                      localStorage.setItem('vagrova_customer_name', cleanName);
                    }
                    setScreen('home');
                  } finally {
                    setAuthLoading(false);
                  }
                }}
                style={{ width: '100%', height: '54px', backgroundColor: colors.safetyAmber, color: colors.asphalt, border: 'none', borderRadius: '4px', fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <span>Finish Setup & Start Booking</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            SCREEN 1: HOME (Ultra-Clean Minimalist + Editorial)
           ════════════════════════════════════════════════════════════════════ */}
        {screen === 'home' && (
          <div className="anim-fade-up" style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingBottom: '96px', backgroundColor: colors.roadWhite }}>
            {/* Clean Centered Top Bar */}
            <header
              style={{
                padding: '16px 18px 10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <button
                onClick={() => setScreen('welcome')}
                aria-label="Logo"
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <img
                  src="/vagrova-logo.png"
                  alt="Vagrova"
                  style={{ height: '22px', width: 'auto', display: 'block' }}
                />
              </button>

              <button
                onClick={() => setScreen('route')}
                style={{
                  background: 'none',
                  border: 'none',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: '10px', fontWeight: 600, color: colors.gravelGrey, letterSpacing: '0.04em' }}>
                  Location
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 700, color: colors.asphalt }}>
                  <MapPin size={12} color={colors.safetyAmber} /> Accra, GH
                </span>
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  onClick={() => setLanguage(language === 'EN' ? 'TWI' : language === 'TWI' ? 'GA' : 'EN')}
                  style={{
                    height: '34px',
                    padding: '0 8px',
                    borderRadius: '4px',
                    border: `1px solid ${colors.grey200}`,
                    backgroundColor: colors.waybillPaper,
                    fontSize: '11px',
                    fontWeight: 700,
                    color: colors.asphalt,
                  }}
                >
                  {language}
                </button>
                <NotificationBellButton
                  unreadCount={notifications.filter((n) => !n.read).length}
                  onClick={() => setNotifOpen(true)}
                />
                <button
                  onClick={() => pushNotification('Voice Guide', 'Voice guidance is ready for this screen.', 'info')}
                  aria-label="Read aloud"
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '4px',
                    border: `1px solid ${colors.grey200}`,
                    backgroundColor: colors.waybillPaper,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Volume2 size={15} color={colors.asphalt} />
                </button>
              </div>
            </header>

            <div style={{ padding: '10px 18px 18px' }}>
              {/* Editorial Headline */}
              <div style={{ fontSize: '12px', fontWeight: 600, color: colors.gravelGrey, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span>
                  {customerName
                    ? `${isReturningClient ? 'Welcome back' : 'Welcome'}, ${customerName.split(' ')[0]}${companyName ? ` · ${companyName}` : ''}`
                    : 'Haul Heavy Loads'}
                </span>
                {isReturningClient && (
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '2px 7px',
                      borderRadius: '999px',
                      backgroundColor: colors.waybillPaper,
                      color: colors.asphalt,
                      border: `1px solid ${colors.grey200}`,
                    }}
                  >
                    {totalTrips > 0 ? `Returning Client · ${totalTrips} ${totalTrips === 1 ? 'Trip' : 'Trips'}` : 'Returning Client'}
                  </span>
                )}
              </div>
              <h1
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '30px',
                  fontWeight: 700,
                  color: colors.asphalt,
                  lineHeight: 1.12,
                  marginBottom: '16px',
                  letterSpacing: '-0.015em',
                }}
              >
                Move Cargo{' '}
                <span style={{ textDecoration: 'underline', textDecorationColor: colors.safetyAmber, textUnderlineOffset: '5px' }}>
                  Anywhere.
                </span>
              </h1>

              {/* Clean Search Row + Solid Asphalt Filter/Schedule Button */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
                <button
                  onClick={() => setScreen(serviceGroup === 'MACHINERY' ? 'machinery_request' : 'route')}
                  style={{
                    flex: 1,
                    height: '48px',
                    backgroundColor: colors.waybillPaper,
                    border: `1px solid ${colors.grey200}`,
                    borderRadius: '6px',
                    padding: '0 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    textAlign: 'left',
                  }}
                >
                  <Search size={17} color={colors.gravelGrey} />
                  <span style={{ fontSize: '15px', fontWeight: 500, color: colors.gravelGrey }}>
                    {serviceGroup === 'MACHINERY' ? 'Project site location?' : 'Where to?'}
                  </span>
                </button>
                <button
                  onClick={() => setScreen(serviceGroup === 'MACHINERY' ? 'machinery_request' : 'route')}
                  aria-label="Schedule"
                  style={{
                    width: '48px',
                    height: '48px',
                    backgroundColor: colors.asphalt,
                    color: colors.safetyAmber,
                    border: 'none',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Calendar size={18} />
                </button>
              </div>

              {lastBooking && (
                <div
                  style={{
                    backgroundColor: colors.asphalt,
                    color: colors.roadWhite,
                    borderRadius: '12px',
                    padding: '12px 14px',
                    marginBottom: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '10px',
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        color: colors.safetyAmber,
                        textTransform: 'uppercase',
                      }}
                    >
                      Quick Rebook · Last Trip
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 700, marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {lastBooking.equipmentName}
                    </div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.78)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {lastBooking.serviceGroup === 'MACHINERY'
                        ? lastBooking.pickupAddress
                        : `${lastBooking.pickupAddress} → ${lastBooking.deliveryAddress}`}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedEquipmentId(lastBooking.equipmentId || null);
                      setSelectedEquipmentName(lastBooking.equipmentName);
                      setServiceGroup(lastBooking.serviceGroup);
                      if (lastBooking.serviceGroup === 'MACHINERY') {
                        setProjectLocation(lastBooking.pickupAddress);
                        setScreen('machinery_request');
                      } else {
                        setPickupAddress(lastBooking.pickupAddress);
                        setDeliveryAddress(lastBooking.deliveryAddress);
                        setScreen('photos');
                      }
                    }}
                    style={{
                      backgroundColor: colors.safetyAmber,
                      color: colors.asphalt,
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 12px',
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

              {/* Service Category A vs B Selector */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  backgroundColor: colors.waybillPaper,
                  borderRadius: '10px',
                  padding: '4px',
                  border: `1px solid ${colors.grey200}`,
                  marginBottom: '12px',
                }}
              >
                {(
                  [
                    { id: 'TRANSPORT', label: 'Trucks & Transport' },
                    { id: 'MACHINERY', label: 'Construction & Mining' },
                  ] as const
                ).map((tab) => {
                  const active = serviceGroup === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setServiceGroup(tab.id)}
                      style={{
                        height: '36px',
                        borderRadius: '7px',
                        border: 'none',
                        backgroundColor: active ? colors.asphalt : 'transparent',
                        color: active ? colors.safetyAmber : colors.gravelGrey,
                        fontSize: '12px',
                        fontWeight: 700,
                      }}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Equipment Quick Selector */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                {(
                  equipmentCatalog.find((c) => c.group === serviceGroup)?.equipmentTypes ||
                  (serviceGroup === 'TRANSPORT'
                    ? [
                        { id: 'crane', name: 'Crane', pricingModel: 'HOURLY' },
                        { id: 'flatbed', name: 'Flatbed Truck', pricingModel: 'PER_KM' },
                        { id: 'towing', name: 'Towing Truck', pricingModel: 'PER_KM' },
                        { id: 'cargo_station', name: 'Cargo Station', pricingModel: 'PROJECT_CONTRACT', isProvisional: true },
                        { id: 'forklift', name: 'Forklift', pricingModel: 'HOURLY' },
                        { id: 'tipper', name: 'Tipper Truck', pricingModel: 'PER_KM' },
                        { id: 'trailer', name: 'Trailer', pricingModel: 'PER_KM' },
                        { id: 'lowbed', name: 'Lowbed Truck', pricingModel: 'PER_KM' },
                      ]
                    : [
                        { id: 'excavator', name: 'Excavator', pricingModel: 'DAILY' },
                        { id: 'backhoe', name: 'Backhoe', pricingModel: 'DAILY' },
                        { id: 'payloader', name: 'Payloader / Wheel Loader', pricingModel: 'DAILY' },
                        { id: 'dozer', name: 'Dozer / Bulldozer', pricingModel: 'DAILY' },
                        { id: 'grader', name: 'Grader', pricingModel: 'DAILY' },
                        { id: 'roller', name: 'Roller / Compactor', pricingModel: 'DAILY' },
                        { id: 'water_tanker', name: 'Water Tanker', pricingModel: 'DAILY' },
                      ])
                ).map((eq: any) => (
                  <button
                    key={eq.id}
                    onClick={() => {
                      setSelectedEquipmentId(eq.id);
                      setSelectedEquipmentName(eq.name);
                      if (serviceGroup === 'MACHINERY') {
                        setScreen('machinery_request');
                      } else if (eq.code === 'CARGO_STATION' || eq.id === 'cargo_station') {
                        setScreen('cargo_station_request');
                      } else {
                        if (eq.legacyVehicleType) {
                          setVehicleType(eq.legacyVehicleType.toLowerCase() as VehicleType);
                        }
                        setScreen('route');
                      }
                    }}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '8px',
                      backgroundColor: colors.roadWhite,
                      border: `1px solid ${colors.grey200}`,
                      color: colors.asphalt,
                      fontSize: '12px',
                      fontWeight: 600,
                    }}
                  >
                    {eq.name}
                    {eq.isProvisional ? ' · Provisional' : ''}
                  </button>
                ))}
              </div>

              {/* Clean Hero Showcase Stage (Inspired by Minimalist Ride Card) */}
              <div
                style={{
                  backgroundColor: colors.waybillPaper,
                  border: `1px solid ${colors.grey200}`,
                  borderRadius: '8px',
                  padding: '18px 16px 14px',
                  marginBottom: '16px',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', color: colors.gravelGrey }}>
                    READY IN ACCRA & TEMA
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, color: colors.weighbridgeGreen }}>
                    FLEET READY ON DEMAND
                  </span>
                </div>

                {/* Centered Photorealistic Truck */}
                <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 14px' }}>
                  <img
                    src="/trucks/book-truck.jpg"
                    alt="Vagrova Heavy Haulage"
                    style={{ width: '240px', height: '124px', objectFit: 'contain', mixBlendMode: 'multiply' }}
                  />
                </div>

                {/* Floating Dual Action Cards (White + Dark Asphalt) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    onClick={() => setScreen('route')}
                    className="vagrova-card-tap"
                    style={{
                      backgroundColor: colors.roadWhite,
                      border: `1px solid ${colors.grey200}`,
                      borderRadius: '6px',
                      padding: '12px 14px',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <Truck size={18} color={colors.asphalt} />
                      <span style={{ fontSize: '11px', fontWeight: 700, color: colors.gravelGrey }}>Quote</span>
                    </div>
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: 700, color: colors.asphalt }}>
                      Book a Truck
                    </div>
                  </button>

                  <button
                    onClick={() => setScreen('callback')}
                    className="vagrova-card-tap"
                    style={{
                      backgroundColor: colors.asphalt,
                      border: `1px solid ${colors.asphalt}`,
                      borderRadius: '6px',
                      padding: '12px 14px',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <PhoneCall size={18} color={colors.safetyAmber} />
                      <span style={{ fontSize: '11px', fontWeight: 700, color: colors.safetyAmber }}>24/7</span>
                    </div>
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: 700, color: colors.roadWhite }}>
                      Call to Book
                    </div>
                  </button>
                </div>
              </div>

              {/* Clean Fleet Quick Access (Heavy Plant & Container) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '18px' }}>
                <button
                  onClick={() => {
                    setVehicleType('crane_truck');
                    setScreen('truck_detail');
                  }}
                  className="vagrova-card-tap"
                  style={{
                    backgroundColor: colors.roadWhite,
                    border: `1px solid ${colors.grey200}`,
                    borderRadius: '6px',
                    padding: '12px',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <img src="/trucks/heavy-plant.jpg" alt="Heavy Plant" style={{ width: '56px', height: '40px', objectFit: 'contain' }} />
                  <div>
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: '14px', fontWeight: 700 }}>Heavy Plant</div>
                    <div style={{ fontSize: '11px', color: colors.gravelGrey }}>Cranes & excavators</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setVehicleType('container_carrier');
                    setScreen('truck_detail');
                  }}
                  className="vagrova-card-tap"
                  style={{
                    backgroundColor: colors.roadWhite,
                    border: `1px solid ${colors.grey200}`,
                    borderRadius: '6px',
                    padding: '12px',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <img src="/trucks/container-carrier.jpg" alt="Port Runs" style={{ width: '56px', height: '40px', objectFit: 'contain' }} />
                  <div>
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: '14px', fontWeight: 700 }}>Port Runs</div>
                    <div style={{ fontSize: '11px', color: colors.gravelGrey }}>20ft &amp; 40ft containers</div>
                  </div>
                </button>
              </div>

              <footer
                aria-label="Legal and compliance links"
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                  gap: '10px',
                  padding: '6px 4px 12px',
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

              {/* Popular Haulage Sites */}
              <div style={{ fontSize: '11px', fontWeight: 700, color: colors.gravelGrey, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                Popular Sites
              </div>
              <div style={{ border: `1px solid ${colors.grey200}`, borderRadius: '6px', overflow: 'hidden' }}>
                {POPULAR_LOCATIONS.slice(0, 3).map((loc, idx) => (
                  <button
                    key={loc.name}
                    onClick={() => {
                      setDeliveryAddress(loc.name);
                      setScreen('route');
                    }}
                    style={{
                      width: '100%',
                      backgroundColor: colors.roadWhite,
                      border: 'none',
                      borderBottom: idx < 2 ? `1px solid ${colors.grey100}` : 'none',
                      padding: '11px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      textAlign: 'left',
                    }}
                  >
                    <Clock size={15} color={colors.gravelGrey} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: colors.asphalt, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {loc.name}
                      </div>
                      <div style={{ fontSize: '11px', color: colors.gravelGrey }}>{loc.area}</div>
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: colors.gravelGrey }}>{loc.eta}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            SCREEN 2: ROUTE ENTRY (Qargo + Bolt Style: Connected P & D)
           ════════════════════════════════════════════════════════════════════ */}
        {screen === 'route' && (
          <div className="anim-screen-slide" style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: colors.roadWhite }}>
            <div style={{ padding: '14px 16px', borderBottom: `1px solid ${colors.grey200}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button
                onClick={() => setScreen('home')}
                aria-label="Back"
                style={{ width: '36px', height: '36px', borderRadius: '4px', border: `1px solid ${colors.grey200}`, backgroundColor: colors.grey100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ArrowLeft size={18} />
              </button>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: '17px', fontWeight: 700 }}>
                Set Route & Site Contacts
              </span>
              <button
                onClick={handleSwapAddresses}
                title="Swap pickup and delivery"
                style={{ width: '36px', height: '36px', borderRadius: '4px', border: `1px solid ${colors.grey200}`, backgroundColor: colors.grey100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ArrowUpDown size={16} />
              </button>
            </div>

            <div style={{ padding: '16px', flex: 1, overflowY: 'auto', paddingBottom: '100px' }}>
              <div style={{ border: `1.5px solid ${colors.asphalt}`, borderRadius: '6px', padding: '12px', backgroundColor: colors.waybillPaper, marginBottom: '12px' }}>
                {/* Pickup Row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '10px' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '4px', backgroundColor: colors.asphalt, color: colors.safetyAmber, fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      P
                    </div>
                    <div style={{ width: '2px', height: '38px', backgroundColor: colors.grey300, marginTop: '4px' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: colors.gravelGrey, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Pickup Location
                    </div>
                    <input
                      value={pickupAddress}
                      onChange={(e) => setPickupAddress(e.target.value)}
                      placeholder="Enter pickup location"
                      style={{ width: '100%', height: '38px', border: 'none', borderBottom: `1px solid ${colors.grey300}`, backgroundColor: 'transparent', fontSize: '15px', fontWeight: 600 }}
                    />
                    <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: colors.roadWhite, border: `1px solid ${colors.grey200}`, borderRadius: '4px', padding: '3px 8px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                        <Phone size={11} /> {pickupContactPhone}
                      </span>
                      <button
                        onClick={() => setPickupAddress('Current Location · JQ56+RCM Accra')}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: colors.roadWhite, border: `1px solid ${colors.grey200}`, borderRadius: '4px', padding: '3px 8px', fontSize: '11px', fontWeight: 600 }}
                      >
                        <LocateFixed size={11} /> Use GPS
                      </button>
                    </div>
                  </div>
                </div>

                {/* Extra Stops */}
                {extraStops.map((stop, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', paddingLeft: '4px' }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: `2px solid ${colors.asphalt}`, backgroundColor: colors.roadWhite }} />
                    <input
                      value={stop}
                      onChange={(e) => {
                        const copy = [...extraStops];
                        copy[idx] = e.target.value;
                        setExtraStops(copy);
                      }}
                      placeholder="Enter extra stop"
                      style={{ flex: 1, height: '36px', border: 'none', borderBottom: `1px solid ${colors.grey300}`, backgroundColor: 'transparent', fontSize: '14px' }}
                    />
                    <button onClick={() => setExtraStops(extraStops.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', color: colors.rustRed }}>
                      <X size={15} />
                    </button>
                  </div>
                ))}

                {/* Dropoff Row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <div style={{ paddingTop: '10px' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '4px', backgroundColor: colors.safetyAmber, color: colors.asphalt, fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      D
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: colors.gravelGrey, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Dropoff Location
                    </div>
                    <input
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Enter dropoff location"
                      style={{ width: '100%', height: '38px', border: 'none', borderBottom: `1px solid ${colors.grey300}`, backgroundColor: 'transparent', fontSize: '15px', fontWeight: 600 }}
                    />
                    <div style={{ display: 'flex', gap: '8px', marginTop: '6px', alignItems: 'center' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: colors.roadWhite, border: `1px solid ${colors.grey200}`, borderRadius: '4px', padding: '3px 8px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                        <Phone size={11} /> {deliveryContactPhone}
                      </span>
                      <button
                        onClick={() => setRecordingVoice(!recordingVoice)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          backgroundColor: recordingVoice ? colors.redLight : colors.roadWhite,
                          border: `1px solid ${recordingVoice ? colors.rustRed : colors.grey200}`,
                          color: recordingVoice ? colors.rustRed : colors.asphalt,
                          borderRadius: '4px',
                          padding: '3px 8px',
                          fontSize: '11px',
                          fontWeight: 600,
                        }}
                      >
                        <Mic size={11} /> {recordingVoice ? 'Recording...' : 'Landmark Voice Note'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setExtraStops([...extraStops, ''])}
                style={{
                  width: '100%',
                  height: '44px',
                  backgroundColor: colors.roadWhite,
                  border: `1px solid ${colors.grey300}`,
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: colors.asphalt,
                  marginBottom: '18px',
                }}
              >
                <Plus size={16} /> Add Another Stop
              </button>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: colors.gravelGrey, textTransform: 'uppercase', marginBottom: '4px' }}>
                  Delivery Landmark Note
                </label>
                <input
                  value={deliveryLandmark}
                  onChange={(e) => setDeliveryLandmark(e.target.value)}
                  placeholder="e.g. Behind Kasapreko depot, blue double gate"
                  style={{ width: '100%', height: '44px', border: `1px solid ${colors.grey300}`, borderRadius: '4px', padding: '0 12px', fontSize: '14px' }}
                />
              </div>

              <div style={{ fontSize: '11px', fontWeight: 700, color: colors.gravelGrey, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                Suggested Sites in Accra & Tema
              </div>
              {POPULAR_LOCATIONS.map((loc) => (
                <button
                  key={loc.name}
                  onClick={() => setDeliveryAddress(loc.name)}
                  style={{
                    width: '100%',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderBottom: `1px solid ${colors.grey100}`,
                    padding: '11px 4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    textAlign: 'left',
                  }}
                >
                  <Clock size={16} color={colors.gravelGrey} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: colors.asphalt }}>{loc.name}</div>
                    <div style={{ fontSize: '12px', color: colors.gravelGrey }}>{loc.area}</div>
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: colors.gravelGrey }}>{loc.distance}</span>
                </button>
              ))}
            </div>

            <div style={{ position: 'sticky', bottom: 0, backgroundColor: colors.roadWhite, borderTop: `1px solid ${colors.grey200}`, padding: '12px 16px' }}>
              <button
                onClick={() => setScreen('vehicles')}
                style={{
                  width: '100%',
                  height: '52px',
                  backgroundColor: colors.safetyAmber,
                  color: colors.asphalt,
                  border: 'none',
                  borderRadius: '4px',
                  fontFamily: 'var(--font-heading)',
                  fontSize: '16px',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                }}
              >
                CONTINUE TO CHOOSE TRUCK
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            SCREEN 3: MAP + BOTTOM SHEET VEHICLE PICKER (Bolt / Yango Style)
           ════════════════════════════════════════════════════════════════════ */}
        {screen === 'vehicles' && (
          <div className="anim-screen-slide" style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: colors.roadWhite }}>
            <div
              style={{
                height: '240px',
                backgroundColor: '#E4DFD3',
                position: 'relative',
                overflow: 'hidden',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  right: '12px',
                  backgroundColor: colors.roadWhite,
                  border: `1px solid ${colors.grey300}`,
                  borderRadius: '6px',
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  zIndex: 1000,
                }}
              >
                <button onClick={() => setScreen('route')} style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center' }}>
                  <ArrowLeft size={18} />
                </button>
                <div style={{ flex: 1, fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {pickupAddress} → {deliveryAddress}
                </div>
                <button onClick={() => setScreen('route')} style={{ background: 'none', border: 'none' }}>
                  <Plus size={16} />
                </button>
              </div>

              <RouteMap height="240px" pickupLabel="Pickup · ~15 min" dropoffLabel="Dropoff · 28.5 km" />
            </div>

            <div
              style={{
                backgroundColor: colors.asphalt,
                color: colors.roadWhite,
                padding: '9px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              <span>Company Quotation · Reviewed by Vagrova Booking Officer</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: colors.safetyAmber }}>GHS</span>
            </div>

            <div style={{ padding: '10px 14px 4px', display: 'flex', gap: '8px', overflowX: 'auto' }}>
              {[
                { id: 'all', label: 'All Equipment' },
                { id: 'TRANSPORT', label: 'Trucks & Transport' },
                { id: 'MACHINERY', label: 'Construction & Mining' },
              ].map((tab) => {
                const active = (tab.id === 'all' && vehicleFilter === 'all') || (tab.id !== 'all' && serviceGroup === tab.id && vehicleFilter !== 'all');
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      if (tab.id === 'all') {
                        setVehicleFilter('all');
                      } else {
                        setServiceGroup(tab.id as 'TRANSPORT' | 'MACHINERY');
                        setVehicleFilter('plant');
                      }
                    }}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '20px',
                      border: `1px solid ${active ? colors.asphalt : colors.grey200}`,
                      backgroundColor: active ? colors.asphalt : colors.roadWhite,
                      color: active ? colors.safetyAmber : colors.asphalt,
                      fontSize: '12px',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px', paddingBottom: '16px' }}>
              {(equipmentCatalog.length > 0
                ? equipmentCatalog.flatMap((cat) =>
                    cat.equipmentTypes.map((eq: any) => ({ ...eq, group: cat.group })),
                  )
                : [
                    { id: 'crane', code: 'CRANE', name: 'Crane', group: 'TRANSPORT', pricingModel: 'HOURLY', legacyVehicleType: 'CRANE_TRUCK' },
                    { id: 'flatbed', code: 'FLATBED_TRUCK', name: 'Flatbed Truck', group: 'TRANSPORT', pricingModel: 'PER_KM', legacyVehicleType: 'FLATBED' },
                    { id: 'towing', code: 'TOWING_TRUCK', name: 'Towing Truck', group: 'TRANSPORT', pricingModel: 'PER_KM', legacyVehicleType: 'TOW_RECOVERY' },
                    { id: 'cargo_station', code: 'CARGO_STATION', name: 'Cargo Station', group: 'TRANSPORT', pricingModel: 'PROJECT_CONTRACT', legacyVehicleType: 'CONTAINER_CARRIER' },
                    { id: 'forklift', code: 'FORKLIFT', name: 'Forklift', group: 'TRANSPORT', pricingModel: 'HOURLY', legacyVehicleType: 'CRANE_TRUCK' },
                    { id: 'tipper', code: 'TIPPER_TRUCK', name: 'Tipper Truck', group: 'TRANSPORT', pricingModel: 'PER_KM', legacyVehicleType: 'TIPPER' },
                    { id: 'trailer', code: 'TRAILER', name: 'Trailer', group: 'TRANSPORT', pricingModel: 'PER_KM', legacyVehicleType: 'CONTAINER_CARRIER' },
                    { id: 'lowbed', code: 'LOWBED_TRUCK', name: 'Lowbed Truck', group: 'TRANSPORT', pricingModel: 'PER_KM', legacyVehicleType: 'LOWBED' },
                    { id: 'excavator', code: 'EXCAVATOR', name: 'Excavator', group: 'MACHINERY', pricingModel: 'DAILY', legacyVehicleType: 'LOWBED' },
                    { id: 'backhoe', code: 'BACKHOE', name: 'Backhoe', group: 'MACHINERY', pricingModel: 'DAILY', legacyVehicleType: 'LOWBED' },
                    { id: 'payloader', code: 'PAYLOADER', name: 'Payloader / Wheel Loader', group: 'MACHINERY', pricingModel: 'DAILY', legacyVehicleType: 'LOWBED' },
                    { id: 'dozer', code: 'DOZER', name: 'Dozer / Bulldozer', group: 'MACHINERY', pricingModel: 'DAILY', legacyVehicleType: 'LOWBED' },
                    { id: 'grader', code: 'GRADER', name: 'Grader', group: 'MACHINERY', pricingModel: 'DAILY', legacyVehicleType: 'LOWBED' },
                    { id: 'roller', code: 'ROLLER_COMPACTOR', name: 'Roller / Compactor', group: 'MACHINERY', pricingModel: 'DAILY', legacyVehicleType: 'LOWBED' },
                    { id: 'water_tanker', code: 'WATER_TANKER', name: 'Water Tanker', group: 'MACHINERY', pricingModel: 'DAILY', legacyVehicleType: 'TANKER' },
                  ]
              )
                .filter((eq: any) => vehicleFilter === 'all' || eq.group === serviceGroup)
                .map((eq: any) => {
                  const isSelected = selectedEquipmentId === eq.id || selectedEquipmentName === eq.name;
                  return (
                    <button
                      key={eq.id}
                      onClick={() => {
                        setSelectedEquipmentId(eq.id);
                        setSelectedEquipmentName(eq.name);
                        setServiceGroup(eq.group);
                        if (eq.legacyVehicleType) {
                          setVehicleType(eq.legacyVehicleType.toLowerCase() as VehicleType);
                        }
                        if (eq.group === 'MACHINERY') {
                          setScreen('machinery_request');
                        } else if (eq.code === 'CARGO_STATION') {
                          setScreen('cargo_station_request');
                        } else {
                          setScreen('load');
                        }
                      }}
                      style={{
                        width: '100%',
                        backgroundColor: isSelected ? '#FFFDF7' : colors.roadWhite,
                        border: isSelected ? `2px solid ${colors.asphalt}` : `1px solid ${colors.grey200}`,
                        borderRadius: '8px',
                        padding: '12px',
                        marginBottom: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        textAlign: 'left',
                      }}
                    >
                      <img
                        src={
                          eq.group === 'MACHINERY' || eq.code === 'CRANE'
                            ? '/trucks/heavy-plant.jpg'
                            : eq.code === 'TRAILER' || eq.code === 'CARGO_STATION'
                            ? '/trucks/container-carrier.jpg'
                            : '/trucks/book-truck.jpg'
                        }
                        alt={eq.name}
                        style={{ width: '84px', height: '54px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: 700, color: colors.asphalt }}>
                            {eq.name}
                          </span>
                          <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.05em', backgroundColor: eq.group === 'MACHINERY' ? colors.safetyAmber : colors.grey100, color: colors.asphalt, padding: '2px 6px', borderRadius: '3px' }}>
                            {eq.group === 'MACHINERY' ? 'MACHINERY' : 'TRANSPORT'}
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: colors.gravelGrey, marginTop: '3px' }}>
                          Pricing: <strong>{String(eq.pricingModel || 'CUSTOM').replace('_', ' ')}</strong>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 800, color: colors.asphalt }}>
                          {formatGhs(getRateGhs(eq).base)}
                        </div>
                        <div style={{ fontSize: '10px', color: colors.gravelGrey }}>
                          {eq.pricingModel === 'DAILY'
                            ? '/ day'
                            : eq.pricingModel === 'HOURLY'
                            ? `+ ${formatGhs(getRateGhs(eq).unit)}/hr`
                            : eq.pricingModel === 'PER_KM'
                            ? `+ ${formatGhs(getRateGhs(eq).unit)}/km`
                            : 'Base rate'}
                        </div>
                      </div>
                    </button>
                  );
                })}

              <button
                onClick={() => setScreen('callback')}
                style={{
                  width: '100%',
                  backgroundColor: colors.grey100,
                  border: `1px solid ${colors.grey300}`,
                  borderRadius: '6px',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left' }}>
                  <HelpCircle size={20} color={colors.asphalt} />
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700 }}>Not sure which truck?</div>
                    <div style={{ fontSize: '12px', color: colors.gravelGrey }}>Call dispatch to recommend</div>
                  </div>
                </div>
                <ChevronRight size={16} />
              </button>
            </div>

            <div style={{ backgroundColor: colors.roadWhite, borderTop: `1px solid ${colors.grey200}`, padding: '12px 16px' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setScreen('truck_detail')}
                  style={{
                    flex: 1,
                    height: '52px',
                    backgroundColor: colors.safetyAmber,
                    color: colors.asphalt,
                    border: 'none',
                    borderRadius: '4px',
                    fontFamily: 'var(--font-heading)',
                    fontSize: '16px',
                    fontWeight: 700,
                  }}
                >
                  Select {VEHICLE_LABELS[vehicleType]}
                </button>
                <a
                  href="tel:+233302000000"
                  title="Call Vagrova"
                  style={{
                    width: '52px',
                    height: '52px',
                    backgroundColor: colors.asphalt,
                    color: colors.safetyAmber,
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Phone size={20} />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            SCREEN 3B: TRUCK SPEC & PLAN SHEET (Warm Cream + Dark Asphalt Sheet)
           ════════════════════════════════════════════════════════════════════ */}
        {screen === 'truck_detail' && (
          <div className="anim-screen-slide" style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: colors.waybillPaper }}>
            {/* Top Cream Stage with Hero Truck Image */}
            <div style={{ padding: '14px 16px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <button
                  onClick={() => setScreen('vehicles')}
                  aria-label="Back"
                  style={{ width: '36px', height: '36px', borderRadius: '4px', border: `1px solid ${colors.grey200}`, backgroundColor: colors.roadWhite, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <ArrowLeft size={18} />
                </button>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, color: colors.gravelGrey }}>
                  SPECIFICATIONS
                </span>
                <button
                  onClick={() => setScreen('home')}
                  aria-label="Close"
                  style={{ width: '36px', height: '36px', borderRadius: '4px', border: `1px solid ${colors.grey200}`, backgroundColor: colors.roadWhite, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <X size={18} />
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', padding: '6px 0 12px' }}>
                <img
                  src={
                    vehicleType === 'crane_truck'
                      ? '/trucks/heavy-plant.jpg'
                      : vehicleType === 'container_carrier'
                      ? '/trucks/container-carrier.jpg'
                      : '/trucks/book-truck.jpg'
                  }
                  alt={VEHICLE_LABELS[vehicleType]}
                  style={{ width: '270px', height: '140px', objectFit: 'contain', mixBlendMode: 'multiply' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                  <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '26px', fontWeight: 700, color: colors.asphalt, lineHeight: 1.1 }}>
                    {VEHICLE_LABELS[vehicleType]}
                  </h1>
                  <div style={{ fontSize: '13px', color: colors.gravelGrey, marginTop: '2px' }}>
                    {VEHICLE_USE[vehicleType]}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 700, color: colors.asphalt }}>
                    GH₵{VEHICLE_ESTIMATES[vehicleType].fromGhs}
                  </span>
                  <span style={{ fontSize: '11px', color: colors.gravelGrey }}>+</span>
                </div>
              </div>
            </div>

            {/* Dark Asphalt Bottom Sheet */}
            <div
              style={{
                flex: 1,
                backgroundColor: colors.asphalt,
                color: colors.roadWhite,
                borderTopLeftRadius: '18px',
                borderTopRightRadius: '18px',
                padding: '20px 18px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
                  Truck Overview
                </div>

                {/* 3 Spec Pills */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '20px' }}>
                  <div style={{ backgroundColor: colors.asphaltLight, borderRadius: '6px', padding: '10px', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Truck size={14} color={colors.safetyAmber} />
                    <span>{VEHICLE_CAPACITY[vehicleType].replace('Up to ', '')}</span>
                  </div>
                  <div style={{ backgroundColor: colors.asphaltLight, borderRadius: '6px', padding: '10px', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldCheck size={14} color={colors.safetyAmber} />
                    <span>DVLA Verified</span>
                  </div>
                  <div style={{ backgroundColor: colors.asphaltLight, borderRadius: '6px', padding: '10px', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Navigation size={14} color={colors.safetyAmber} />
                    <span>Live GPS</span>
                  </div>
                </div>

                {/* Driver Preview Card (shows uploaded Driver Photo) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '10px', padding: '10px 12px', marginBottom: '18px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '999px', backgroundColor: colors.waybillPaper, border: `2px solid ${colors.safetyAmber}`, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {driverPhotoUrl ? (
                      <img src={driverPhotoUrl} alt={driverDisplayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <User size={20} color={colors.asphalt} />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: colors.roadWhite, display: 'flex', alignItems: 'center', gap: '5px' }}>
                      {driverDisplayName} <ShieldCheck size={14} color={colors.safetyAmber} />
                    </div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.75)' }}>
                      Verified Vagrova Operator
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
                  Haulage Plan
                </div>

                {/* 3 Plan Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '20px' }}>
                  {[
                    { id: 'single', title: 'Single Trip', price: 'Standard', desc: 'Point-to-point' },
                    { id: 'multiday', title: 'Multi-Day', price: 'Project', desc: 'Site standby' },
                    { id: 'assisted', title: 'With Loading', price: '+ Crane/Crew', desc: 'Full handling' },
                  ].map((plan) => {
                    const active = bookingPlan === plan.id;
                    return (
                      <button
                        key={plan.id}
                        onClick={() => setBookingPlan(plan.id as any)}
                        style={{
                          backgroundColor: colors.asphaltLight,
                          border: active ? `1.5px solid ${colors.safetyAmber}` : '1.5px solid transparent',
                          borderRadius: '6px',
                          padding: '12px 10px',
                          textAlign: 'left',
                          color: colors.roadWhite,
                        }}
                      >
                        <div style={{ fontFamily: 'var(--font-heading)', fontSize: '14px', fontWeight: 700, color: active ? colors.safetyAmber : colors.roadWhite }}>
                          {plan.title}
                        </div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, marginTop: '6px' }}>
                          {plan.price}
                        </div>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)', marginTop: '2px' }}>
                          {plan.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Bar: Price + Amber CTA */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '14px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>Estimated from</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '20px', fontWeight: 700, color: colors.roadWhite }}>
                    GH₵{VEHICLE_ESTIMATES[vehicleType].fromGhs}
                  </div>
                </div>
                <button
                  onClick={() => setScreen('load')}
                  style={{
                    flex: 1,
                    height: '52px',
                    backgroundColor: colors.safetyAmber,
                    color: colors.asphalt,
                    border: 'none',
                    borderRadius: '4px',
                    fontFamily: 'var(--font-heading)',
                    fontSize: '16px',
                    fontWeight: 700,
                  }}
                >
                  Continue to Load Details
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            SCREEN 4: LOAD DETAILS
           ════════════════════════════════════════════════════════════════════ */}
        {screen === 'load' && (
          <div className="anim-screen-slide" style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingBottom: '84px' }}>
            <header style={{ backgroundColor: colors.roadWhite, padding: '14px 16px', borderBottom: `1px solid ${colors.grey200}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button onClick={() => setScreen('vehicles')} style={{ width: '36px', height: '36px', borderRadius: '4px', border: `1px solid ${colors.grey200}`, backgroundColor: colors.grey100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ArrowLeft size={18} />
              </button>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: '17px', fontWeight: 700 }}>Load Details</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: colors.gravelGrey }}>STEP 3/5</span>
            </header>

            <div style={{ padding: '16px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
                {LOAD_CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const active = loadCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setLoadCategory(cat.id)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '9px 12px',
                        borderRadius: '4px',
                        border: `1px solid ${active ? colors.asphalt : colors.grey300}`,
                        backgroundColor: active ? colors.asphalt : colors.roadWhite,
                        color: active ? colors.safetyAmber : colors.asphalt,
                        fontSize: '13px',
                        fontWeight: 600,
                      }}
                    >
                      <Icon size={15} /> {cat.label}
                    </button>
                  );
                })}
              </div>

              <div style={{ backgroundColor: colors.roadWhite, border: `1px solid ${colors.grey200}`, borderRadius: '6px', padding: '16px', marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: colors.gravelGrey, textTransform: 'uppercase', marginBottom: '4px' }}>
                  Estimated Weight (Tonnes)
                </label>
                <input
                  type="number"
                  value={weightTonnes}
                  onChange={(e) => setWeightTonnes(e.target.value)}
                  style={{ width: '100%', height: '44px', border: `1px solid ${colors.grey300}`, borderRadius: '4px', padding: '0 12px', marginBottom: '12px' }}
                />

                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: colors.gravelGrey, textTransform: 'uppercase', marginBottom: '4px' }}>
                  Cargo Description
                </label>
                <textarea
                  value={loadDescription}
                  onChange={(e) => setLoadDescription(e.target.value)}
                  rows={3}
                  style={{ width: '100%', border: `1px solid ${colors.grey300}`, borderRadius: '4px', padding: '10px 12px' }}
                />
              </div>

              <div style={{ backgroundColor: colors.roadWhite, border: `1px solid ${colors.grey200}`, borderRadius: '6px', padding: '16px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { label: 'Oversized or wide load', checked: isOversized, set: setIsOversized },
                  { label: 'Loading help needed at pickup', checked: needLoadingHelp, set: setNeedLoadingHelp },
                  { label: 'Offloading help needed at delivery', checked: needOffloadingHelp, set: setNeedOffloadingHelp },
                  { label: 'Fragile or hazardous goods', checked: isHazardous, set: setIsHazardous },
                ].map((opt) => (
                  <label key={opt.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '14px', cursor: 'pointer' }}>
                    <span>{opt.label}</span>
                    <input type="checkbox" checked={opt.checked} onChange={(e) => opt.set(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: colors.asphalt }} />
                  </label>
                ))}
              </div>

              <button
                onClick={() => setScreen('photos')}
                style={{ width: '100%', height: '52px', backgroundColor: colors.safetyAmber, color: colors.asphalt, border: 'none', borderRadius: '4px', fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: 700 }}
              >
                Continue to Photos
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            SCREEN 5: PHOTOS UPLOAD
           ════════════════════════════════════════════════════════════════════ */}
        {screen === 'photos' && (
          <div className="anim-screen-slide" style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingBottom: '84px' }}>
            <header style={{ backgroundColor: colors.roadWhite, padding: '14px 16px', borderBottom: `1px solid ${colors.grey200}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button onClick={() => setScreen('load')} style={{ width: '36px', height: '36px', borderRadius: '4px', border: `1px solid ${colors.grey200}`, backgroundColor: colors.grey100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ArrowLeft size={18} />
              </button>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: '17px', fontWeight: 700 }}>Cargo Photos</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: colors.gravelGrey }}>STEP 4/5</span>
            </header>

            <div style={{ padding: '16px' }}>
              <p style={{ fontSize: '14px', color: colors.gravelGrey, marginBottom: '14px' }}>
                Show the whole load and where the truck must reach. Uploads compress automatically and resume if data drops.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                <button onClick={handleAddPhoto} style={{ height: '50px', backgroundColor: colors.asphalt, color: colors.roadWhite, border: 'none', borderRadius: '4px', fontSize: '14px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <Camera size={16} /> Take Photo
                </button>
                <button onClick={handleAddPhoto} style={{ height: '50px', backgroundColor: colors.roadWhite, color: colors.asphalt, border: `1px solid ${colors.grey300}`, borderRadius: '4px', fontSize: '14px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <Upload size={16} /> Gallery
                </button>
              </div>

              <div style={{ backgroundColor: colors.roadWhite, border: `1px solid ${colors.grey200}`, borderRadius: '6px', padding: '12px', marginBottom: '20px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: colors.gravelGrey, textTransform: 'uppercase', marginBottom: '8px' }}>
                  Attached ({photos.length}/8)
                </div>
                {photos.map((p) => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 6px', borderBottom: `1px solid ${colors.grey100}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Layers size={16} color={colors.gravelGrey} />
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 500 }}>{p.name}</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: colors.weighbridgeGreen }}>{p.size} · Uploaded</div>
                      </div>
                    </div>
                    <button onClick={() => setPhotos(photos.filter((x) => x.id !== p.id))} style={{ background: 'none', border: 'none', color: colors.rustRed }}>
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <PriceEstimateCard
                equipment={selectedEquipmentObj}
                mode="TRANSPORT"
                pickupAddress={pickupAddress}
                deliveryAddress={deliveryAddress}
              />

              <button
                disabled={requestSubmitting}
                onClick={async () => {
                  if (!authToken) {
                    setAuthError('Please verify your phone number to submit your booking request.');
                    setScreen('auth_phone');
                    return;
                  }
                  setRequestSubmitting(true);
                  try {
                    const res = await vagrovaApi.createJobRequest(authToken, {
                      serviceGroup: 'TRANSPORT',
                      equipmentTypeId: selectedEquipmentId || undefined,
                      vehicleType: vehicleType.toUpperCase(),
                      pickupAddress,
                      pickupContactName: customerName || 'Customer',
                      pickupContactPhone: pickupContactPhone || authPhone || '+233241234567',
                      deliveryAddress,
                      deliveryContactName: customerName || 'Receiver',
                      deliveryContactPhone: deliveryContactPhone || '+233559876543',
                      loadCategory,
                      description: loadDescription,
                      weightTonnes: Number(weightTonnes) || 10,
                      isOversized,
                      needLoadingHelp,
                      needOffloadingHelp,
                      isHazardous,
                    });
                    saveLastBooking({
                      equipmentId: selectedEquipmentId,
                      equipmentName: selectedEquipmentName,
                      serviceGroup: 'TRANSPORT',
                      pickupAddress,
                      deliveryAddress,
                    });
                    setSubmittedJobNumber(res.jobRequest.jobNumber);
                    pushNotification(
                      'Booking Submitted',
                      `Job ${res.jobRequest.jobNumber} sent to Vagrova dispatch.`,
                      'success',
                    );
                    setScreen('request_submitted');
                  } catch (err) {
                    pushNotification(
                      'Submission Failed',
                      err instanceof Error ? err.message : 'Failed to submit request to server.',
                      'error',
                    );
                  } finally {
                    setRequestSubmitting(false);
                  }
                }}
                style={{ width: '100%', height: '52px', backgroundColor: colors.safetyAmber, color: colors.asphalt, border: 'none', borderRadius: '4px', fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: 700 }}
              >
                {requestSubmitting ? 'Submitting Request...' : 'Submit Request for Quotation'}
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            SCREEN 6: CONSIGNMENT NOTE QUOTE & PAYMENT
           ════════════════════════════════════════════════════════════════════ */}
        {screen === 'quote' && (
          <div className="anim-screen-slide" style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingBottom: '84px' }}>
            <header style={{ backgroundColor: colors.roadWhite, padding: '14px 16px', borderBottom: `1px solid ${colors.grey200}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button onClick={() => setScreen('photos')} style={{ width: '36px', height: '36px', borderRadius: '4px', border: `1px solid ${colors.grey200}`, backgroundColor: colors.grey100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ArrowLeft size={18} />
              </button>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: '17px', fontWeight: 700 }}>Quotation Ready</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: colors.gravelGrey }}>STEP 5/5</span>
            </header>

            <div style={{ padding: '16px' }}>
              <ConsignmentNote
                jobNumber="VGJ-004829"
                title="Quotation"
                stamp="QUOTE"
                fields={[
                  { label: 'Vehicle Type', value: VEHICLE_LABELS[vehicleType] },
                  { label: 'Weight', value: `${weightTonnes} Tonnes` },
                  { label: 'Pickup', value: pickupAddress },
                  { label: 'Delivery', value: deliveryAddress },
                  { label: 'Load', value: loadDescription, wide: true },
                  { label: 'Total Quoted', value: 'GHS 6,850.00', mono: true },
                  { label: 'Deposit Due (50%)', value: 'GHS 3,425.00', mono: true },
                ]}
                footer={
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: colors.gravelGrey }}>
                    <span>Balance payable on delivery</span>
                    <strong style={{ fontFamily: 'var(--font-mono)', color: colors.asphalt }}>GHS 3,425.00</strong>
                  </div>
                }
              />

              <div style={{ marginTop: '16px', marginBottom: '14px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: colors.gravelGrey, textTransform: 'uppercase', marginBottom: '8px' }}>
                  Select Deposit Method
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                  {([
                    { id: 'momo', label: 'Mobile Money' },
                    { id: 'bank', label: 'Bank Transfer' },
                    { id: 'cash', label: 'Cash' },
                  ] as const).map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setPaymentMethod(m.id)}
                      style={{
                        height: '42px',
                        borderRadius: '4px',
                        border: `1px solid ${paymentMethod === m.id ? colors.asphalt : colors.grey300}`,
                        backgroundColor: paymentMethod === m.id ? colors.asphalt : colors.roadWhite,
                        color: paymentMethod === m.id ? colors.safetyAmber : colors.asphalt,
                        fontSize: '13px',
                        fontWeight: 600,
                      }}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
                {paymentMethod === 'momo' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                    {(['MTN MoMo', 'Telecel Cash', 'AT Money'] as const).map((net) => (
                      <button
                        key={net}
                        onClick={() => setMomoNetwork(net)}
                        style={{
                          height: '38px',
                          borderRadius: '4px',
                          border: `1px solid ${momoNetwork === net ? colors.safetyAmber : colors.grey300}`,
                          backgroundColor: momoNetwork === net ? '#FFF5D6' : colors.roadWhite,
                          fontSize: '12px',
                          fontWeight: 600,
                        }}
                      >
                        {net}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => setScreen('tracking')}
                style={{ width: '100%', height: '54px', backgroundColor: colors.safetyAmber, color: colors.asphalt, border: 'none', borderRadius: '4px', fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: 700 }}
              >
                Accept & Pay Deposit GHS 3,425.00
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            SCREEN 6B: CATEGORY B — MACHINERY RENTAL REQUEST FORM
           ════════════════════════════════════════════════════════════════════ */}
        {screen === 'machinery_request' && (
          <div className="anim-screen-slide" style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: colors.roadWhite }}>
            <header style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${colors.grey200}` }}>
              <button
                onClick={() => setScreen('home')}
                aria-label="Back"
                style={{ width: '36px', height: '36px', borderRadius: '6px', border: `1px solid ${colors.grey200}`, backgroundColor: colors.waybillPaper, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ArrowLeft size={18} />
              </button>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, color: colors.gravelGrey }}>
                MACHINERY RENTAL REQUEST
              </span>
              <div style={{ width: '36px' }} />
            </header>

            <div style={{ padding: '18px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: colors.gravelGrey, textTransform: 'uppercase' }}>Selected Equipment</div>
                <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', fontWeight: 800, color: colors.asphalt }}>
                  {selectedEquipmentName}
                </h1>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: colors.gravelGrey, textTransform: 'uppercase', marginBottom: '4px' }}>Project Location</label>
                <input value={projectLocation} onChange={(e) => setProjectLocation(e.target.value)} style={{ width: '100%', height: '42px', padding: '0 12px', borderRadius: '6px', border: `1px solid ${colors.grey200}`, backgroundColor: colors.waybillPaper }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: colors.gravelGrey, textTransform: 'uppercase', marginBottom: '4px' }}>Description of Work</label>
                <textarea rows={2} value={workDescription} onChange={(e) => setWorkDescription(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: `1px solid ${colors.grey200}`, backgroundColor: colors.waybillPaper }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: colors.gravelGrey, textTransform: 'uppercase', marginBottom: '4px' }}>Start Date</label>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ width: '100%', height: '42px', padding: '0 8px', borderRadius: '6px', border: `1px solid ${colors.grey200}`, backgroundColor: colors.waybillPaper, fontSize: '13px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: colors.gravelGrey, textTransform: 'uppercase', marginBottom: '4px' }}>Duration</label>
                  <input type="number" min={1} value={expectedDuration} onChange={(e) => setExpectedDuration(e.target.value)} style={{ width: '100%', height: '42px', padding: '0 10px', borderRadius: '6px', border: `1px solid ${colors.grey200}`, backgroundColor: colors.waybillPaper }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: colors.gravelGrey, textTransform: 'uppercase', marginBottom: '4px' }}>Unit</label>
                  <select value={durationUnit} onChange={(e) => setDurationUnit(e.target.value as any)} style={{ width: '100%', height: '42px', padding: '0 8px', borderRadius: '6px', border: `1px solid ${colors.grey200}`, backgroundColor: colors.waybillPaper, fontSize: '13px' }}>
                    <option value="HOURS">Hours</option>
                    <option value="DAYS">Days</option>
                    <option value="WEEKS">Weeks</option>
                    <option value="MONTHS">Months</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: colors.gravelGrey, textTransform: 'uppercase', marginBottom: '4px' }}>Working Capacity</label>
                  <input value={workingCapacity} onChange={(e) => setWorkingCapacity(e.target.value)} style={{ width: '100%', height: '42px', padding: '0 10px', borderRadius: '6px', border: `1px solid ${colors.grey200}`, backgroundColor: colors.waybillPaper, fontSize: '13px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: colors.gravelGrey, textTransform: 'uppercase', marginBottom: '4px' }}>Fuel Arrangement</label>
                  <select value={fuelArrangement} onChange={(e) => setFuelArrangement(e.target.value as any)} style={{ width: '100%', height: '42px', padding: '0 8px', borderRadius: '6px', border: `1px solid ${colors.grey200}`, backgroundColor: colors.waybillPaper, fontSize: '13px' }}>
                    <option value="COMPANY_SUPPLIED">Company Supplied</option>
                    <option value="CUSTOMER_SUPPLIED">Customer Supplied</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: colors.gravelGrey, textTransform: 'uppercase', marginBottom: '4px' }}>Site Accessibility & Terrain</label>
                <input value={siteAccessibility} onChange={(e) => setSiteAccessibility(e.target.value)} style={{ width: '100%', height: '42px', padding: '0 12px', borderRadius: '6px', border: `1px solid ${colors.grey200}`, backgroundColor: colors.waybillPaper }} />
              </div>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600 }}>
                  <input type="checkbox" checked={operatorRequired} onChange={(e) => setOperatorRequired(e.target.checked)} />
                  Include Certified Operator
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600 }}>
                  <input type="checkbox" checked={transportNeeded} onChange={(e) => setTransportNeeded(e.target.checked)} />
                  Include Lowbed Mobilisation
                </label>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: colors.gravelGrey, textTransform: 'uppercase', marginBottom: '4px' }}>Special Instructions</label>
                <input value={specialInstructions} onChange={(e) => setSpecialInstructions(e.target.value)} placeholder="Safety permits, site contact, shift hours..." style={{ width: '100%', height: '42px', padding: '0 12px', borderRadius: '6px', border: `1px solid ${colors.grey200}`, backgroundColor: colors.waybillPaper }} />
              </div>

              <PriceEstimateCard
                equipment={selectedEquipmentObj}
                mode="MACHINERY"
                durationValue={expectedDuration}
                durationUnit={durationUnit}
                includeMobilisation={transportNeeded}
              />

              <button
                disabled={requestSubmitting}
                onClick={async () => {
                  if (!authToken) {
                    setAuthError('Please verify your phone number to submit your machinery request.');
                    setScreen('auth_phone');
                    return;
                  }
                  setRequestSubmitting(true);
                  try {
                    const res = await vagrovaApi.createJobRequest(authToken, {
                      serviceGroup: 'MACHINERY',
                      equipmentTypeId: selectedEquipmentId || undefined,
                      vehicleType: 'LOWBED',
                      pickupAddress: projectLocation,
                      pickupContactName: customerName || 'Site Manager',
                      pickupContactPhone: authPhone || '+233241234567',
                      deliveryAddress: projectLocation,
                      deliveryContactName: customerName || 'Site Manager',
                      deliveryContactPhone: authPhone || '+233241234567',
                      loadCategory: 'MACHINERY_RENTAL',
                      description: `${selectedEquipmentName}: ${workDescription}`,
                      weightTonnes: 20,
                      projectDetail: {
                        projectLocation,
                        workDescription,
                        startDate,
                        expectedDuration: Number(expectedDuration) || 1,
                        durationUnit,
                        workingCapacity,
                        siteAccessibility,
                        operatorRequired,
                        fuelArrangement,
                        transportNeeded,
                        specialInstructions,
                      },
                    });
                    saveLastBooking({
                      equipmentId: selectedEquipmentId,
                      equipmentName: selectedEquipmentName,
                      serviceGroup: 'TRANSPORT',
                      pickupAddress,
                      deliveryAddress,
                    });
                    setSubmittedJobNumber(res.jobRequest.jobNumber);
                    setScreen('request_submitted');
                  } catch (err) {
                    pushNotification(
                      'Submission Failed',
                      err instanceof Error ? err.message : 'Failed to submit machinery request.',
                      'error',
                    );
                  } finally {
                    setRequestSubmitting(false);
                  }
                }}
                style={{
                  width: '100%',
                  height: '52px',
                  borderRadius: '10px',
                  backgroundColor: colors.safetyAmber,
                  color: colors.asphalt,
                  border: 'none',
                  fontFamily: 'var(--font-heading)',
                  fontSize: '16px',
                  fontWeight: 800,
                  marginTop: '6px',
                }}
              >
                {requestSubmitting ? 'Submitting Request...' : 'Submit Machinery Request'}
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            SCREEN 6B-2: CARGO STATION (HUB-TO-HUB / STAGING FREIGHT)
           ════════════════════════════════════════════════════════════════════ */}
        {screen === 'cargo_station_request' && (
          <div className="anim-screen-slide" style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: colors.roadWhite }}>
            <header style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${colors.grey200}` }}>
              <button
                onClick={() => setScreen('home')}
                aria-label="Back"
                style={{ width: '36px', height: '36px', borderRadius: '6px', border: `1px solid ${colors.grey200}`, backgroundColor: colors.waybillPaper, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ArrowLeft size={18} />
              </button>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, color: colors.gravelGrey }}>
                CARGO STATION · HUB FREIGHT
              </span>
              <div style={{ width: '36px' }} />
            </header>

            <div style={{ padding: '18px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: colors.gravelGrey, textTransform: 'uppercase' }}>Consolidated Freight</div>
                <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', fontWeight: 800, color: colors.asphalt }}>
                  Cargo Station Booking
                </h1>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: colors.gravelGrey, textTransform: 'uppercase', marginBottom: '4px' }}>Vagrova Station / Hub</label>
                <select value={stationHub} onChange={(e) => setStationHub(e.target.value)} style={{ width: '100%', height: '42px', padding: '0 10px', borderRadius: '6px', border: `1px solid ${colors.grey200}`, backgroundColor: colors.waybillPaper }}>
                  <option value="Tema Port Hub">Tema Port Hub</option>
                  <option value="Accra Spintex Hub">Accra Spintex Hub</option>
                  <option value="Kumasi Asafo Hub">Kumasi Asafo Hub</option>
                  <option value="Takoradi Harbor Hub">Takoradi Harbor Hub</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: colors.gravelGrey, textTransform: 'uppercase', marginBottom: '4px' }}>Service Mode</label>
                <select value={stationMode} onChange={(e) => setStationMode(e.target.value)} style={{ width: '100%', height: '42px', padding: '0 10px', borderRadius: '6px', border: `1px solid ${colors.grey200}`, backgroundColor: colors.waybillPaper }}>
                  <option value="Hub-to-Hub Consolidated Freight">Hub-to-Hub Consolidated Freight</option>
                  <option value="Drop-off at Station for Haulage">Drop-off at Station for Scheduled Haulage</option>
                  <option value="Yard Staging & Holding">Yard Staging & Holding</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: colors.gravelGrey, textTransform: 'uppercase', marginBottom: '4px' }}>Final Destination</label>
                <input value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} style={{ width: '100%', height: '42px', padding: '0 12px', borderRadius: '6px', border: `1px solid ${colors.grey200}`, backgroundColor: colors.waybillPaper }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: colors.gravelGrey, textTransform: 'uppercase', marginBottom: '4px' }}>Est. Weight (Tonnes)</label>
                  <input type="number" min={0.5} step={0.5} value={weightTonnes} onChange={(e) => setWeightTonnes(e.target.value)} style={{ width: '100%', height: '42px', padding: '0 10px', borderRadius: '6px', border: `1px solid ${colors.grey200}`, backgroundColor: colors.waybillPaper }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: colors.gravelGrey, textTransform: 'uppercase', marginBottom: '4px' }}>Staging Days</label>
                  <input type="number" min={0} value={stationStagingDays} onChange={(e) => setStationStagingDays(e.target.value)} style={{ width: '100%', height: '42px', padding: '0 10px', borderRadius: '6px', border: `1px solid ${colors.grey200}`, backgroundColor: colors.waybillPaper }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: colors.gravelGrey, textTransform: 'uppercase', marginBottom: '4px' }}>Cargo Description</label>
                <textarea rows={2} value={loadDescription} onChange={(e) => setLoadDescription(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: `1px solid ${colors.grey200}`, backgroundColor: colors.waybillPaper }} />
              </div>

              <PriceEstimateCard
                equipment={selectedEquipmentObj}
                mode="CARGO_STATION"
                stagingDays={stationStagingDays}
              />

              <button
                disabled={requestSubmitting}
                onClick={async () => {
                  if (!authToken) {
                    setAuthError('Please verify your phone number to submit your Cargo Station request.');
                    setScreen('auth_phone');
                    return;
                  }
                  setRequestSubmitting(true);
                  try {
                    const res = await vagrovaApi.createJobRequest(authToken, {
                      serviceGroup: 'TRANSPORT',
                      equipmentTypeId: selectedEquipmentId || undefined,
                      vehicleType: 'CONTAINER_CARRIER',
                      pickupAddress: stationHub,
                      pickupContactName: customerName || 'Customer',
                      pickupContactPhone: authPhone || '+233241234567',
                      deliveryAddress,
                      deliveryContactName: customerName || 'Receiver',
                      deliveryContactPhone: deliveryContactPhone || '+233559876543',
                      loadCategory: 'CARGO_STATION',
                      description: `${stationMode}: ${loadDescription}`,
                      weightTonnes: Number(weightTonnes) || 5,
                      extraStopsJson: {
                        stationHub,
                        stationMode,
                        stagingDays: Number(stationStagingDays) || 0,
                      },
                    });
                    saveLastBooking({
                      equipmentId: selectedEquipmentId,
                      equipmentName: selectedEquipmentName,
                      serviceGroup: 'TRANSPORT',
                      pickupAddress,
                      deliveryAddress,
                    });
                    setSubmittedJobNumber(res.jobRequest.jobNumber);
                    setScreen('request_submitted');
                  } catch (err) {
                    pushNotification(
                      'Submission Failed',
                      err instanceof Error ? err.message : 'Failed to submit Cargo Station request.',
                      'error',
                    );
                  } finally {
                    setRequestSubmitting(false);
                  }
                }}
                style={{
                  width: '100%',
                  height: '52px',
                  borderRadius: '10px',
                  backgroundColor: colors.safetyAmber,
                  color: colors.asphalt,
                  border: 'none',
                  fontFamily: 'var(--font-heading)',
                  fontSize: '16px',
                  fontWeight: 800,
                  marginTop: '6px',
                }}
              >
                {requestSubmitting ? 'Submitting...' : 'Submit Cargo Station Request'}
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            SCREEN 6C: COMPANY-CONTROLLED REQUEST SUBMITTED CONFIRMATION
           ════════════════════════════════════════════════════════════════════ */}
        {screen === 'request_submitted' && (
          <div className="anim-screen-slide" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '24px', backgroundColor: colors.roadWhite, textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '999px', backgroundColor: colors.greenLight, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <CheckCircle2 size={34} color={colors.weighbridgeGreen} />
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, color: colors.gravelGrey, marginBottom: '6px' }}>
              BOOKING REF · {submittedJobNumber}
            </div>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', fontWeight: 800, color: colors.asphalt, marginBottom: '10px' }}>
              Request Submitted to Vagrova
            </h1>
            <p style={{ fontSize: '14px', color: colors.gravelGrey, lineHeight: 1.55, marginBottom: '22px' }}>
              Our Booking Officer is reviewing your <strong>{selectedEquipmentName}</strong> requirements. We will contact you shortly to finalize pricing and issue your official Quotation & Pro Forma Invoice.
            </p>
            <button
              onClick={() => setScreen('jobs')}
              style={{
                width: '100%',
                height: '50px',
                borderRadius: '10px',
                backgroundColor: colors.asphalt,
                color: colors.safetyAmber,
                border: 'none',
                fontWeight: 700,
                fontSize: '15px',
                marginBottom: '10px',
              }}
            >
              View My Booking Requests
            </button>
            <button
              onClick={() => setScreen('home')}
              style={{
                width: '100%',
                height: '46px',
                borderRadius: '10px',
                backgroundColor: colors.waybillPaper,
                color: colors.asphalt,
                border: `1px solid ${colors.grey200}`,
                fontWeight: 600,
                fontSize: '14px',
              }}
            >
              Back to Home
            </button>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            SCREEN 7: LIVE TRACKING
           ════════════════════════════════════════════════════════════════════ */}
        {screen === 'tracking' && (() => {
          const trackJob = selectedTrackingJob || myJobs[0] || null;
          if (!trackJob && !submittedJobNumber) {
            return (
              <div style={{ flex: 1, padding: '24px 16px', paddingBottom: '88px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: '12px' }}>
                <Truck size={36} color={colors.asphalt} />
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: 700, color: colors.asphalt }}>
                  No Active Trip Yet
                </div>
                <p style={{ fontSize: '13px', color: colors.gravelGrey, maxWidth: '280px' }}>
                  Book a truck or equipment rental to track live dispatch and GPS updates here.
                </p>
                <button
                  onClick={() => setScreen('home')}
                  style={{ backgroundColor: colors.safetyAmber, color: colors.asphalt, border: 'none', borderRadius: '8px', padding: '10px 18px', fontWeight: 800, fontSize: '13px' }}
                >
                  Book a Truck
                </button>
              </div>
            );
          }
          const assignedDriver = trackJob?.assignments?.[0]?.driver?.user?.name || driverDisplayName || 'Pending Dispatch';
          const assignedPhone = trackJob?.assignments?.[0]?.driver?.user?.phone || '+233248812290';
          const assignedPlate = trackJob?.assignments?.[0]?.vehicle?.plateNumber || 'PENDING';
          return (
            <LiveTrackingView
              jobNumber={trackJob?.jobNumber || submittedJobNumber}
              pickupLabel={trackJob?.pickupAddress || pickupAddress}
              dropoffLabel={trackJob?.deliveryAddress || deliveryAddress}
              liveCoords={liveCoords}
              liveTripStatus={liveTripStatus || trackJob?.status || null}
              driverName={assignedDriver}
              driverPhotoUrl={driverPhotoUrl}
              driverPhone={assignedPhone}
              plateNumber={assignedPlate}
              onBack={() => setScreen('home')}
            />
          );
        })()}

        {/* ════════════════════════════════════════════════════════════════════
            SCREEN 8: MY JOBS
           ════════════════════════════════════════════════════════════════════ */}
        {screen === 'jobs' && (
          <div style={{ flex: 1, padding: '16px', paddingBottom: '88px' }}>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', fontWeight: 700, marginBottom: '14px' }}>My Haulage Jobs</h1>
            {myJobs.length === 0 ? (
              <div style={{ backgroundColor: colors.roadWhite, border: `1px solid ${colors.grey200}`, borderRadius: '10px', padding: '24px 16px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: 700, color: colors.asphalt, marginBottom: '6px' }}>
                  No bookings yet
                </div>
                <p style={{ fontSize: '13px', color: colors.gravelGrey, marginBottom: '14px' }}>
                  {authToken ? 'Your submitted haulage and machinery bookings will appear here.' : 'Verify your phone number to view your real booking history.'}
                </p>
                <button
                  onClick={() => setScreen(authToken ? 'home' : 'auth_phone')}
                  style={{ backgroundColor: colors.safetyAmber, color: colors.asphalt, border: 'none', borderRadius: '8px', padding: '10px 16px', fontWeight: 800, fontSize: '13px' }}
                >
                  {authToken ? 'Book a Truck' : 'Sign In with Phone'}
                </button>
              </div>
            ) : (
              myJobs.map((j: any) => {
                const statusLower = String(j.status || 'requested').toLowerCase();
                const chipStatus =
                  statusLower === 'completed' || statusLower === 'delivered'
                    ? 'completed'
                    : statusLower === 'cancelled'
                    ? 'cancelled'
                    : 'heading_to_pickup';
                return (
                  <div
                    key={j.id}
                    onClick={() => {
                      setSelectedTrackingJob(j);
                      setActiveJobId(j.id);
                      setScreen('tracking');
                    }}
                    style={{ backgroundColor: colors.roadWhite, border: `1px solid ${colors.grey200}`, borderRadius: '8px', padding: '14px', marginBottom: '10px', cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700 }}>{j.jobNumber}</span>
                      <StatusChip status={chipStatus as any} size="sm" />
                    </div>
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: 700 }}>
                      {j.pickupAddress} → {j.deliveryAddress}
                    </div>
                    <div style={{ fontSize: '12px', color: colors.gravelGrey, marginTop: '2px' }}>
                      {j.equipmentType?.name || j.vehicleType} · {j.weightTonnes || 0}t
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            SCREEN 9: CALL ME BACK
           ════════════════════════════════════════════════════════════════════ */}
        {screen === 'callback' && (
          <div style={{ flex: 1, padding: '16px', paddingBottom: '88px' }}>
            <button onClick={() => setScreen('home')} style={{ width: '36px', height: '36px', borderRadius: '4px', border: `1px solid ${colors.grey200}`, backgroundColor: colors.roadWhite, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
              <ArrowLeft size={18} />
            </button>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>Request a call-back</h1>
            <p style={{ fontSize: '14px', color: colors.gravelGrey, marginBottom: '16px' }}>
              Leave your number. A Vagrova dispatcher will call within 5 minutes and book for you.
            </p>
            {callbackSent ? (
              <div style={{ backgroundColor: colors.greenLight, borderLeft: `4px solid ${colors.weighbridgeGreen}`, padding: '16px', borderRadius: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: colors.greenDark, marginBottom: '4px' }}>
                  <CheckCircle2 size={18} /> Call-back request queued
                </div>
                <div style={{ fontSize: '14px' }}>
                  Our desk will call <strong>{callbackPhone || '+233 24 450 1234'}</strong> shortly.
                </div>
              </div>
            ) : (
              <div style={{ backgroundColor: colors.roadWhite, border: `1px solid ${colors.grey200}`, borderRadius: '6px', padding: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: colors.gravelGrey, textTransform: 'uppercase', marginBottom: '6px' }}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 024 450 1234"
                  value={callbackPhone}
                  onChange={(e) => setCallbackPhone(e.target.value)}
                  style={{ width: '100%', height: '48px', border: `1px solid ${colors.grey300}`, borderRadius: '4px', padding: '0 12px', marginBottom: '12px' }}
                />
                <button
                  onClick={async () => {
                    try {
                      await vagrovaApi.requestCallback(callbackPhone || '+233244501234');
                    } catch {
                      // Graceful fallback when API server is offline in local UI preview
                    }
                    setCallbackSent(true);
                  }}
                  style={{ width: '100%', height: '52px', backgroundColor: colors.safetyAmber, color: colors.asphalt, border: 'none', borderRadius: '4px', fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: 700 }}
                >
                  Call Me Back Now
                </button>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            FLOATING BOTTOM NAVIGATION DOCK (Bolt / Qargo style) + CALL VAGROVA
           ════════════════════════════════════════════════════════════════════ */}
        {(screen === 'home' || screen === 'jobs' || screen === 'callback') && (
          <nav
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              margin: '0 auto',
              width: '100%',
              maxWidth: '460px',
              backgroundColor: colors.asphalt,
              borderTop: `1px solid ${colors.asphaltLight}`,
              padding: '8px 10px calc(8px + env(safe-area-inset-bottom, 0px))',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr 1.2fr',
              gap: '4px',
              boxShadow: '0 -6px 20px rgba(13, 109, 120, 0.16)',
              zIndex: 50,
            }}
          >
            <button
              onClick={() => setScreen('home')}
              style={{
                backgroundColor: screen === 'home' ? 'rgba(255,255,255,0.12)' : 'transparent',
                color: screen === 'home' ? colors.safetyAmber : 'rgba(255,255,255,0.7)',
                border: 'none',
                borderRadius: '4px',
                padding: '8px 4px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '3px',
                fontSize: '11px',
                fontWeight: 600,
              }}
            >
              <Home size={17} /> Home
            </button>
            <button
              onClick={() => setScreen('jobs')}
              style={{
                backgroundColor: screen === 'jobs' ? 'rgba(255,255,255,0.12)' : 'transparent',
                color: screen === 'jobs' ? colors.safetyAmber : 'rgba(255,255,255,0.7)',
                border: 'none',
                borderRadius: '4px',
                padding: '8px 4px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '3px',
                fontSize: '11px',
                fontWeight: 600,
              }}
            >
              <FileText size={17} /> Jobs
            </button>
            <button
              onClick={() => setScreen('tracking')}
              style={{
                backgroundColor: 'transparent',
                color: 'rgba(255,255,255,0.7)',
                border: 'none',
                borderRadius: '4px',
                padding: '8px 4px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '3px',
                fontSize: '11px',
                fontWeight: 600,
              }}
            >
              <Navigation size={17} /> Track
            </button>
            <a
              href="tel:+233302000000"
              style={{
                backgroundColor: colors.safetyAmber,
                color: colors.asphalt,
                borderRadius: '4px',
                textDecoration: 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px',
                fontSize: '11px',
                fontWeight: 700,
              }}
            >
              <Phone size={16} strokeWidth={2.4} /> Call Desk
            </a>
          </nav>
        )}
      </div>
    </div>
  );
}
