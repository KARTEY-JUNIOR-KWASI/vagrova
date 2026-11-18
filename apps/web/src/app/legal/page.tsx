'use client';

import React, { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { colors } from '@vagrova/ui';
import { ArrowLeft, CheckCircle2, FileText, Lock, RefreshCw, Cookie, Trash2 } from 'lucide-react';
import { vagrovaApi } from '@/lib/api';

type LegalTab = 'privacy' | 'terms' | 'refund' | 'cookies' | 'deletion';

const TABS: Array<{ id: LegalTab; label: string; icon: any }> = [
  { id: 'privacy', label: 'Privacy', icon: Lock },
  { id: 'terms', label: 'Terms', icon: FileText },
  { id: 'refund', label: 'Refunds', icon: RefreshCw },
  { id: 'cookies', label: 'Cookies', icon: Cookie },
  { id: 'deletion', label: 'Data Deletion', icon: Trash2 },
];

function LegalContent() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as LegalTab) || 'privacy';
  const [activeTab, setActiveTab] = useState<LegalTab>(
    TABS.some((t) => t.id === initialTab) ? initialTab : 'privacy',
  );

  const [delPhone, setDelPhone] = useState('');
  const [delReason, setDelReason] = useState('');
  const [delConfirm, setDelConfirm] = useState(false);
  const [delSubmitting, setDelSubmitting] = useState(false);
  const [delDone, setDelDone] = useState<string | null>(null);
  const [delError, setDelError] = useState<string | null>(null);

  useEffect(() => {
    const tab = searchParams.get('tab') as LegalTab;
    if (tab && TABS.some((t) => t.id === tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleDeletionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDelError(null);
    if (!delPhone.trim()) {
      setDelError('Please enter the phone number linked to your Vagrova account.');
      return;
    }
    if (!delConfirm) {
      setDelError('Please confirm that you understand account deletion is permanent.');
      return;
    }
    setDelSubmitting(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('vagrova_customer_token') || undefined : undefined;
      const res = await vagrovaApi.requestDataDeletion(delPhone.trim(), delReason.trim() || undefined, token);
      setDelDone(res.message || 'Your data deletion request has been logged and will be processed within 72 hours.');
      if (typeof window !== 'undefined') {
        localStorage.removeItem('vagrova_customer_token');
        localStorage.removeItem('vagrova_customer_name');
        localStorage.removeItem('vagrova_customer_company');
        localStorage.removeItem('vagrova_last_booking');
      }
    } catch (err: any) {
      setDelError(err?.message || 'Unable to submit deletion request right now.');
    } finally {
      setDelSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.waybillPaper, padding: '16px 14px 48px' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <Link
            href="/"
            aria-label="Back to Vagrova app"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: colors.roadWhite,
              border: `1px solid ${colors.grey200}`,
              borderRadius: '8px',
              padding: '8px 12px',
              color: colors.asphalt,
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: 700,
            }}
          >
            <ArrowLeft size={16} /> Back to Vagrova
          </Link>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, color: colors.gravelGrey }}>
            LEGAL &amp; COMPLIANCE
          </span>
        </header>

        <nav aria-label="Legal sections" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: active ? `1.5px solid ${colors.asphalt}` : `1px solid ${colors.grey200}`,
                  backgroundColor: active ? colors.asphalt : colors.roadWhite,
                  color: active ? colors.safetyAmber : colors.asphalt,
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <Icon size={14} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </nav>

        <main
          style={{
            backgroundColor: colors.roadWhite,
            border: `1px solid ${colors.grey200}`,
            borderRadius: '12px',
            padding: '22px 20px',
            color: colors.asphalt,
            lineHeight: 1.65,
            fontSize: '14px',
          }}
        >
          {activeTab === 'privacy' && (
            <section>
              <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', fontWeight: 800, marginBottom: '8px' }}>
                Privacy Policy
              </h1>
              <p style={{ fontSize: '12px', color: colors.gravelGrey, marginBottom: '14px' }}>
                Effective Date: November 2026 · Compliant with Ghana Data Protection Act, 2012 (Act 843)
              </p>
              <h2 style={{ fontSize: '15px', fontWeight: 700, marginTop: '14px', marginBottom: '4px' }}>1. Minimal Data We Collect</h2>
              <p>
                Vagrova collects only the information strictly necessary to dispatch heavy haulage and machinery: your phone number (for OTP authentication and dispatch updates), name/company name, pickup/drop-off locations, and optional email for PDF receipts.
              </p>
              <h2 style={{ fontSize: '15px', fontWeight: 700, marginTop: '14px', marginBottom: '4px' }}>2. No Third-Party Ad Tracking</h2>
              <p>
                We do not sell, rent, or share your personal data with third-party advertisers, data brokers, or analytics trackers. Operational SMS alerts are sent strictly for OTP verification and active booking updates.
              </p>
              <h2 style={{ fontSize: '15px', fontWeight: 700, marginTop: '14px', marginBottom: '4px' }}>3. Email &amp; SMS Opt-Out</h2>
              <p>
                Every optional promotional or receipt email includes a one-click unsubscribe link. You may also opt out or request full account deletion at any time using the <strong>Data Deletion</strong> tab.
              </p>
            </section>
          )}

          {activeTab === 'terms' && (
            <section>
              <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', fontWeight: 800, marginBottom: '8px' }}>
                Terms &amp; Conditions
              </h1>
              <p style={{ fontSize: '12px', color: colors.gravelGrey, marginBottom: '14px' }}>
                Effective Date: November 2026 · Republic of Ghana
              </p>
              <h2 style={{ fontSize: '15px', fontWeight: 700, marginTop: '14px', marginBottom: '4px' }}>1. Eligibility &amp; Age Requirement (18+)</h2>
              <p>
                Vagrova services are strictly for adults aged <strong>18 years and older</strong> and authorized business representatives. Minors under 18 may not create accounts or book commercial haulage or heavy machinery.
              </p>
              <h2 style={{ fontSize: '15px', fontWeight: 700, marginTop: '14px', marginBottom: '4px' }}>2. Transparent Pricing &amp; No Hidden Fees</h2>
              <p>
                All estimates show the itemized base dispatch, per-km/hourly/daily rate, and mobilisation fee before you submit. Final official quotations are confirmed in writing before payment or dispatch.
              </p>
              <h2 style={{ fontSize: '15px', fontWeight: 700, marginTop: '14px', marginBottom: '4px' }}>3. Cargo &amp; Site Safety</h2>
              <p>
                Clients must declare accurate cargo weights, dimensions, hazardous materials, and site access conditions. Prohibited or illegal cargo is strictly refused.
              </p>
            </section>
          )}

          {activeTab === 'refund' && (
            <section>
              <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', fontWeight: 800, marginBottom: '8px' }}>
                Refund &amp; Cancellation Policy
              </h1>
              <p style={{ fontSize: '12px', color: colors.gravelGrey, marginBottom: '14px' }}>
                Clear, fair cancellation and deposit protection rules
              </p>
              <ul style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li><strong>Before Driver Dispatch:</strong> 100% full refund of any booking deposit with zero penalty.</li>
                <li><strong>After Dispatch / En Route to Pickup:</strong> Only verified mobilisation fuel/distance cost incurred is deducted; remaining deposit is refunded within 3–5 business days.</li>
                <li><strong>Equipment Failure or No-Show by Operator:</strong> 100% full refund or immediate replacement truck/machine at no extra cost.</li>
              </ul>
            </section>
          )}

          {activeTab === 'cookies' && (
            <section>
              <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', fontWeight: 800, marginBottom: '8px' }}>
                Cookie &amp; Local Storage Policy
              </h1>
              <p style={{ marginBottom: '10px' }}>
                Vagrova uses only <strong>strictly essential</strong> browser storage (`localStorage` and service worker cache) to keep you signed in, remember your chosen language (`EN`/`TWI`/`GA`), and cache your offline PWA shell.
              </p>
              <p>
                We do <strong>not</strong> load third-party advertising cookies, social pixels, or cross-site trackers. OpenStreetMap tiles are fetched only when viewing a route map.
              </p>
            </section>
          )}

          {activeTab === 'deletion' && (
            <section>
              <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', fontWeight: 800, marginBottom: '8px' }}>
                Account &amp; Data Deletion Request
              </h1>
              <p style={{ marginBottom: '14px', color: colors.gravelGrey }}>
                Submit this form to permanently delete or anonymize your personal profile and local session data. Statutory financial/tax records required by law are retained only for the legally mandated period.
              </p>

              {delDone ? (
                <div style={{ backgroundColor: colors.greenLight, borderLeft: `4px solid ${colors.weighbridgeGreen}`, padding: '14px', borderRadius: '6px', color: colors.greenDark }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800 }}>
                    <CheckCircle2 size={18} /> Request Received
                  </div>
                  <p style={{ marginTop: '4px', fontSize: '13px' }}>{delDone}</p>
                </div>
              ) : (
                <form onSubmit={handleDeletionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label htmlFor="del-phone" style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                      Registered Phone Number
                    </label>
                    <input
                      id="del-phone"
                      type="tel"
                      placeholder="+233 24 000 0000"
                      value={delPhone}
                      onChange={(e) => setDelPhone(e.target.value)}
                      style={{ width: '100%', height: '44px', padding: '0 12px', borderRadius: '6px', border: `1px solid ${colors.grey300}` }}
                    />
                  </div>
                  <div>
                    <label htmlFor="del-reason" style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                      Reason (Optional)
                    </label>
                    <input
                      id="del-reason"
                      type="text"
                      placeholder="Optional feedback..."
                      value={delReason}
                      onChange={(e) => setDelReason(e.target.value)}
                      style={{ width: '100%', height: '44px', padding: '0 12px', borderRadius: '6px', border: `1px solid ${colors.grey300}` }}
                    />
                  </div>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={delConfirm}
                      onChange={(e) => setDelConfirm(e.target.checked)}
                      style={{ marginTop: '3px' }}
                    />
                    <span>I confirm I want to permanently delete my Vagrova account and personal data.</span>
                  </label>
                  {delError && (
                    <div style={{ backgroundColor: colors.redLight, color: colors.rustRed, padding: '10px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: 600 }}>
                      {delError}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={delSubmitting}
                    style={{
                      height: '46px',
                      backgroundColor: colors.rustRed,
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '14px',
                      cursor: 'pointer',
                    }}
                  >
                    {delSubmitting ? 'Submitting...' : 'Submit Data Deletion Request'}
                  </button>
                </form>
              )}
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

export default function LegalPage() {
  return (
    <Suspense fallback={<div style={{ padding: '24px', textAlign: 'center' }}>Loading legal information...</div>}>
      <LegalContent />
    </Suspense>
  );
}
